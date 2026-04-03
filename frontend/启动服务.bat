@echo off
cd /d "%~dp0"
start "Novel Platform Server" cmd /k "node server.cjs"
timeout /t 2 /nobreak >nul
start http://localhost:3001/
echo Server started! Please check your browser.