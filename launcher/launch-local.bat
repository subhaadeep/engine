@echo off
SETLOCAL ENABLEDELAYEDEXPANSION
REM =============================================================
REM  GA Engine - Local Launcher (Windows)
REM  Double-click this to auto-update from GitHub and run locally
REM =============================================================

SET REPO_DIR=%~dp0..
SET BACKEND_DIR=%REPO_DIR%\backend
SET FRONTEND_DIR=%REPO_DIR%\frontend

title GA Engine Launcher

echo.
echo  =============================================
echo    GA Engine ^| Local Launcher (Windows)
echo  =============================================
echo.

REM ── Check prerequisites ─────────────────────────────────────
echo [CHECK] Verifying prerequisites...

where git >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: git not found.
    echo  Install from: https://git-scm.com/download/win
    pause & exit /b 1
)

where python >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    where python3 >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo  ERROR: Python not found.
        echo  Install from: https://www.python.org/downloads/
        pause & exit /b 1
    )
)

where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found.
    echo  Install from: https://nodejs.org/
    pause & exit /b 1
)

echo  [OK] All prerequisites found.
echo.

REM ── Pull latest from GitHub ──────────────────────────────────
echo [1/4] Checking GitHub for updates...
cd /d "%REPO_DIR%"

FOR /F %%i IN ('git rev-parse HEAD 2^>nul') DO SET BEFORE=%%i
git fetch origin main --quiet 2>nul
FOR /F %%i IN ('git rev-parse origin/main 2^>nul') DO SET AFTER=%%i

IF "%BEFORE%" NEQ "%AFTER%" (
    echo  Updates found! Pulling latest code...
    git pull origin main --quiet
    SET UPDATED=1
) ELSE (
    echo  Already up to date.
    SET UPDATED=0
)

REM ── Setup Python venv if not exists ─────────────────────────
echo.
echo [2/4] Setting up Python backend...
cd /d "%BACKEND_DIR%"

IF NOT EXIST ".venv" (
    echo  Creating virtual environment...
    python -m venv .venv
    echo  Installing dependencies...
    .venv\Scripts\pip install -r requirements.txt --quiet
) ELSE IF "%UPDATED%"=="1" (
    echo  Updating dependencies...
    .venv\Scripts\pip install -r requirements.txt --quiet
) ELSE (
    echo  Python environment ready.
)

REM ── Setup frontend if not built ──────────────────────────────
echo.
echo [3/4] Setting up frontend...
cd /d "%FRONTEND_DIR%"

IF NOT EXIST "node_modules" (
    echo  Installing npm packages...
    call npm install --silent
) ELSE IF "%UPDATED%"=="1" (
    echo  Updating npm packages...
    call npm install --silent
) ELSE (
    echo  Frontend packages ready.
)

REM ── Kill old processes ───────────────────────────────────────
echo.
echo [4/4] Starting services...

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8765 ^| findstr LISTENING 2^>nul') DO (
    taskkill /PID %%P /F >nul 2>&1
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') DO (
    taskkill /PID %%P /F >nul 2>&1
)

REM ── Start Backend ────────────────────────────────────────────
echo  Starting backend on http://localhost:8765 ...
cd /d "%BACKEND_DIR%"
start "GA-Backend" /MIN cmd /c ".venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload 2>&1 | tee backend.log"

REM Wait for backend to be ready
echo  Waiting for backend...
:WAIT_BACKEND
powershell -Command "try { Invoke-RestMethod http://localhost:8765/api/health -EA Stop; exit 0 } catch { exit 1 }" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    timeout /t 1 /nobreak >nul
    goto WAIT_BACKEND
)
echo  Backend ready!

REM ── Start Frontend ───────────────────────────────────────────
echo  Starting frontend on http://localhost:5173 ...
cd /d "%FRONTEND_DIR%"
start "GA-Frontend" /MIN cmd /c "npm run dev 2>&1 | tee frontend.log"

REM Wait for frontend
timeout /t 3 /nobreak >nul

REM ── Done ─────────────────────────────────────────────────────
echo.
echo  =============================================
echo    Engine is running!
echo    Open: http://localhost:5173
echo    API:  http://localhost:8765/docs
echo  =============================================
echo.
echo  Press any key to STOP the engine...

start "" http://localhost:5173
pause >nul

REM ── Cleanup on exit ──────────────────────────────────────────
echo  Stopping services...
taskkill /FI "WINDOWTITLE eq GA-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GA-Frontend*" /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8765 ^| findstr LISTENING 2^>nul') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') DO taskkill /PID %%P /F >nul 2>&1
echo  Engine stopped. Bye!
pause
