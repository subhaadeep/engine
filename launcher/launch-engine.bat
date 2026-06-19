@echo off
REM =============================================================
REM  GA Engine Launcher — Windows (Local PC)
REM  Double-click this .bat file to auto-update and run engine
REM =============================================================

SET VPS_IP=178.83.59.53
SET VPS_USER=Administrator

echo.
echo ========================================
echo   GA Engine Auto-Update Launcher
echo ========================================
echo.

REM Check if SSH is available
where ssh >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: SSH not found. It comes built-in on Windows 10/11.
    echo Enable it: Settings ^> Apps ^> Optional Features ^> OpenSSH Client
    pause
    exit /b 1
)

echo [1/4] Connecting to VPS %VPS_IP%...
echo.

REM Send update+restart commands to VPS via SSH
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "powershell -Command \"$REPO='C:\engine';$BEFORE=git -C $REPO rev-parse HEAD 2>$null;git -C $REPO fetch origin main --quiet;$AFTER=git -C $REPO rev-parse origin/main 2>$null;if($BEFORE -ne $AFTER){Write-Host 'Updates found! Pulling...' -ForegroundColor Yellow;git -C $REPO pull origin main --quiet;cd C:\engine\frontend;npm install --silent;npx vite build --emptyOutDir}else{Write-Host 'Already up to date.' -ForegroundColor Green};taskkill /f /im uvicorn.exe 2>$null;$p=(Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue).OwningProcess;if($p){Stop-Process -Id $p -Force};Start-Sleep 2;Start-Process -NoNewWindow 'C:\engine\backend\.venv\Scripts\uvicorn.exe' -ArgumentList 'app.main:app --host 0.0.0.0 --port 8765' -WorkingDirectory 'C:\engine\backend';Start-Sleep 2;Start-Process -NoNewWindow 'cmd.exe' -ArgumentList '/c npx serve C:\engine\frontend\dist -p 3000 --single';Write-Host 'Engine started!' -ForegroundColor Green\""

echo.
echo ========================================
echo   Done! Opening browser...
echo ========================================
echo.

REM Open browser automatically
start http://%VPS_IP%:3000

pause
