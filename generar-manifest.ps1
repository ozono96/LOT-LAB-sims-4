# =========================================================
# Script para generar automáticamente img/solares/manifest.json
# Escanea todas las carpetas en img/solares/ y extrae las imágenes
# =========================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = Get-Location }
Set-Location $ScriptDir

$solaresDir = Join-Path $ScriptDir "img\solares"
$manifestPath = Join-Path $solaresDir "manifest.json"

if (-not (Test-Path $solaresDir)) {
    Write-Host "Error: No se encontró el directorio $solaresDir" -ForegroundColor Red
    exit 1
}

Write-Host "Escaneando carpetas en img/solares..." -ForegroundColor Cyan

$manifest = [ordered]@{}
$carpetas = Get-ChildItem -Path $solaresDir -Directory | Sort-Object {
    if ($_.Name -match '^FS(\d+)$') { [int]$matches[1] } else { $_.Name }
}

$extensiones = @('.png', '.jpg', '.jpeg', '.webp')
$totalFotos = 0
$totalSolaresConFotos = 0

foreach ($carpeta in $carpetas) {
    $idSolar = $carpeta.Name
    $archivos = Get-ChildItem -Path $carpeta.FullName -File | Where-Object {
        $extensiones -contains $_.Extension.ToLower()
    } | Sort-Object Name

    if ($archivos.Count -gt 0) {
        $rutas = @()
        foreach ($archivo in $archivos) {
            # Guardamos ruta relativa con barras estándar para web
            $rutas += "img/solares/$idSolar/$($archivo.Name)"
            $totalFotos++
        }
        $manifest[$idSolar] = $rutas
        $totalSolaresConFotos++
    }
}

$json = $manifest | ConvertTo-Json -Depth 5

# Guardar en UTF-8 sin BOM
[System.IO.File]::WriteAllText($manifestPath, $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "¡Manifest generado con éxito!" -ForegroundColor Green
Write-Host "Solares procesados con fotos: $totalSolaresConFotos" -ForegroundColor Yellow
Write-Host "Total de fotos indexadas: $totalFotos" -ForegroundColor Yellow
Write-Host "Archivo guardado en: $manifestPath" -ForegroundColor White
