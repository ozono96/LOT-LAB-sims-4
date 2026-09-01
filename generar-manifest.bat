@echo off
chcp 65001 > nul
echo ========================================================
echo   LOT-LAB - Generador de manifest.json para Solares
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0generar-manifest.ps1"
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
