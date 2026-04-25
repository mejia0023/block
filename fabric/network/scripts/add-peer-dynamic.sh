#!/bin/bash
# add-peer-dynamic.sh — Despliega un nuevo peer desde cero usando OpenSSL + Docker
# Uso: bash add-peer-dynamic.sh PEER_NAME PEER_PORT COUCHDB_PORT
# Ej:  bash add-peer-dynamic.sh peer2 9051 7984

set -e

PEER_NAME="${1:?ERROR: falta PEER_NAME (ej: peer2)}"
PEER_PORT="${2:?ERROR: falta PEER_PORT (ej: 9051)}"
COUCHDB_PORT="${3:?ERROR: falta COUCHDB_PORT (ej: 7984)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

ORG_DOMAIN="ficct.edu.bo"
ORG_MSP="FICCTOrgMSP"
CHANNEL="evoting"
CC_NAME="evoting-cc"
CC_VERSION="1.0"
CHAINCODE_PORT=$((PEER_PORT + 1))
OPERATIONS_PORT=$((PEER_PORT + 393))

CRYPTO_DIR="$NETWORK_DIR/crypto-material"
PEER_ORG_DIR="$CRYPTO_DIR/peerOrganizations/$ORG_DOMAIN"
CA_CERT="$PEER_ORG_DIR/ca/ca.$ORG_DOMAIN-cert.pem"
CA_KEY="$PEER_ORG_DIR/ca/priv_sk"
TLSCA_CERT="$PEER_ORG_DIR/tlsca/tlsca.$ORG_DOMAIN-cert.pem"
TLSCA_KEY="$PEER_ORG_DIR/tlsca/priv_sk"
PEER_DIR="$PEER_ORG_DIR/peers/$PEER_NAME.$ORG_DOMAIN"

PEER_TLS_CA_CONTAINER="/crypto/peerOrganizations/$ORG_DOMAIN/peers/$PEER_NAME.$ORG_DOMAIN/tls/ca.crt"

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# ── Validaciones ──────────────────────────────────────────────────────────────
[ -d "$PEER_DIR" ] && error "Ya existe crypto para $PEER_NAME. Usa otro nombre."
[ -f "$CA_KEY"   ] || error "No se encontró la CA key en $CA_KEY. Ejecuta setup.sh primero."
command -v openssl &>/dev/null || error "openssl no encontrado en PATH"
command -v docker  &>/dev/null || error "docker no encontrado en PATH"

# Verificar que el puerto no está ocupado
docker ps --format '{{.Ports}}' | grep -q ":${PEER_PORT}->" \
  && error "Puerto $PEER_PORT ya está en uso por otro contenedor"

log "Desplegando $PEER_NAME.$ORG_DOMAIN en puerto $PEER_PORT..."

# ── 1. Certificados MSP (identidad del peer) ──────────────────────────────────
log "Generando certificados de identidad (MSP)..."
mkdir -p "$PEER_DIR/msp/"{cacerts,signcerts,keystore,tlscacerts,admincerts}

openssl ecparam -name prime256v1 -genkey -noout \
  -out "$PEER_DIR/msp/keystore/priv_sk" 2>/dev/null

openssl req -new \
  -key "$PEER_DIR/msp/keystore/priv_sk" \
  -out /tmp/${PEER_NAME}-msp.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=$ORG_DOMAIN/OU=peer/CN=$PEER_NAME.$ORG_DOMAIN" \
  2>/dev/null

cat > /tmp/${PEER_NAME}-msp.ext << EOF
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature
EOF

openssl x509 -req \
  -in  /tmp/${PEER_NAME}-msp.csr \
  -CA  "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$PEER_DIR/msp/signcerts/$PEER_NAME.$ORG_DOMAIN-cert.pem" \
  -days 3650 -sha256 -extfile /tmp/${PEER_NAME}-msp.ext \
  2>/dev/null

cp "$CA_CERT"    "$PEER_DIR/msp/cacerts/ca.$ORG_DOMAIN-cert.pem"
cp "$TLSCA_CERT" "$PEER_DIR/msp/tlscacerts/tlsca.$ORG_DOMAIN-cert.pem"

cat > "$PEER_DIR/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.$ORG_DOMAIN-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.$ORG_DOMAIN-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.$ORG_DOMAIN-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.$ORG_DOMAIN-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF

# ── 2. Certificados TLS ───────────────────────────────────────────────────────
log "Generando certificados TLS..."
mkdir -p "$PEER_DIR/tls"

openssl ecparam -name prime256v1 -genkey -noout \
  -out "$PEER_DIR/tls/server.key" 2>/dev/null

openssl req -new \
  -key "$PEER_DIR/tls/server.key" \
  -out /tmp/${PEER_NAME}-tls.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=$ORG_DOMAIN/CN=$PEER_NAME.$ORG_DOMAIN" \
  2>/dev/null

cat > /tmp/${PEER_NAME}-tls.ext << EOF
subjectAltName=DNS:$PEER_NAME.$ORG_DOMAIN,DNS:localhost,IP:127.0.0.1
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth,clientAuth
EOF

openssl x509 -req \
  -in  /tmp/${PEER_NAME}-tls.csr \
  -CA  "$TLSCA_CERT" -CAkey "$TLSCA_KEY" -CAcreateserial \
  -out "$PEER_DIR/tls/server.crt" \
  -days 3650 -sha256 -extfile /tmp/${PEER_NAME}-tls.ext \
  2>/dev/null

cp "$TLSCA_CERT" "$PEER_DIR/tls/ca.crt"

log "Certificados generados"

# ── 3. Contenedor CouchDB ─────────────────────────────────────────────────────
log "Iniciando CouchDB para $PEER_NAME (puerto $COUCHDB_PORT)..."
docker run -d \
  --name "couchdb-${PEER_NAME}" \
  --network evoting_network \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=adminpw \
  -p "${COUCHDB_PORT}:5984" \
  couchdb:3.3.3

sleep 5

# ── 4. Contenedor Peer ────────────────────────────────────────────────────────
log "Iniciando peer $PEER_NAME (puerto $PEER_PORT)..."

MSP_PATH="$PEER_DIR/msp"
TLS_PATH="$PEER_DIR/tls"

docker run -d \
  --name "$PEER_NAME.$ORG_DOMAIN" \
  --hostname "$PEER_NAME.$ORG_DOMAIN" \
  --network evoting_network \
  -p "${PEER_PORT}:${PEER_PORT}" \
  -p "${OPERATIONS_PORT}:${OPERATIONS_PORT}" \
  -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock \
  -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=evoting_network \
  -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e FABRIC_LOGGING_SPEC=INFO \
  -e CORE_PEER_TLS_ENABLED=true \
  -e CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt \
  -e CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt \
  -e "CORE_PEER_ID=$PEER_NAME.$ORG_DOMAIN" \
  -e "CORE_PEER_ADDRESS=$PEER_NAME.$ORG_DOMAIN:${PEER_PORT}" \
  -e "CORE_PEER_LISTENADDRESS=0.0.0.0:${PEER_PORT}" \
  -e "CORE_PEER_CHAINCODEADDRESS=$PEER_NAME.$ORG_DOMAIN:${CHAINCODE_PORT}" \
  -e "CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${CHAINCODE_PORT}" \
  -e "CORE_PEER_GOSSIP_BOOTSTRAP=peer0.$ORG_DOMAIN:7051" \
  -e "CORE_PEER_GOSSIP_EXTERNALENDPOINT=$PEER_NAME.$ORG_DOMAIN:${PEER_PORT}" \
  -e "CORE_PEER_LOCALMSPID=$ORG_MSP" \
  -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp \
  -e CORE_LEDGER_STATE_STATEDATABASE=CouchDB \
  -e "CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb-${PEER_NAME}:5984" \
  -e CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin \
  -e CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw \
  -e "CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:${OPERATIONS_PORT}" \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  -v "${MSP_PATH}:/etc/hyperledger/fabric/msp" \
  -v "${TLS_PATH}:/etc/hyperledger/fabric/tls" \
  hyperledger/fabric-peer:2.5

log "Esperando que $PEER_NAME inicie (15s)..."
sleep 15

docker ps --filter "name=$PEER_NAME.$ORG_DOMAIN" | grep -q "Up" \
  || error "$PEER_NAME no está corriendo. Revisa: docker logs $PEER_NAME.$ORG_DOMAIN"

# ── 5. Unir al canal ──────────────────────────────────────────────────────────
log "Uniendo $PEER_NAME al canal $CHANNEL..."
docker exec \
  -e "CORE_PEER_ADDRESS=$PEER_NAME.$ORG_DOMAIN:${PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=$PEER_TLS_CA_CONTAINER" \
  cli peer channel join -b "/channel-artifacts/${CHANNEL}.block"

# ── 6. Instalar chaincode ─────────────────────────────────────────────────────
log "Instalando chaincode en $PEER_NAME..."
docker exec cli peer lifecycle chaincode package \
  "/tmp/${CC_NAME}_${PEER_NAME}.tar.gz" \
  --path "/chaincode/evoting" \
  --lang node \
  --label "${CC_NAME}_${CC_VERSION}" 2>/dev/null || true

docker exec \
  -e "CORE_PEER_ADDRESS=$PEER_NAME.$ORG_DOMAIN:${PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=$PEER_TLS_CA_CONTAINER" \
  cli peer lifecycle chaincode install "/tmp/${CC_NAME}_${PEER_NAME}.tar.gz"

# ── 7. Output para el backend ─────────────────────────────────────────────────
echo ""
echo "DEPLOY_SUCCESS=true"
echo "PEER_ENDPOINT=localhost:${PEER_PORT}"
echo "PEER_HOST_ALIAS=$PEER_NAME.$ORG_DOMAIN"
echo "COUCHDB_URL=http://localhost:${COUCHDB_PORT}/_utils"
log "¡$PEER_NAME desplegado exitosamente!"
