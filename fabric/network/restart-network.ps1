# restart-network.ps1
# Levanta la red Hyperledger Fabric desde cero usando los artefactos ya commiteados.
# No requiere cryptogen ni configtxgen instalados localmente.
# Ejecutar desde: fabric\network\
# Prerequisito: Docker Desktop corriendo

param(
    [switch]$SkipBuild  # Saltar compilacion del chaincode (si ya esta compilado)
)

$ErrorActionPreference = "Stop"

# ── Constantes ────────────────────────────────────────────────────────────────
$CHANNEL     = "evoting"
$CC_NAME     = "evoting-cc"
$CC_VERSION  = "1.0"
$CC_SEQUENCE = "1"
$CC_LABEL    = "${CC_NAME}_${CC_VERSION}"

$ORDERER_CA = "/crypto/ordererOrganizations/ficct.edu.bo/orderers/orderer.ficct.edu.bo/msp/tlscacerts/tlsca.ficct.edu.bo-cert.pem"
$PEER0_TLS  = "/crypto/peerOrganizations/ficct.edu.bo/peers/peer0.ficct.edu.bo/tls/ca.crt"
$PEER1_TLS  = "/crypto/peerOrganizations/ficct.edu.bo/peers/peer1.ficct.edu.bo/tls/ca.crt"
$ADMIN_MSP  = "/crypto/peerOrganizations/ficct.edu.bo/users/Admin@ficct.edu.bo/msp"

function Log  { param($m) Write-Host "[OK]   $m" -ForegroundColor Green }
function Info { param($m) Write-Host "[....] $m" -ForegroundColor Cyan }
function Warn { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail { param($m) Write-Host "[ERR]  $m" -ForegroundColor Red; exit 1 }

function Exec-Cli {
    param([string[]]$Args)
    $result = docker exec cli @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $result
        return $false
    }
    Write-Host $result
    return $true
}

# ── 0. Verificar Docker ───────────────────────────────────────────────────────
Info "Verificando Docker..."
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Docker no esta corriendo. Inicia Docker Desktop primero." }
Log "Docker activo"

# ── 1. Compilar chaincode ─────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Info "Compilando chaincode TypeScript..."
    $chaincodeDir = Join-Path $PSScriptRoot "..\..\chaincode"
    Push-Location $chaincodeDir
    try {
        npm install --silent 2>&1 | Out-Null
        npm run build
        if ($LASTEXITCODE -ne 0) { Fail "npm run build del chaincode fallo" }
        Log "Chaincode compilado"
    } finally {
        Pop-Location
    }
} else {
    Warn "Build del chaincode omitido (-SkipBuild)"
}

# ── 2. Limpiar contenedores y volumenes anteriores ────────────────────────────
Info "Limpiando contenedores y volumenes anteriores..."
docker-compose down -v 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Limpiar contenedores de chaincode que puedan haber quedado
$ccContainers = docker ps -a --format "{{.Names}}" 2>&1 | Where-Object { $_ -match "dev-peer" }
if ($ccContainers) {
    $ccContainers | ForEach-Object { docker rm -f $_ 2>&1 | Out-Null }
    Log "Contenedores de chaincode anteriores eliminados"
}

# Limpiar imagenes de chaincode anteriores
$ccImages = docker images --format "{{.Repository}}:{{.Tag}}" 2>&1 | Where-Object { $_ -match "dev-peer" }
if ($ccImages) {
    $ccImages | ForEach-Object { docker rmi -f $_ 2>&1 | Out-Null }
    Log "Imagenes de chaincode anteriores eliminadas"
}
Log "Limpieza completa"

# ── 3. Iniciar contenedores ────────────────────────────────────────────────────
Info "Iniciando contenedores Docker..."
docker-compose up -d
if ($LASTEXITCODE -ne 0) { Fail "docker-compose up fallo" }

Info "Esperando 35s para que los nodos inicien completamente..."
Start-Sleep -Seconds 35

# Verificar que los contenedores criticos esten corriendo
$running = docker ps --format "{{.Names}}" 2>&1 | Out-String
if ($running -notmatch "orderer.ficct.edu.bo") { Fail "Orderer no esta corriendo. Revisa: docker logs orderer.ficct.edu.bo" }
if ($running -notmatch "peer0.ficct.edu.bo")   { Fail "Peer0 no esta corriendo. Revisa: docker logs peer0.ficct.edu.bo" }
if ($running -notmatch "peer1.ficct.edu.bo")   { Warn "Peer1 no esta corriendo (no critico para modo basico)" }
Log "Contenedores activos"

# ── 4. Crear canal ────────────────────────────────────────────────────────────
Info "Creando canal '$CHANNEL'..."
$ok = Exec-Cli peer, channel, create,
    "-o", "orderer.ficct.edu.bo:7050",
    "-c", $CHANNEL,
    "-f", "/channel-artifacts/$CHANNEL.tx",
    "--tls", "--cafile", $ORDERER_CA,
    "--outputBlock", "/channel-artifacts/$CHANNEL.block"
if (-not $ok) { Fail "peer channel create fallo" }
Log "Canal '$CHANNEL' creado"
Start-Sleep -Seconds 3

# ── 5. Unir peer0 al canal ────────────────────────────────────────────────────
Info "Uniendo peer0 al canal..."
$ok = Exec-Cli peer, channel, join, "-b", "/channel-artifacts/$CHANNEL.block"
if (-not $ok) { Fail "peer0 channel join fallo" }
Log "Peer0 unido al canal"

# ── 6. Configurar anchor peer ─────────────────────────────────────────────────
Info "Configurando anchor peer..."
$ok = Exec-Cli peer, channel, update,
    "-o", "orderer.ficct.edu.bo:7050",
    "-c", $CHANNEL,
    "-f", "/channel-artifacts/FICCTOrgMSPanchors.tx",
    "--tls", "--cafile", $ORDERER_CA
if (-not $ok) { Warn "Anchor peer update fallo (no critico)" } else { Log "Anchor peer configurado" }

# ── 7. Unir peer1 al canal ────────────────────────────────────────────────────
Info "Uniendo peer1 al canal..."
$p1Result = docker exec `
    -e "CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051" `
    -e "CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_TLS" `
    -e "CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP" `
    cli peer channel join -b "/channel-artifacts/$CHANNEL.block" 2>&1
if ($LASTEXITCODE -ne 0) {
    Warn "Peer1 channel join fallo (el sistema funciona con peer0 como fallback)"
    Write-Host $p1Result
} else {
    Log "Peer1 unido al canal"
}

# ── 8. Empaquetar chaincode ────────────────────────────────────────────────────
Info "Empaquetando chaincode '/chaincode' (VotingContract FicctVoting)..."
$ok = Exec-Cli peer, lifecycle, chaincode, package, "/tmp/$CC_NAME.tar.gz",
    "--path", "/chaincode",
    "--lang", "node",
    "--label", $CC_LABEL
if (-not $ok) { Fail "Chaincode package fallo" }
Log "Chaincode empaquetado"

# ── 9. Instalar en peer0 ──────────────────────────────────────────────────────
Info "Instalando chaincode en peer0..."
$ok = Exec-Cli peer, lifecycle, chaincode, install, "/tmp/$CC_NAME.tar.gz"
if (-not $ok) { Fail "Chaincode install en peer0 fallo" }
Log "Chaincode instalado en peer0"

# Instalar en peer1 (opcional pero recomendado)
Info "Instalando chaincode en peer1..."
$p1install = docker exec `
    -e "CORE_PEER_ADDRESS=peer1.ficct.edu.bo:8051" `
    -e "CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_TLS" `
    -e "CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP" `
    cli peer lifecycle chaincode install "/tmp/$CC_NAME.tar.gz" 2>&1
if ($LASTEXITCODE -ne 0) {
    Warn "Chaincode install en peer1 fallo (el sistema puede funcionar con peer0)"
} else {
    Log "Chaincode instalado en peer1"
}

# ── 10. Obtener Package ID ─────────────────────────────────────────────────────
Start-Sleep -Seconds 5
Info "Obteniendo Package ID..."
$queryOut = docker exec cli peer lifecycle chaincode queryinstalled 2>&1 | Out-String
$pkgLine  = ($queryOut -split "`n") | Where-Object { $_ -match [regex]::Escape($CC_LABEL) } | Select-Object -First 1
if (-not $pkgLine) {
    Write-Host $queryOut
    Fail "No se encontro Package ID para '$CC_LABEL'. Revisa la instalacion."
}
$PACKAGE_ID = ($pkgLine -replace ".*Package ID: ([^,]+).*", '$1').Trim()
Log "Package ID: $PACKAGE_ID"

# ── 11. Aprobar chaincode ─────────────────────────────────────────────────────
Info "Aprobando chaincode para FICCTOrg..."
$ok = Exec-Cli peer, lifecycle, chaincode, approveformyorg,
    "-o", "orderer.ficct.edu.bo:7050",
    "--tls", "--cafile", $ORDERER_CA,
    "--channelID", $CHANNEL,
    "--name", $CC_NAME,
    "--version", $CC_VERSION,
    "--package-id", $PACKAGE_ID,
    "--sequence", $CC_SEQUENCE
if (-not $ok) { Fail "Approve chaincode fallo" }
Log "Chaincode aprobado"

# ── 12. Commit chaincode ──────────────────────────────────────────────────────
Info "Confirmando chaincode en el canal..."
$ok = Exec-Cli peer, lifecycle, chaincode, commit,
    "-o", "orderer.ficct.edu.bo:7050",
    "--tls", "--cafile", $ORDERER_CA,
    "--channelID", $CHANNEL,
    "--name", $CC_NAME,
    "--version", $CC_VERSION,
    "--sequence", $CC_SEQUENCE,
    "--peerAddresses", "peer0.ficct.edu.bo:7051",
    "--tlsRootCertFiles", $PEER0_TLS
if (-not $ok) { Fail "Commit chaincode fallo" }
Log "Chaincode committed"

# ── 13. Verificar despliegue ──────────────────────────────────────────────────
Start-Sleep -Seconds 3
Info "Verificando chaincode deployed..."
Exec-Cli peer, lifecycle, chaincode, querycommitted, "--channelID", $CHANNEL, "--name", $CC_NAME | Out-Null

# ── Resumen ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Red Hyperledger Fabric lista!" -ForegroundColor Cyan
Write-Host "  Canal:       $CHANNEL" -ForegroundColor White
Write-Host "  Chaincode:   $CC_NAME v$CC_VERSION  [FicctVoting]" -ForegroundColor White
Write-Host "  Peer0:       localhost:7051" -ForegroundColor White
Write-Host "  Peer1:       localhost:8051" -ForegroundColor White
Write-Host "  CouchDB0:    http://localhost:5984/_utils" -ForegroundColor White
Write-Host "  CouchDB1:    http://localhost:6984/_utils" -ForegroundColor White
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso → iniciar el backend:" -ForegroundColor Yellow
Write-Host "  cd ..\..\backend && npm run start:dev" -ForegroundColor Yellow
Write-Host ""
