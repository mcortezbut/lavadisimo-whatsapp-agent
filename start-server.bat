@echo off
title Lavadísimo - Servidor Web
color 0A
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║           LAVADÍSIMO - SERVIDOR WEB                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo [1] Iniciando servidor...
echo.
cd /d "%~dp0"
node src/server.js
pause
