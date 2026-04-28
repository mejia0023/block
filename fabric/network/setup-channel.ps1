# setup-channel.ps1 - Crea canal, une peers y despliega chaincode
# Ejecutar desde: C:\Disco D\9no Semestre\Ingenieria en Software II\1erParcial\Mejia\1erParcial\block\fabric\network

$NETWORK_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$CHANNEL_NAME = "evoting"
$CC_NAME = "evoting-cc"
$CC_VERSION = "1.0"
$CC_SEQUENCE = 1

$ORDERER_CA = "/crypto/ordererOrganizations/ficct.edu.bo/orderers/orderer.ficct.edu.bo/msp/tlscacerts/tlsca.ficct.edu.bo-cert.pem"
$PEER0_TLS_ROOTCERT = "/crypto/peerOrganizations/ficct.edu.bo/peers/peer0.ficct.edu.bo/tls/ca.crt"

Write-Host "=== Configurando canal y chaincode ===" -ForegroundColor Green

# Esperar a que los contenedores estén listos
Write-Host "Esperando que los peers estén listos (30s)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# ── 1. Crear canal ─────────────────────────────────────────────────────────
Write-Host "Creando canal '$CHANNEL_NAME'..." -ForegroundColor Cyan
docker exec cli peer channel create `
    -o orderer.ficct.edu.bo:7050 `
    -c "$CHANNEL_NAME" `
    -f "/channel-artifacts/${CHANNEL_NAME}.tx" `
    --tls --cafile "$ORDERER_CA" `
    --outputBlock "/channel-artifacts/${CHANNEL_NAME}.block"

# ── 2. Unir peers al canal ────────────────────────────────────────────────
Write-Host "Uniendo peer0 al canal..." -ForegroundColor Cyan
docker exec -e CORE_PEER_ADDRESS=peer0.ficct.edu.bo:7051 `
    -e CORE_PEER_TLS_ROOTCERT_FILE="$PEER0_TLS_ROOTCERT" `
    cli peer channel join `
    -b "/channel-artifacts/${CHANNEL_NAME}.block"

Write-Host "Uniendo peer1 al canal..." -ForegroundColor Cyan
docker exec -e CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051 `
    -e CORE_PEER_TLS_ROOTCERT_FILE="/crypto/peerOrganizations/ficct.edu.bo/peers/peer1.ficct.edu.bo/tls/ca.crt" `
    cli peer channel join `
    -b "/channel-artifacts/${CHANNEL_NAME}.block"

# ── 3. Actualizar anchor peer ─────────────────────────────────────────────
Write-Host "Actualizando anchor peer..." -ForegroundColor Cyan
docker exec cli peer channel update `
    -o orderer.ficct.edu.bo:7050 `
    -c "$CHANNEL_NAME" `
    -f /channel-artifacts/FICCTOrgMSPanchors.tx `
    --tls --cafile "$ORDERER_CA"

# ── 4. Empaquetar chaincode ───────────────────────────────────────────────
Write-Host "Verificando fabric-nodeenv..." -ForegroundColor Cyan
$nodeenv = docker images hyperledger/fabric-nodeenv:2.5 -q
if (-not $nodeenv) {
    Write-Host "Descargando fabric-nodeenv:2.5..." -ForegroundColor Yellow
    docker pull hyperledger/fabric-nodeenv:2.5
}

Write-Host "Empaquetando chaincode..." -ForegroundColor Cyan
docker exec cli peer lifecycle chaincode package `
    "/tmp/${CC_NAME}.tar.gz" `
    --path "/chaincode" `
    --lang node `
    --label "${CC_NAME}_${CC_VERSION}"

# ── 5. Instalar chaincode ─────────────────────────────────────────────────
Write-Host "Instalando chaincode..." -ForegroundColor Cyan
docker exec cli peer lifecycle chaincode install "/tmp/${CC_NAME}.tar.gz"

# ── 6. Obtener Package ID ─────────────────────────────────────────────────
Write-Host "Obteniendo Package ID..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
$packageOutput = docker exec cli peer lifecycle chaincode queryinstalled 2>&1
$PACKAGE_ID = ($packageOutput | Select-String "${CC_NAME}_${CC_VERSION}" | ForEach-Object { $_.Line -replace '.*Package ID: ', '' -replace ', Label:.*', '' -replace '\s', '' })

if (-not $PACKAGE_ID) {
    Write-Host "Error: No se pudo obtener el Package ID" -ForegroundColor Red
    Write-Host "Output: $packageOutput" -ForegroundColor Gray
    exit 1
}

Write-Host "Package ID: $PACKAGE_ID" -ForegroundColor Green

# ── 7. Aprobar chaincode ──────────────────────────────────────────────────
Write-Host "Aprobando chaincode para FICCTOrg..." -ForegroundColor Cyan
docker exec cli peer lifecycle chaincode approveformyorg `
    -o orderer.ficct.edu.bo:7050 `
    --tls --cafile "$ORDERER_CA" `
    --channelID "$CHANNEL_NAME" `
    --name "$CC_NAME" `
    --version "$CC_VERSION" `
    --package-id "$PACKAGE_ID" `
    --sequence "$CC_SEQUENCE"

# ── 8. Confirmar chaincode ────────────────────────────────────────────────
Write-Host "Confirmando chaincode en el canal..." -ForegroundColor Cyan
docker exec cli peer lifecycle chaincode commit `
    -o orderer.ficct.edu.bo:7050 `
    --tls --cafile "$ORDERER_CA" `
    --channelID "$CHANNEL_NAME" `
    --name "$CC_NAME" `
    --version "$CC_VERSION" `
    --sequence "$CC_SEQUENCE" `
    --peerAddresses peer0.ficct.edu.bo:7051 `
    --tlsRootCertFiles "$PEER0_TLS_ROOTCERT"

# ── 9. Verificar ──────────────────────────────────────────────────────────
Write-Host "Verificando chaincode committed..." -ForegroundColor Cyan
docker exec cli peer lifecycle chaincode querycommitted `
    --channelID "$CHANNEL_NAME" `
    --name "$CC_NAME"

Write-Host ""
Write-Host "=== ¡Red Fabric configurada exitosamente! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Detalles:" -ForegroundColor Yellow
Write-Host "  Canal:     $CHANNEL_NAME" -ForegroundColor Gray
Write-Host "  Chaincode: $CC_NAME v$CC_VERSION" -ForegroundColor Gray
Write-Host "  Peer0:     localhost:7051" -ForegroundColor Gray
Write-Host "  Peer1:     localhost:8051" -ForegroundColor Gray
Write-Host "  CouchDB:   http://localhost:5984/_utils" -ForegroundColor Gray
Write-Host ""
