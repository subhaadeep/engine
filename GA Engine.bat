@echo off
REM GA Engine — double-click launcher for Windows
REM Place this file in the engine\ root folder.

cd /d "%~dp0"

echo.
echo   GA Engine  —  starting...
echo.

REM Pull latest code
git pull --quiet

REM Start backend
cd backend
start "GA Backend" cmd /k "python start.py"
cd ..

REM Wait 8 seconds for backend to boot
timeout /t 8 /nobreak > nul

REM Start frontend
cd frontend
npm install --silent
start "GA Frontend" cmd /k "npm run dev"
cd ..

REM Wait for frontend
timeout /t 5 /nobreak > nul

REM Open browser
start http://localhost:5173

echo.
echo   App open at http://localhost:5173
echo   Close the two terminal windows to stop.
echo.
pause
