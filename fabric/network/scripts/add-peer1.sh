#!/bin/bash
# add-peer1.sh — Agrega peer1.ficct.edu.bo a una red Fabric ya corriendo
# Prerequisitos: cryptogen en PATH, Docker corriendo, peer0 activo
# Ejecutar desde: fabric/network/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

CHANNEL_NAME="evoting"
CC_NAME="evoting-cc"
CC_VERSION="1.0"

ORDERER_CA="/crypto/ordererOrganizations/ficct.edu.bo/orderers/orderer.ficct.edu.bo/msp/tlscacerts/tlsca.ficct.edu.bo-cert.pem"
# Solo necesitamos el CA cert de peer1 para verificar su TLS (el MSP y credenciales del Admin vienen del CLI)
PEER1_TLS_CA="/crypto/peerOrganizations/ficct.edu.bo/peers/peer1.ficct.edu.bo/tls/ca.crt"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[ADD-PEER1]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Verificar herramientas ─────────────────────────────────────────────────
command -v cryptogen &>/dev/null || error "cryptogen no encontrado en PATH"
command -v docker    &>/dev/null || error "docker no encontrado"

# ── 1. Generar crypto material para peer1 ────────────────────────────────────
log "Generando certificados para peer1 con cryptogen extend..."
cd "$NETWORK_DIR"

if [ -d "crypto-material/peerOrganizations/ficct.edu.bo/peers/peer1.ficct.edu.bo" ]; then
    warn "Crypto material de peer1 ya existe — saltando generación"
else
    cryptogen extend --config=crypto-config.yaml --input=crypto-material
    log "Certificados de peer1 generados"
fi

# ── 2. Levantar couchdb1 y peer1 ─────────────────────────────────────────────
log "Levantando couchdb1 y peer1.ficct.edu.bo..."
docker-compose up -d couchdb1 peer1.ficct.edu.bo

log "Esperando que peer1 inicie (20s)..."
sleep 20

docker ps | grep "peer1.ficct.edu.bo" | grep -q "Up" \
    || error "peer1.ficct.edu.bo no está corriendo. Revisa: docker logs peer1.ficct.edu.bo"

log "peer1 está corriendo"

# ── 3. Verificar que el bloque del canal existe ──────────────────────────────
log "Verificando bloque del canal $CHANNEL_NAME..."
docker exec cli test -f /channel-artifacts/${CHANNEL_NAME}.block \
    || error "No existe /channel-artifacts/${CHANNEL_NAME}.block — ejecuta setup.sh primero"
log "Bloque encontrado"

# Reiniciar CLI para que recupere DNS tras el reinicio del orderer
log "Reiniciando CLI para recuperar conexión de red..."
docker restart cli
sleep 8

# ── 4. Unir peer1 al canal ───────────────────────────────────────────────────
# Solo cambia la dirección y el TLS rootcert — el MSP y credenciales del Admin
# vienen de las variables de entorno originales del CLI (FICCTOrgMSP/Admin)
log "Uniendo peer1 al canal $CHANNEL_NAME..."
docker exec \
    -e CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$PEER1_TLS_CA" \
    cli peer channel join \
    -b /channel-artifacts/${CHANNEL_NAME}.block

log "peer1 unido al canal"

# ── 5. Instalar chaincode en peer1 ───────────────────────────────────────────
log "Empaquetando chaincode..."
docker exec cli peer lifecycle chaincode package \
    "/tmp/${CC_NAME}_peer1.tar.gz" \
    --path "/chaincode/evoting" \
    --lang node \
    --label "${CC_NAME}_${CC_VERSION}"

log "Instalando chaincode en peer1..."
docker exec \
    -e CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$PEER1_TLS_CA" \
    cli peer lifecycle chaincode install "/tmp/${CC_NAME}_peer1.tar.gz"

log "Chaincode instalado en peer1"

# ── 6. Verificar canales en peer1 ────────────────────────────────────────────
log "Verificando canales de peer1..."
docker exec \
    -e CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$PEER1_TLS_CA" \
    cli peer channel list

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  peer1 agregado exitosamente!${NC}"
echo -e "${GREEN}  peer1:    localhost:8051${NC}"
echo -e "${GREEN}  CouchDB1: http://localhost:6984/_utils${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
