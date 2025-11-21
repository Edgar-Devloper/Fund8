# Script para limpiar completamente el caché y forzar recompilación
Write-Host "=== LIMPIANDO CACHÉ COMPLETAMENTE ===" -ForegroundColor Yellow

# Detener todos los procesos de Node
Write-Host "`n1. Deteniendo procesos de Node..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Eliminar caché de node_modules
Write-Host "2. Eliminando node_modules\.cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Eliminar build
Write-Host "3. Eliminando build..." -ForegroundColor Cyan
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue

# Eliminar .cache
Write-Host "4. Eliminando .cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue

Write-Host "`n=== LIMPIEZA COMPLETA FINALIZADA ===" -ForegroundColor Green
Write-Host "`nAHORA EJECUTA: npm start" -ForegroundColor Yellow
Write-Host "El bundle se recompilará sin el código de TradingView" -ForegroundColor Cyan


