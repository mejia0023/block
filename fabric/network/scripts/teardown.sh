#!/bin/bash
# teardown.sh — Detiene y elimina la red Fabric completa

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

echo "[TEARDOWN] Deteniendo contenedores..."
cd "$NETWORK_DIR"
docker-compose down --volumes --remove-orphans

echo "[TEARDOWN] Eliminando chaincode containers residuales..."
docker ps -a | grep "dev-peer0.ficct" | awk '{print $1}' | xargs -r docker rm -f

echo "[TEARDOWN] Eliminando imágenes de chaincode..."
docker images | grep "dev-peer0.ficct" | awk '{print $3}' | xargs -r docker rmi -f

echo "[TEARDOWN] Limpiando artefactos generados..."
rm -rf "$NETWORK_DIR/crypto-material"
rm -rf "$NETWORK_DIR/channel-artifacts"
rm -rf "$NETWORK_DIR/fabric-ca"

echo "[TEARDOWN] Listo."
