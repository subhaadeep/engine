#!/bin/bash
# =============================================================
#  GA Engine - Local Launcher (Mac / Linux)
#  Double-click OR run: bash launch-local.sh
#  Auto-pulls from GitHub, sets up env, runs locally.
# =============================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"

echo ""
echo -e "${CYAN} =============================================${NC}"
echo -e "${CYAN}   GA Engine | Local Launcher (Mac/Linux)${NC}"
echo -e "${CYAN} =============================================${NC}"
echo ""

# ── Check prerequisites ────────────────────────────────────────
echo -e "${CYAN}[CHECK]${NC} Verifying prerequisites..."

for cmd in git python3 node npm; do
  if ! command -v $cmd &>/dev/null; then
    echo -e "${RED} ERROR: '$cmd' not found.${NC}"
    case $cmd in
      git)     echo " Install: brew install git" ;;
      python3) echo " Install: brew install python3" ;;
      node|npm) echo " Install: brew install node  OR  https://nodejs.org" ;;
    esac
    read -p "Press Enter to exit..."
    exit 1
  fi
done
echo -e "${GREEN} [OK] All prerequisites found.${NC}"
echo ""

# ── Pull latest from GitHub ────────────────────────────────────
echo -e "${CYAN}[1/4]${NC} Checking GitHub for updates..."
cd "$REPO_DIR"

BEFORE=$(git rev-parse HEAD 2>/dev/null)
git fetch origin main --quiet 2>/dev/null
AFTER=$(git rev-parse origin/main 2>/dev/null)

UPDATED=0
if [ "$BEFORE" != "$AFTER" ]; then
  echo -e "${YELLOW} Updates found! Pulling latest code...${NC}"
  git pull origin main --quiet
  UPDATED=1
else
  echo -e "${GREEN} Already up to date.${NC}"
fi

# ── Setup Python venv ──────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/4]${NC} Setting up Python backend..."
cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
  echo " Creating virtual environment..."
  python3 -m venv .venv
  echo " Installing dependencies..."
  .venv/bin/pip install -r requirements.txt -q
elif [ $UPDATED -eq 1 ]; then
  echo " Updating dependencies..."
  .venv/bin/pip install -r requirements.txt -q
else
  echo -e "${GREEN} Python environment ready.${NC}"
fi

# ── Setup frontend ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/4]${NC} Setting up frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo " Installing npm packages..."
  npm install --silent
elif [ $UPDATED -eq 1 ]; then
  echo " Updating npm packages..."
  npm install --silent
else
  echo -e "${GREEN} Frontend packages ready.${NC}"
fi

# ── Kill old processes ─────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/4]${NC} Starting services..."

lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ── Start Backend ──────────────────────────────────────────────
echo " Starting backend on http://localhost:8765 ..."
cd "$BACKEND_DIR"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload > /tmp/ga-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
echo " Waiting for backend..."
for i in {1..30}; do
  if curl -s http://localhost:8765/api/health >/dev/null 2>&1; then
    echo -e "${GREEN} Backend ready! (PID $BACKEND_PID)${NC}"
    break
  fi
  sleep 1
done

# ── Start Frontend ─────────────────────────────────────────────
echo " Starting frontend on http://localhost:5173 ..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/ga-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# ── Open browser ───────────────────────────────────────────────
if command -v open &>/dev/null; then
  open http://localhost:5173   # macOS
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173  # Linux
fi

echo ""
echo -e "${GREEN} =============================================${NC}"
echo -e "${GREEN}   Engine is running!${NC}"
echo -e "${GREEN}   Frontend : http://localhost:5173${NC}"
echo -e "${GREEN}   API Docs : http://localhost:8765/docs${NC}"
echo -e "${GREEN}   Logs     : /tmp/ga-backend.log${NC}"
echo -e "${GREEN} =============================================${NC}"
echo ""
echo " Press Ctrl+C to stop the engine..."

# ── Cleanup on Ctrl+C ──────────────────────────────────────────
trap "echo ''; echo ' Stopping engine...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; lsof -ti:8765 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null; echo ' Stopped. Bye!'; exit 0" INT TERM

wait
