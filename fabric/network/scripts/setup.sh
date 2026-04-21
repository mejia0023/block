#!/bin/bash
# setup.sh — Levanta la red Hyperledger Fabric y despliega el chaincode evoting-cc
# Prerequisitos: cryptogen, configtxgen en PATH + Docker corriendo
# En Windows: ejecutar desde WSL2 o Git Bash con Docker Desktop

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
CHAINCODE_DIR="$(dirname "$NETWORK_DIR")/chaincode/evoting"

CHANNEL_NAME="evoting"
CC_NAME="evoting-cc"
CC_VERSION="1.0"
CC_SEQUENCE=1

ORDERER_CA="/crypto/ordererOrganizations/ficct.edu.bo/orderers/orderer.ficct.edu.bo/msp/tlscacerts/tlsca.ficct.edu.bo-cert.pem"
PEER_TLS_ROOTCERT="/crypto/peerOrganizations/ficct.edu.bo/peers/peer0.ficct.edu.bo/tls/ca.crt"

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[SETUP]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Verificar herramientas ──────────────────────────────────────────────
for tool in cryptogen configtxgen docker; do
    command -v "$tool" &>/dev/null || error "$tool no encontrado. Instala Fabric binaries: https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html"
done

# ── 1. Generar material criptográfico ─────────────────────────────────────
log "Generando material criptográfico..."
cd "$NETWORK_DIR"
rm -rf crypto-material
cryptogen generate --config=crypto-config.yaml --output=crypto-material

# ── 2. Generar artefactos del canal ───────────────────────────────────────
log "Generando genesis block y canal..."
mkdir -p channel-artifacts

export FABRIC_CFG_PATH="$NETWORK_DIR"

configtxgen \
    -profile EvotingOrdererGenesis \
    -channelID system-channel \
    -outputBlock channel-artifacts/genesis.block

configtxgen \
    -profile EvotingChannel \
    -outputCreateChannelTx "channel-artifacts/${CHANNEL_NAME}.tx" \
    -channelID "$CHANNEL_NAME"

configtxgen \
    -profile EvotingChannel \
    -outputAnchorPeersUpdate channel-artifacts/FICCTOrgMSPanchors.tx \
    -channelID "$CHANNEL_NAME" \
    -asOrg FICCTOrg

# ── 3. Compilar chaincode ─────────────────────────────────────────────────
log "Compilando chaincode TypeScript..."
cd "$CHAINCODE_DIR"
npm install
npm run build
log "Chaincode compilado en dist/"

# ── 4. Levantar contenedores Docker ───────────────────────────────────────
log "Iniciando contenedores Docker..."
cd "$NETWORK_DIR"
docker-compose up -d

log "Esperando que los contenedores inicien (30s)..."
sleep 30

# Esperar a que el peer responda antes de continuar
log "Verificando que el peer está listo..."
for i in $(seq 1 12); do
    if docker exec cli peer node status 2>/dev/null | grep -q "status:STARTED\|Successfully\|running"; then
        break
    fi
    if docker exec cli bash -c "cat /dev/tcp/peer0.ficct.edu.bo/7051" 2>/dev/null; then
        break
    fi
    echo "  Intento $i/12 — esperando peer (5s)..."
    sleep 5
done

# ── 5. Crear y unirse al canal ────────────────────────────────────────────
log "Creando canal '$CHANNEL_NAME'..."
docker exec cli peer channel create \
    -o orderer.ficct.edu.bo:7050 \
    -c "$CHANNEL_NAME" \
    -f "/channel-artifacts/${CHANNEL_NAME}.tx" \
    --tls --cafile "$ORDERER_CA" \
    --outputBlock "/channel-artifacts/${CHANNEL_NAME}.block" || true

# Retry join hasta 5 veces
log "Uniéndose al canal..."
for i in $(seq 1 5); do
    docker exec cli peer channel join \
        -b "/channel-artifacts/${CHANNEL_NAME}.block" && break
    echo "  Retry $i/5 — esperando peer (10s)..."
    sleep 10
done

log "Actualizando anchor peer..."
docker exec cli peer channel update \
    -o orderer.ficct.edu.bo:7050 \
    -c "$CHANNEL_NAME" \
    -f /channel-artifacts/FICCTOrgMSPanchors.tx \
    --tls --cafile "$ORDERER_CA"

# ── 6. Empaquetar e instalar chaincode ────────────────────────────────────
log "Verificando imagen fabric-nodeenv..."
docker image inspect hyperledger/fabric-nodeenv:2.5 > /dev/null 2>&1 \
    || docker pull hyperledger/fabric-nodeenv:2.5 \
    || true

log "Empaquetando chaincode..."
docker exec cli peer lifecycle chaincode package \
    "/tmp/${CC_NAME}.tar.gz" \
    --path "/chaincode/evoting" \
    --lang node \
    --label "${CC_NAME}_${CC_VERSION}"

log "Instalando chaincode..."
docker exec cli peer lifecycle chaincode install "/tmp/${CC_NAME}.tar.gz"

# ── 7. Obtener Package ID ─────────────────────────────────────────────────
sleep 3
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled 2>&1 \
    | grep "${CC_NAME}_${CC_VERSION}" \
    | sed 's/.*Package ID: //' \
    | sed 's/, Label:.*//' \
    | tr -d '[:space:]')

[ -z "$PACKAGE_ID" ] && error "No se pudo obtener el Package ID del chaincode"
log "Package ID: $PACKAGE_ID"

# ── 8. Aprobar y confirmar chaincode ──────────────────────────────────────
log "Aprobando chaincode para FICCTOrg..."
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.ficct.edu.bo:7050 \
    --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL_NAME" \
    --name "$CC_NAME" \
    --version "$CC_VERSION" \
    --package-id "$PACKAGE_ID" \
    --sequence "$CC_SEQUENCE"

log "Confirmando chaincode en el canal..."
docker exec cli peer lifecycle chaincode commit \
    -o orderer.ficct.edu.bo:7050 \
    --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL_NAME" \
    --name "$CC_NAME" \
    --version "$CC_VERSION" \
    --sequence "$CC_SEQUENCE" \
    --peerAddresses peer0.ficct.edu.bo:7051 \
    --tlsRootCertFiles "$PEER_TLS_ROOTCERT"

# ── 9. Verificar ──────────────────────────────────────────────────────────
log "Verificando chaincode committed..."
docker exec cli peer lifecycle chaincode querycommitted \
    --channelID "$CHANNEL_NAME" \
    --name "$CC_NAME"

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Red Fabric lista!${NC}"
echo -e "${GREEN}  Canal:     $CHANNEL_NAME${NC}"
echo -e "${GREEN}  Chaincode: $CC_NAME v$CC_VERSION${NC}"
echo -e "${GREEN}  Peer:      localhost:7051${NC}"
echo -e "${GREEN}  CouchDB:   http://localhost:5984/_utils${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
