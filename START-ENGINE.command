#!/bin/bash
# macOS .command file — double-click to run like an app
# Finder opens this in Terminal automatically on macOS

REPO="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO/backend"
FRONTEND="$REPO/frontend"
LOG="/tmp/ga-engine"
mkdir -p "$LOG"

echo "Starting GA Engine..."

# Kill old processes
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Pull updates silently
cd "$REPO"
BEFORE=$(git rev-parse HEAD 2>/dev/null)
git fetch origin main -q 2>/dev/null
AFTER=$(git rev-parse origin/main 2>/dev/null)
UPDATED=0
if [ "$BEFORE" != "$AFTER" ]; then
    echo "Updating from GitHub..."
    git pull origin main -q
    UPDATED=1
fi

# Python venv
cd "$BACKEND"
if [ ! -d ".venv" ]; then
    echo "Setting up Python environment (first time ~2 min)..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt -q
elif [ $UPDATED -eq 1 ]; then
    .venv/bin/pip install -r requirements.txt -q
fi

# Frontend packages
cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend packages (first time ~1 min)..."
    npm install --silent
elif [ $UPDATED -eq 1 ]; then
    npm install --silent
fi

# Start backend
cd "$BACKEND"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 > "$LOG/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend ready
echo "Waiting for backend..."
for i in {1..30}; do
    curl -s http://localhost:8765/api/health >/dev/null 2>&1 && break
    sleep 1
done

# Start frontend
cd "$FRONTEND"
npm run dev > "$LOG/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3

# Open browser
open http://localhost:5173

echo ""
echo "========================================"
echo " GA Engine is running!"
echo " http://localhost:5173"
echo " Close this window to STOP the engine."
echo "========================================"

# Keep alive — closing Terminal window stops the engine
trap "lsof -ti:8765 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null; echo 'Engine stopped.'; exit" INT TERM EXIT
wait $BACKEND_PID
