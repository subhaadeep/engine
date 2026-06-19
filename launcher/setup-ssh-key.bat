@echo off
REM =============================================================
REM  ONE-TIME SETUP: Copy SSH key to VPS (Windows)
REM  Run this ONCE, then double-click launch-engine.bat anytime
REM =============================================================

SET VPS_IP=178.83.59.53
SET VPS_USER=Administrator

echo Setting up passwordless SSH to your VPS...
echo You will be asked for VPS password ONE TIME only.
echo.

REM Generate SSH key if not exists
IF NOT EXIST "%USERPROFILE%\.ssh\id_rsa" (
    ssh-keygen -t rsa -b 4096 -f "%USERPROFILE%\.ssh\id_rsa" -N "" -q
    echo SSH key generated.
)

REM Copy public key to VPS
type "%USERPROFILE%\.ssh\id_rsa.pub" | ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "powershell -Command \"$key=(cat -);$path='C:\Users\Administrator\.ssh';New-Item -ItemType Directory -Force -Path $path;Add-Content -Path '$path\authorized_keys' -Value $key;Write-Host 'Key added!'\""

echo.
echo Done! No more password needed. Run launch-engine.bat anytime.
pause
