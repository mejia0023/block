#!/bin/bash
# create-channel.sh — Crea un nuevo canal Fabric y despliega el chaincode en él
# Uso: bash create-channel.sh CHANNEL_NAME
# Ej:  bash create-channel.sh evoting-ficct

set -e

CHANNEL_NAME="${1:?ERROR: falta CHANNEL_NAME (ej: evoting-ficct)}"

# Fabric exige: minúsculas, alfanumérico + guiones, max 249 chars, empieza con letra
if ! echo "$CHANNEL_NAME" | grep -qE '^[a-z][a-z0-9-]{2,48}$'; then
  echo "ERROR: Nombre inválido. Usa minúsculas, letras/números/guiones, 3-49 chars, empieza con letra."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

ORG_DOMAIN="ficct.edu.bo"
CC_NAME="evoting-cc"
CC_VERSION="1.0"
CC_SEQUENCE=1
ORDERER_ADDR="orderer.${ORG_DOMAIN}:7050"
ORDERER_CA="/crypto/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp/tlscacerts/tlsca.${ORG_DOMAIN}-cert.pem"

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[CHANNEL]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

command -v docker &>/dev/null || error "docker no encontrado en PATH"
docker ps -q --filter "name=cli" | grep -q . || error "CLI container no está corriendo. Ejecuta setup.sh primero."

# ── Detectar primer peer activo ──────────────────────────────────────────────
ACTIVE_PEER=""
ACTIVE_PEER_PORT=""
ACTIVE_PEER_TLS=""
for _CTR in $(docker ps --format "{{.Names}}" | grep -E "^peer[0-9]+\.${ORG_DOMAIN}$" | sort); do
  _ADDR=$(docker inspect "$_CTR" -f '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | awk -F= '/^CORE_PEER_LISTENADDRESS=/ {print $2}')
  _PORT=$(echo "$_ADDR" | cut -d: -f2)
  if [ -n "$_PORT" ]; then
    ACTIVE_PEER="$_CTR"
    ACTIVE_PEER_PORT="$_PORT"
    ACTIVE_PEER_TLS="/crypto/peerOrganizations/${ORG_DOMAIN}/peers/${_CTR}/tls/ca.crt"
    break
  fi
done
[ -z "$ACTIVE_PEER" ] && error "No hay peers activos en Docker."
log "Usando peer activo: ${ACTIVE_PEER}:${ACTIVE_PEER_PORT}"

# Verificar que el canal no existe ya
if docker exec \
    -e "CORE_PEER_ADDRESS=${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
    -e "CORE_PEER_TLS_ROOTCERT_FILE=${ACTIVE_PEER_TLS}" \
    cli peer channel list 2>/dev/null | grep -q "^${CHANNEL_NAME}$"; then
  error "Canal '${CHANNEL_NAME}' ya existe."
fi

# ── 1. Copiar configtx.yaml al CLI (con paths absolutos) y generar channel.tx ─
log "Generando channel transaction para '${CHANNEL_NAME}'..."
docker exec cli mkdir -p /tmp/configtx

# Los paths en configtx.yaml son relativos a crypto-material/; dentro del CLI
# ese directorio está montado en /crypto, así que reemplazamos antes de copiar.
sed 's|crypto-material/|/crypto/|g' "$NETWORK_DIR/configtx.yaml" \
  > "/tmp/${CHANNEL_NAME}-configtx.yaml"
docker cp "/tmp/${CHANNEL_NAME}-configtx.yaml" cli:/tmp/configtx/configtx.yaml

docker exec cli configtxgen \
  -profile EvotingChannel \
  -outputCreateChannelTx "/channel-artifacts/${CHANNEL_NAME}.tx" \
  -channelID "${CHANNEL_NAME}" \
  -configPath /tmp/configtx

# ── 2. Crear el canal en el orderer ─────────────────────────────────────────
log "Creando canal en el orderer..."
docker exec \
  -e "CORE_PEER_ADDRESS=${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=${ACTIVE_PEER_TLS}" \
  cli peer channel create \
  -o "${ORDERER_ADDR}" \
  -c "${CHANNEL_NAME}" \
  -f "/channel-artifacts/${CHANNEL_NAME}.tx" \
  --tls --cafile "${ORDERER_CA}" \
  --outputBlock "/channel-artifacts/${CHANNEL_NAME}.block"

sleep 3

# ── 3. Unir todos los peers activos al canal ────────────────────────────────
log "Uniendo peers al canal '${CHANNEL_NAME}'..."
for PEER_CTR in $(docker ps --format "{{.Names}}" | grep -E "^peer[0-9]+\.${ORG_DOMAIN}$" | sort); do
  LISTEN_ADDR=$(docker inspect "$PEER_CTR" -f '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | awk -F= '/^CORE_PEER_LISTENADDRESS=/ {print $2}')
  PEER_PORT=$(echo "$LISTEN_ADDR" | cut -d: -f2)
  TLS_CERT="/crypto/peerOrganizations/${ORG_DOMAIN}/peers/${PEER_CTR}/tls/ca.crt"

  log "  Uniendo ${PEER_CTR}:${PEER_PORT}..."
  docker exec \
    -e "CORE_PEER_ADDRESS=${PEER_CTR}:${PEER_PORT}" \
    -e "CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CERT}" \
    cli peer channel join -b "/channel-artifacts/${CHANNEL_NAME}.block" \
    && log "  OK: ${PEER_CTR} unido" \
    || log "  [WARN] ${PEER_CTR}: join falló (puede que ya esté unido)"
done

# ── 4. Obtener Package ID usando el primer peer activo ──────────────────────
log "Buscando Package ID del chaincode en ${ACTIVE_PEER}..."
PACKAGE_ID=$(docker exec \
  -e "CORE_PEER_ADDRESS=${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=${ACTIVE_PEER_TLS}" \
  cli peer lifecycle chaincode queryinstalled 2>/dev/null \
  | grep "Package ID:" | grep "${CC_NAME}_" \
  | sed 's/.*Package ID: \([^,]*\).*/\1/' | head -1)

[ -z "$PACKAGE_ID" ] && error "Chaincode '${CC_NAME}' no instalado en ${ACTIVE_PEER}. Instálalo primero."
log "Package ID: ${PACKAGE_ID}"

# ── 5. Aprobar chaincode para la org en el nuevo canal ──────────────────────
log "Aprobando chaincode en canal '${CHANNEL_NAME}'..."
docker exec \
  -e "CORE_PEER_ADDRESS=${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=${ACTIVE_PEER_TLS}" \
  cli peer lifecycle chaincode approveformyorg \
  -o "${ORDERER_ADDR}" \
  --channelID "${CHANNEL_NAME}" \
  --name "${CC_NAME}" \
  --version "${CC_VERSION}" \
  --package-id "${PACKAGE_ID}" \
  --sequence "${CC_SEQUENCE}" \
  --tls --cafile "${ORDERER_CA}"

sleep 3

# ── 6. Commit chaincode en el nuevo canal ───────────────────────────────────
log "Confirmando chaincode en canal '${CHANNEL_NAME}'..."
docker exec \
  -e "CORE_PEER_ADDRESS=${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=${ACTIVE_PEER_TLS}" \
  cli peer lifecycle chaincode commit \
  -o "${ORDERER_ADDR}" \
  --channelID "${CHANNEL_NAME}" \
  --name "${CC_NAME}" \
  --version "${CC_VERSION}" \
  --sequence "${CC_SEQUENCE}" \
  --tls --cafile "${ORDERER_CA}" \
  --peerAddresses "${ACTIVE_PEER}:${ACTIVE_PEER_PORT}" \
  --tlsRootCertFiles "${ACTIVE_PEER_TLS}"

log "¡Canal '${CHANNEL_NAME}' creado con chaincode listo!"

echo ""
echo "CHANNEL_SUCCESS=true"
echo "CHANNEL_NAME=${CHANNEL_NAME}"
