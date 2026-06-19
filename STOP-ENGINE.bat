@echo off
powershell -WindowStyle Hidden -Command "Start-Process '%~f0' -ArgumentList 'run' -WindowStyle Hidden" 2>nul
if "%1"=="" exit /b

FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') DO taskkill /PID %%P /F >nul 2>&1

powershell -WindowStyle Hidden -Command "[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');$n=New-Object System.Windows.Forms.NotifyIcon;$n.Icon=[System.Drawing.SystemIcons]::Application;$n.Visible=$true;$n.ShowBalloonTip(3000,'GA Engine','Engine stopped.',[System.Windows.Forms.ToolTipIcon]::Info);Start-Sleep 4;$n.Dispose()"
exit /b
