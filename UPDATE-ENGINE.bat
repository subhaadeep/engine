@echo off
SETLOCAL ENABLEDELAYEDEXPANSION
if not "%1"=="run" (
    powershell -WindowStyle Hidden -Command "Start-Process '%~f0' -ArgumentList 'run'"
    exit /b
)

SET REPO=%~dp0
SET LOG=%TEMP%\ga-engine
MD "%LOG%" 2>nul

REM Check for updates
cd /d "%REPO%"
FOR /F %%i IN ('git rev-parse HEAD 2^>nul') DO SET BEFORE=%%i
git fetch origin main --quiet >nul 2>&1
FOR /F %%i IN ('git rev-parse origin/main 2^>nul') DO SET AFTER=%%i

IF "%BEFORE%"=="%AFTER%" (
    powershell -WindowStyle Hidden -Command "[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');$n=New-Object System.Windows.Forms.NotifyIcon;$n.Icon=[System.Drawing.SystemIcons]::Information;$n.Visible=$true;$n.ShowBalloonTip(4000,'GA Engine','Already up to date! No restart needed.',[System.Windows.Forms.ToolTipIcon]::Info);Start-Sleep 5;$n.Dispose()"
    exit /b
)

REM Pull latest
git pull origin main --quiet >nul 2>&1

REM Update Python deps
cd /d "%REPO%backend"
.venv\Scripts\pip install -r requirements.txt -q >nul 2>&1

REM Update npm deps  
cd /d "%REPO%frontend"
call npm install --silent >nul 2>&1

REM Kill old processes
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
timeout /t 2 /nobreak >nul

REM Restart backend silently
cd /d "%REPO%backend"
start "" /B powershell -WindowStyle Hidden -Command ".venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8765 *> '%LOG%\backend.log'"

REM Wait for backend
:WAIT
powershell -WindowStyle Hidden -Command "try{Invoke-RestMethod http://localhost:8765/api/health -EA Stop;exit 0}catch{exit 1}" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 ( timeout /t 1 /nobreak >nul & goto WAIT )

REM Restart frontend silently
cd /d "%REPO%frontend"
start "" /B powershell -WindowStyle Hidden -Command "npm run dev *> '%LOG%\frontend.log'"
timeout /t 3 /nobreak >nul

REM Open browser
start "" http://localhost:5173

REM Notify
powershell -WindowStyle Hidden -Command "[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');$n=New-Object System.Windows.Forms.NotifyIcon;$n.Icon=[System.Drawing.SystemIcons]::Application;$n.Visible=$true;$n.ShowBalloonTip(4000,'GA Engine','Updated and restarted!',[System.Windows.Forms.ToolTipIcon]::Info);Start-Sleep 5;$n.Dispose()"
exit /b
