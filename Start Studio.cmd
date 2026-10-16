@echo off
rem Double-click to open Gburg Studio (World collision editor and future tabs) with a game preview. Close this window to stop the server.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js was not found. Install it from https://nodejs.org and try again. & pause & exit /b 1)
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:5181/v8/studio/"
node tools\studio-server.cjs
pause
