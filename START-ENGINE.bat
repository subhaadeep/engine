@echo off
SETLOCAL
SET REPO=%~dp0
SET LOG=%TEMP%\ga-engine
MD "%LOG%" 2>nul

title GA Engine
color 0A
echo.
echo  ==============================
echo    GA Engine - Starting...
echo  ==============================
echo.

REM ── 1. Check git ──────────────────────────────
where git >nul 2>&1 || (echo ERROR: Git not found. & pause & exit /b 1)
echo [OK] Git found

REM ── 2. Find Python ───────────────────────────
SET PYTHON=
FOR %%P IN (python3.11 python3.10 python3.9 python3 python) DO (
  IF NOT DEFINED PYTHON (
    WHERE %%P >nul 2>&1 && SET PYTHON=%%P
  )
)
IF NOT DEFINED PYTHON (
  echo ERROR: Python 3.9+ not found. Download from https://python.org
  pause & exit /b 1
)
FOR /F "tokens=*" %%V IN ('%PYTHON% --version 2^>^&1') DO echo [OK] %%V

REM ── 3. Check Node ────────────────────────────
WHERE node >nul 2>&1 || (echo ERROR: Node.js not found. Download from https://nodejs.org & pause & exit /b 1)
FOR /F "tokens=*" %%V IN ('node --version 2^>^&1') DO echo [OK] Node %%V

REM ── 4. Backend venv ──────────────────────────
cd /d "%REPO%backend"
IF NOT EXIST ".venv" (
  echo Creating Python virtual environment...
  %PYTHON% -m venv .venv
)
echo Installing Python dependencies...
.venv\Scripts\pip install -r requirements.txt -q
echo [OK] Python deps ready

REM ── 5. Frontend node_modules ─────────────────
cd /d "%REPO%frontend"
IF NOT EXIST "node_modules" (
  echo Installing npm packages (first run - takes ~1 min)...
  call npm install
) ELSE (
  echo [OK] node_modules already installed
)

REM ── 6. Kill old processes ────────────────────
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
timeout /t 2 /nobreak >nul

REM ── 7. Start backend ─────────────────────────
cd /d "%REPO%backend"
echo Starting backend on port 8765...
start "GA-Backend" /B .venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8765 > "%LOG%\backend.log" 2>&1

REM Wait for backend (up to 30s)
echo Waiting for backend.
SET /A _tries=0
:WAIT_BACKEND
SET /A _tries+=1
powershell -Command "try{Invoke-RestMethod http://localhost:8765/api/health -EA Stop;exit 0}catch{exit 1}" >nul 2>&1
IF %ERRORLEVEL% EQU 0 GOTO BACKEND_READY
IF %_tries% GEQ 30 (echo [WARN] Backend slow to start & GOTO BACKEND_READY)
SET /P _=<nul
timeout /t 1 /nobreak >nul
GOTO WAIT_BACKEND
:BACKEND_READY
echo [OK] Backend ready

REM ── 8. Start frontend ────────────────────────
cd /d "%REPO%frontend"
echo Starting frontend on port 5173...
start "GA-Frontend" /B npm run dev > "%LOG%\frontend.log" 2>&1
timeout /t 4 /nobreak >nul

REM ── 9. Open browser ──────────────────────────
start "" http://localhost:5173

echo.
echo  ==============================
echo    Engine running!
echo    http://localhost:5173
echo  ==============================
echo.
echo  Logs: %LOG%
echo.
echo  Press any key to STOP the engine...
pause >nul

REM Cleanup
taskkill /FI "WINDOWTITLE eq GA-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GA-Frontend*" /F >nul 2>&1
echo Engine stopped.
timeout /t 2 /nobreak >nul
