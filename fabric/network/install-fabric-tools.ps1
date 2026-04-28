# install-fabric-tools.ps1
# Descarga los binarios de Hyperledger Fabric 2.5 para Windows (cryptogen, configtxgen, peer, etc.)
# Ejecutar UNA SOLA VEZ como administrador

$ErrorActionPreference = "Stop"

$FABRIC_VERSION = "2.5.12"
$INSTALL_DIR    = "$env:USERPROFILE\fabric-binaries"
$DOWNLOAD_URL   = "https://github.com/hyperledger/fabric/releases/download/v$FABRIC_VERSION/hyperledger-fabric-windows-amd64-$FABRIC_VERSION.tar.gz"
$TMP_FILE       = "$env:TEMP\fabric-$FABRIC_VERSION.tar.gz"

Write-Host "Instalando Hyperledger Fabric $FABRIC_VERSION binaries..." -ForegroundColor Cyan

# Crear directorio de instalacion
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\bin" | Out-Null

# Descargar
Write-Host "Descargando desde GitHub..." -ForegroundColor Yellow
Write-Host "URL: $DOWNLOAD_URL"
Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TMP_FILE -UseBasicParsing
Write-Host "Descarga completa" -ForegroundColor Green

# Extraer (requiere tar, disponible en Windows 10+)
Write-Host "Extrayendo binarios..." -ForegroundColor Yellow
tar -xzf $TMP_FILE -C $INSTALL_DIR
if ($LASTEXITCODE -ne 0) {
    # Fallback: usar 7zip si tar falla
    Write-Host "tar fallo, intentando con Expand-Archive..." -ForegroundColor Yellow
    # Renombrar a .zip para compatibilidad (no funciona con .tar.gz directamente)
    Write-Host "ERROR: Instala 7-Zip y ejecuta manualmente:" -ForegroundColor Red
    Write-Host "  7z x '$TMP_FILE' -o'$INSTALL_DIR'"
    exit 1
}

# Agregar al PATH del usuario
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$binPath = "$INSTALL_DIR\bin"
if ($currentPath -notmatch [regex]::Escape($binPath)) {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$binPath", "User")
    $env:PATH = "$env:PATH;$binPath"
    Write-Host "PATH actualizado" -ForegroundColor Green
} else {
    Write-Host "PATH ya contiene el directorio" -ForegroundColor Yellow
}

# Verificar instalacion
Write-Host ""
Write-Host "Verificando instalacion..." -ForegroundColor Cyan
& "$binPath\cryptogen.exe" version 2>&1 | Select-Object -First 1
& "$binPath\configtxgen.exe" --version 2>&1 | Select-Object -First 1

Write-Host ""
Write-Host "Binarios instalados en: $binPath" -ForegroundColor Green
Write-Host "IMPORTANTE: Reinicia PowerShell para que el PATH tenga efecto." -ForegroundColor Yellow
Write-Host ""
Write-Host "Herramientas disponibles:" -ForegroundColor Cyan
Write-Host "  cryptogen    - Genera material criptografico"
Write-Host "  configtxgen  - Genera genesis blocks y channel transactions"
Write-Host "  peer         - CLI del peer de Fabric"
