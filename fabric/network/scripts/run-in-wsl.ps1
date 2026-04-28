# run-in-wsl.ps1 - Wrapper para ejecutar scripts bash desde PowerShell en WSL
# Uso: .\run-in-wsl.ps1 script.sh arg1 arg2 ...

param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath,
    [Parameter(Mandatory=$false)]
    [string[]]$Arguments
)

# Convertir ruta de Windows a WSL
$wslPath = $ScriptPath -replace '\\', '/' -replace '^([A-Za-z]):', { '/mnt/' + $_.Groups[1].Value.ToLower() }

# Construir comando
$argString = $Arguments -join ' '
$cmd = "bash '$wslPath' $argString"

# Ejecutar en WSL
wsl bash -c "$cmd"
