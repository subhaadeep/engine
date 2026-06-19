#!/bin/bash
# =============================================================
#  GA Engine Launcher — macOS / Linux
#  Double-click this file OR run: bash launch-engine.sh
#  Auto-pulls latest from GitHub, rebuilds if changed, runs.
# =============================================================

VPS_IP="178.83.59.53"
VPS_USER="Administrator"
REMOTE_DIR="C:/engine"

echo ""
echo "========================================"
echo "  GA Engine Auto-Update Launcher"
echo "========================================"
echo ""

# Check SSH is available
if ! command -v ssh &> /dev/null; then
  echo "ERROR: ssh not found. Install OpenSSH."
  read -p "Press Enter to exit..."
  exit 1
fi

echo "[1/4] Connecting to VPS at $VPS_IP..."

# Run the update+restart script on the VPS via SSH
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
  ${VPS_USER}@${VPS_IP} "
Set-ExecutionPolicy Bypass -Scope Process -Force 2>\$null

\$REPO = 'C:\\engine'
\$BACKEND = '\$REPO\\backend'
\$FRONTEND = '\$REPO\\frontend'

Write-Host '[2/4] Checking for GitHub updates...' -ForegroundColor Cyan
cd \$REPO
\$before = git rev-parse HEAD 2>\$null
git fetch origin main --quiet
\$after = git rev-parse origin/main 2>\$null

if (\$before -ne \$after) {
  Write-Host '[2/4] Updates found! Pulling...' -ForegroundColor Yellow
  git pull origin main --quiet
  \$UPDATED = \$true
} else {
  Write-Host '[2/4] Already up to date.' -ForegroundColor Green
  \$UPDATED = \$false
}

Write-Host '[3/4] Stopping old services...' -ForegroundColor Cyan
taskkill /f /im uvicorn.exe 2>\$null
\$p = (Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue).OwningProcess
if (\$p) { Stop-Process -Id \$p -Force 2>\$null }
\$p2 = (Get-NetTCPConnection -LocalPort 8765 -EA SilentlyContinue).OwningProcess
if (\$p2) { Stop-Process -Id \$p2 -Force 2>\$null }
Start-Sleep 2

if (\$UPDATED) {
  Write-Host '[3/4] Rebuilding frontend...' -ForegroundColor Cyan
  cd \$FRONTEND
  npm install --silent 2>\$null
  npx vite build --emptyOutDir 2>\$null
}

Write-Host '[4/4] Starting services...' -ForegroundColor Cyan
cd \$BACKEND
Start-Process -NoNewWindow '.venv\\Scripts\\uvicorn.exe' -ArgumentList 'app.main:app --host 0.0.0.0 --port 8765' -WorkingDirectory \$BACKEND
Start-Sleep 2
Start-Process -NoNewWindow 'cmd.exe' -ArgumentList '/c npx serve C:\\engine\\frontend\\dist -p 3000 --single'
Start-Sleep 3
\$IP = (Invoke-RestMethod 'https://api.ipify.org?format=text' -EA SilentlyContinue)
Write-Host '' 
Write-Host '======================================='-ForegroundColor Green
Write-Host \" Frontend : http://\${IP}:3000\" -ForegroundColor Green
Write-Host \" Backend  : http://\${IP}:8765/docs\" -ForegroundColor Green  
Write-Host '======================================='-ForegroundColor Green
"

echo ""
echo "Done! Open http://$VPS_IP:3000 in your browser."
echo ""
read -p "Press Enter to close..."
