# =========================================================
# Script para descargar todas las hojas de Google Sheets
# y generar el archivo estático data/database.json
# =========================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = Get-Location }
Set-Location $ScriptDir

$apiKey = $env:GOOGLE_SHEETS_API_KEY

# Si no está en variable de entorno, intentar leer desde archivo local .env
if (-not $apiKey) {
    $envFile = Join-Path $ScriptDir ".env"
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed -match '^\s*GOOGLE_SHEETS_API_KEY\s*=\s*(.+)$') {
                $apiKey = $matches[1].Trim().Trim('"').Trim("'")
                break
            }
        }
    }
}

if (-not $apiKey) {
    Write-Host "`n[ERROR] No se ha encontrado la API Key de Google Sheets." -ForegroundColor Red
    Write-Host "Configura la variable de entorno GOOGLE_SHEETS_API_KEY o crea un archivo .env en la raíz con:" -ForegroundColor Yellow
    Write-Host "GOOGLE_SHEETS_API_KEY=tu_clave_aqui`n" -ForegroundColor White
    exit 1
}

$sheetId = "1uGganU7wrnQQ0mHMMcKUg3HrRQUtEs73gTGd4NCIgvI"

$hojas = [ordered]@{
    "solares"               = "Solares"
    "mundos"                = "Listado de mundos"
    "packs"                 = "Listado de packs"
    "objetivos"             = "Listado de objetivos"
    "estilosArquitectonicos" = "Listado de estilos exteriores"
    "estilosDecoracion"     = "Listado de estilos interiores"
    "colores"               = "Listado de colores"
    "etapasVida"            = "Listado de etapas de vida"
    "limitantesConstruir"   = "Listado de limitantes modo construir"
    "limitantesComprar"     = "Listado de limitantes modo comprar"
    "habilidades"           = "Listado de habilidades"
    "todosTiposSolares"     = "Listado de todos los tipos de solares"
    "estadisticasSims4"     = "Estad$([char]0xED)sticas sims 4"
    "agradecimientos"       = "Agradecimientos"
}

$dataDir = Join-Path $ScriptDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
$databasePath = Join-Path $dataDir "database.json"

Write-Host "Iniciando descarga de Google Sheets..." -ForegroundColor Cyan

$resultado = [ordered]@{}

foreach ($clave in $hojas.Keys) {
    $nombreHoja = $hojas[$clave]
    Write-Host "  -> Descargando: $nombreHoja..." -ForegroundColor Gray
    
    $rango = if ($clave -eq "estadisticasSims4") { "'$nombreHoja'!A1:ZZ500" } else { "'$nombreHoja'" }
    $encodedSheet = [System.Uri]::EscapeDataString($rango)
    $url = "https://sheets.googleapis.com/v4/spreadsheets/$sheetId/values/$encodedSheet`?key=$apiKey"
    
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{
            "Referer" = "https://ozono96.github.io/LOT-LAB-sims-4/"
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        $jsonObj = ConvertFrom-Json -InputObject $resp.Content
        $filas = $jsonObj.values
        if ($null -eq $filas) { $filas = @() }
        
        if ($clave -eq "solares") {
            # Procesar solares como array de objetos (igual que en sheets.js)
            $solaresArray = @()
            if ($filas.Count -gt 1) {
                for ($i = 1; $i -lt $filas.Count; $i++) {
                    $fila = $filas[$i]
                    $solaresArray += [ordered]@{
                        "id"          = if ($fila.Count -gt 0 -and $fila[0]) { [string]$fila[0] } else { "" }
                        "tipoPack"    = if ($fila.Count -gt 1 -and $fila[1]) { [string]$fila[1] } else { "" }
                        "nombrePack"  = if ($fila.Count -gt 2 -and $fila[2]) { [string]$fila[2] } else { "" }
                        "mundo"       = if ($fila.Count -gt 3 -and $fila[3]) { [string]$fila[3] } else { "" }
                        "barrio"      = if ($fila.Count -gt 4 -and $fila[4]) { [string]$fila[4] } else { "" }
                        "nombre"      = if ($fila.Count -gt 5 -and $fila[5]) { [string]$fila[5] } else { "" }
                        "tipoLote"    = if ($fila.Count -gt 6 -and $fila[6]) { [string]$fila[6] } else { "" }
                        "tipoSolar"   = if ($fila.Count -gt 7 -and $fila[7]) { [string]$fila[7] } else { "" }
                        "tama$([char]0xF1)o" = if ($fila.Count -gt 8 -and $fila[8]) { [string]$fila[8] } else { "" }
                        "orientacion" = if ($fila.Count -gt 9 -and $fila[9]) { [string]$fila[9] } else { "" }
                        "acera"       = if ($fila.Count -gt 10 -and $fila[10]) { [string]$fila[10] } else { "" }
                        "imagen"      = if ($fila.Count -gt 11 -and $fila[11]) { [string]$fila[11] } else { "" }
                    }
                }
            }
            $resultado[$clave] = $solaresArray
        } elseif ($clave -eq "estadisticasSims4") {
            # Para estadísticas, guardamos todas las filas tal como vienen de Sheets
            $estadArray = @()
            foreach ($fila in $filas) {
                $filaObj = @()
                foreach ($celda in $fila) {
                    $filaObj += [string]$celda
                }
                $estadArray += ,@($filaObj)
            }
            $resultado[$clave] = $estadArray
        } else {
            # Para los listados, guardamos sin la fila 0 (cabecera), igual que datos.slice(1) en sheets.js
            $listadoSinCabecera = @()
            if ($filas.Count -gt 1) {
                for ($i = 1; $i -lt $filas.Count; $i++) {
                    $listadoSinCabecera += ,@($filas[$i])
                }
            }
            $resultado[$clave] = $listadoSinCabecera
        }
    } catch {
        Write-Host "Error al descargar $nombreHoja : $_" -ForegroundColor Red
        throw $_
    }
}

$resultado["actualizadoEn"] = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")

$json = $resultado | ConvertTo-Json -Depth 10

# Guardar en UTF-8 sin BOM
[System.IO.File]::WriteAllText($databasePath, $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "`n¡database.json generado con éxito!" -ForegroundColor Green
Write-Host "Solares cargados: $($resultado['solares'].Count)" -ForegroundColor Yellow
Write-Host "Mundos cargados: $($resultado['mundos'].Count)" -ForegroundColor Yellow
Write-Host "Packs cargados: $($resultado['packs'].Count)" -ForegroundColor Yellow
Write-Host "Estadísticas cargadas: $($resultado['estadisticasSims4'].Count) filas" -ForegroundColor Yellow
Write-Host "Archivo guardado en: $databasePath" -ForegroundColor White
