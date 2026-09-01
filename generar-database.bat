@echo off
chcp 65001 > nul
echo ========================================================
echo   LOT-LAB - Descarga y Actualizacion de Base de Datos
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0generar-database.ps1"
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
