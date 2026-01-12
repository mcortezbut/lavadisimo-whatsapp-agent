@echo off
cd /d "c:\Lavadísimo\lavadisimo-whatsapp-agent"

echo Eliminando directorio src/agent...
rmdir /s /q src\agent 2>nul

echo Eliminando directorio scripts...
rmdir /s /q scripts 2>nul

echo Eliminando archivos innecesarios...
del /q SETUP-GUIDE.md 2>nul
del /q DEPLOYMENT.md 2>nul
del /q TROUBLESHOOTING.md 2>nul
del /q create-verifications-table.sql 2>nul
del /q twilio-whatsapp-api-modified.js 2>nul
del /q index1.js 2>nul
del /q start-server.bat 2>nul
del /q test-measure-extraction.js 2>nul

echo Eliminando documentos de database...
del /q database\connection-guide.md 2>nul
del /q database\development-best-practices.md 2>nul
del /q database\sample-database-context.md 2>nul

echo Limpieza completada!
pause
