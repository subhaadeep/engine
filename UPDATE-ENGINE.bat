@echo off
SETLOCAL
SET REPO=%~dp0
title GA Engine Updater
color 0B
echo.
echo  ==============================
echo    GA Engine - Updater
echo  ==============================
echo.

REM Kill running processes
echo Stopping running engine...
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
timeout /t 2 /nobreak >nul

REM ─ 1. Git pull ───────────────────────────
cd /d "%REPO%"
echo Pulling latest code...
git fetch origin
git reset --hard origin/main
git clean -fd
echo [OK] Code updated

REM ─ 2. Force reinstall Python deps ────────────────
cd /d "%REPO%backend"
IF NOT EXIST ".venv" (%PYTHON% -m venv .venv)
echo Force reinstalling Python packages...
.venv\Scripts\pip install -r requirements.txt --upgrade -q
echo [OK] Python deps updated

REM ─ 3. Force reinstall npm deps ──────────────────
cd /d "%REPO%frontend"
echo Force reinstalling npm packages...
IF EXIST "node_modules" RD /S /Q node_modules
IF EXIST "package-lock.json" DEL package-lock.json
call npm install
echo [OK] Node deps updated

echo.
echo  ==============================
echo    Update complete!
echo    Run START-ENGINE to launch.
echo  ==============================
echo.
pause
