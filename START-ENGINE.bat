@echo off
if not "%1"=="elevated" (
    powershell -WindowStyle Hidden -Command "Start-Process '%~f0' -ArgumentList 'elevated' -Verb RunAs" 2>nul
    if %errorlevel% neq 0 (
        powershell -WindowStyle Hidden -Command "Start-Process '%~f0' -ArgumentList 'elevated'"
    )
    exit /b
)

SETLOCAL ENABLEDELAYEDEXPANSION
SET REPO=%~dp0
SET BACKEND=%REPO%backend
SET FRONTEND=%REPO%frontend
SET LOG=%TEMP%\ga-engine
MD "%LOG%" 2>nul

REM ─ Kill old processes silently
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
timeout /t 1 /nobreak >nul

REM ─ Check git update silently
cd /d "%REPO%"
FOR /F %%i IN ('git rev-parse HEAD 2^>nul') DO SET BEFORE=%%i
git fetch origin main --quiet >nul 2>&1
FOR /F %%i IN ('git rev-parse origin/main 2^>nul') DO SET AFTER=%%i
SET UPDATED=0
IF "%BEFORE%" NEQ "%AFTER%" (
    git pull origin main --quiet >nul 2>&1
    SET UPDATED=1
)

REM ─ Setup Python venv
cd /d "%BACKEND%"
IF NOT EXIST ".venv" (
    python -m venv .venv >nul 2>&1
    .venv\Scripts\pip install -r requirements.txt -q >nul 2>&1
) ELSE IF "!UPDATED!"=="1" (
    .venv\Scripts\pip install -r requirements.txt -q >nul 2>&1
)

REM ─ Setup frontend
cd /d "%FRONTEND%"
IF NOT EXIST "node_modules" (
    call npm install --silent >nul 2>&1
) ELSE IF "!UPDATED!"=="1" (
    call npm install --silent >nul 2>&1
)

REM ─ Start backend silently
cd /d "%BACKEND%"
start "" /B powershell -WindowStyle Hidden -Command ".venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8765 *> '%LOG%\backend.log'"

REM ─ Wait for backend
:WAIT
powershell -WindowStyle Hidden -Command "try{Invoke-RestMethod http://localhost:8765/api/health -EA Stop;exit 0}catch{exit 1}" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 ( timeout /t 1 /nobreak >nul & goto WAIT )

REM ─ Start frontend silently
cd /d "%FRONTEND%"
start "" /B powershell -WindowStyle Hidden -Command "npm run dev *> '%LOG%\frontend.log'"
timeout /t 3 /nobreak >nul

REM ─ Open browser
start "" http://localhost:5173

REM ─ Tray notification
powershell -WindowStyle Hidden -Command "[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');$n=New-Object System.Windows.Forms.NotifyIcon;$n.Icon=[System.Drawing.SystemIcons]::Application;$n.Visible=$true;$n.ShowBalloonTip(4000,'GA Engine','Running at http://localhost:5173',[System.Windows.Forms.ToolTipIcon]::Info);Start-Sleep 5;$n.Dispose()"

exit /b
