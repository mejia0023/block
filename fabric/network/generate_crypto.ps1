# generate_crypto.ps1 - Genera certificados y artefactos de Fabric usando Docker
# Ejecutar desde: C:\Disco D\9no Semestre\Ingenieria en Software II\1erParcial\Mejia\1erParcial\block\fabric\network

$NETWORK_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$CHAINCODE_DIR = Join-Path (Split-Path -Parent $NETWORK_DIR) "chaincode\evoting"
$CHANNEL_NAME = "evoting"

Write-Host "=== Generando material criptográfico ===" -ForegroundColor Green

# Limpiar material anterior
if (Test-Path "$NETWORK_DIR\crypto-material") {
    Remove-Item -Recurse -Force "$NETWORK_DIR\crypto-material"
}
if (Test-Path "$NETWORK_DIR\channel-artifacts") {
    Remove-Item -Recurse -Force "$NETWORK_DIR\channel-artifacts"
}

# Crear directorios
New-Item -ItemType Directory -Force -Path "$NETWORK_DIR\crypto-material" | Out-Null
New-Item -ItemType Directory -Force -Path "$NETWORK_DIR\channel-artifacts" | Out-Null

Write-Host "Generando certificados con cryptogen..." -ForegroundColor Cyan
docker run --rm `
    -v "${NETWORK_DIR}\crypto-material:/crypto" `
    -v "${NETWORK_DIR}\crypto-config.yaml:/tmp/crypto-config.yaml" `
    hyperledger/fabric-tools:2.5 cryptogen generate `
    --config=/tmp/crypto-config.yaml `
    --output=/crypto

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generando certificados" -ForegroundColor Red
    exit 1
}

Write-Host "Certificados generados exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Generando genesis block con configtxgen..." -ForegroundColor Cyan

docker run --rm `
    -v "${NETWORK_DIR}\crypto-material:/crypto" `
    -v "${NETWORK_DIR}\channel-artifacts:/channel-artifacts" `
    -v "${NETWORK_DIR}\configtx.yaml:/etc/hyperledger/fabric/configtx.yaml" `
    -e "FABRIC_CFG_PATH=/etc/hyperledger/fabric" `
    hyperledger/fabric-tools:2.5 configtxgen `
    -profile EvotingOrdererGenesis `
    -channelID system-channel `
    -outputBlock /channel-artifacts/genesis.block

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generando genesis block" -ForegroundColor Red
    exit 1
}

Write-Host "Generando channel tx..." -ForegroundColor Cyan
docker run --rm `
    -v "${NETWORK_DIR}\crypto-material:/crypto" `
    -v "${NETWORK_DIR}\channel-artifacts:/channel-artifacts" `
    -v "${NETWORK_DIR}\configtx.yaml:/etc/hyperledger/fabric/configtx.yaml" `
    -e "FABRIC_CFG_PATH=/etc/hyperledger/fabric" `
    hyperledger/fabric-tools:2.5 configtxgen `
    -profile EvotingChannel `
    -outputCreateChannelTx "/channel-artifacts/${CHANNEL_NAME}.tx" `
    -channelID "$CHANNEL_NAME"

Write-Host "Generando anchor peer update..." -ForegroundColor Cyan
docker run --rm `
    -v "${NETWORK_DIR}\crypto-material:/crypto" `
    -v "${NETWORK_DIR}\channel-artifacts:/channel-artifacts" `
    -v "${NETWORK_DIR}\configtx.yaml:/etc/hyperledger/fabric/configtx.yaml" `
    -e "FABRIC_CFG_PATH=/etc/hyperledger/fabric" `
    hyperledger/fabric-tools:2.5 configtxgen `
    -profile EvotingChannel `
    -outputAnchorPeersUpdate /channel-artifacts/FICCTOrgMSPanchors.tx `
    -channelID "$CHANNEL_NAME" `
    -asOrg FICCTOrg

Write-Host ""
Write-Host "=== ¡Material criptográfico generado exitosamente! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Write-Host "  - crypto-material/ (certificados)" -ForegroundColor Gray
Write-Host "  - channel-artifacts/genesis.block" -ForegroundColor Gray
Write-Host "  - channel-artifacts/${CHANNEL_NAME}.tx" -ForegroundColor Gray
Write-Host "  - channel-artifacts/FICCTOrgMSPanchors.tx" -ForegroundColor Gray
Write-Host ""
Write-Host "Ahora puedes ejecutar: docker-compose up -d" -ForegroundColor Cyan
