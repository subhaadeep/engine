#!/bin/bash
# ===================================================
# GA ENGINE — START  (macOS double-click launcher)
# ===================================================
REPO="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/tmp/ga-engine"
mkdir -p "$LOG_DIR"

echo "╔══════════════════════════════╗"
echo "║        GA Engine Start       ║"
echo "╚══════════════════════════════╝"
echo ""

# ── 1. Check git ───────────────────────────────
if ! command -v git &>/dev/null; then
  echo "❌ Git not found. Install Xcode Command Line Tools: xcode-select --install"
  read -r -p "Press Enter to exit..."; exit 1
fi

# ── 2. Check Python ────────────────────────────
PYTHON=""
for cmd in python3.11 python3.10 python3.9 python3; do
  if command -v "$cmd" &>/dev/null; then PYTHON="$cmd"; break; fi
done
if [ -z "$PYTHON" ]; then
  echo "❌ Python 3.9+ not found. Install from https://python.org"
  read -r -p "Press Enter to exit..."; exit 1
fi
echo "✓ Python: $($PYTHON --version)"

# ── 3. Check Node ──────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  read -r -p "Press Enter to exit..."; exit 1
fi
echo "✓ Node: $(node --version)"

# ── 4. Backend venv ────────────────────────────
cd "$REPO/backend"
if [ ! -d ".venv" ]; then
  echo "📦 Creating Python virtual environment..."
  $PYTHON -m venv .venv
fi

echo "📦 Installing Python dependencies..."
.venv/bin/pip install -r requirements.txt -q
echo "✓ Python deps ready"

# ── 5. Frontend node_modules ───────────────────
cd "$REPO/frontend"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm packages (first run — takes ~1 min)..."
  npm install
else
  echo "✓ node_modules already installed"
fi

# ── 6. Kill existing processes ─────────────────
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ── 7. Start backend ───────────────────────────
cd "$REPO/backend"
echo "🚀 Starting backend on port 8765..."
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready (up to 30s)
echo -n "   Waiting for backend"
for i in {1..30}; do
  if curl -s http://localhost:8765/api/health >/dev/null 2>&1; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 1
done

# ── 8. Start frontend ──────────────────────────
cd "$REPO/frontend"
echo "🚀 Starting frontend on port 5173..."
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
sleep 3

# ── 9. Open browser ────────────────────────────
open http://localhost:5173
echo ""
echo "✅ GA Engine is running!"
echo "   → http://localhost:5173"
echo ""
echo "   Logs: $LOG_DIR/backend.log"
echo "         $LOG_DIR/frontend.log"
echo ""
echo "Press Ctrl+C or close this window to stop."

# Keep shell alive so closing terminal kills processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Engine stopped.'; exit 0" INT TERM
wait
