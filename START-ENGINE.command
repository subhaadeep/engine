#!/bin/bash
# ===================================================
# GA ENGINE — START  (macOS double-click launcher)
# ===================================================
REPO="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/tmp/ga-engine"
mkdir -p "$LOG_DIR"

echo "╔══════════════════════════════╗"
echo "║       GA Engine Start        ║"
echo "╚══════════════════════════════╝"
echo ""

# ── 1. Check Python ─────────────────────────────────────────────────────────
PYTHON=""
for cmd in python3.11 python3.10 python3.9 python3; do
  if command -v "$cmd" &>/dev/null; then PYTHON="$cmd"; break; fi
done
if [ -z "$PYTHON" ]; then
  echo "❌ Python 3.9+ not found. Install from https://python.org"
  read -r -p "Press Enter to exit..."; exit 1
fi
echo "✓ Python: $($PYTHON --version)"

# ── 2. Check Node ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  read -r -p "Press Enter to exit..."; exit 1
fi
echo "✓ Node: $(node --version)"

# ── 3. Backend venv ──────────────────────────────────────────────────────────
cd "$REPO/backend"
if [ ! -d ".venv" ]; then
  echo "📦 Creating Python virtual environment..."
  $PYTHON -m venv .venv
fi
echo "📦 Installing Python dependencies..."
.venv/bin/pip install -r requirements.txt -q
echo "✓ Python deps ready"

# ── 4. Frontend node_modules ─────────────────────────────────────────────────
cd "$REPO/frontend"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm packages (first run — takes ~1 min)..."
  npm install
else
  echo "✓ node_modules already present"
fi

# ── 5. Kill existing ports ───────────────────────────────────────────────────
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ── 6. Start backend ─────────────────────────────────────────────────────────
cd "$REPO/backend"
echo "🚀 Starting backend on :8765..."
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo -n "   Waiting for backend"
for i in {1..30}; do
  curl -s http://localhost:8765/api/health >/dev/null 2>&1 && echo " ✓" && break
  echo -n "."; sleep 1
done

# ── 7. Start frontend ────────────────────────────────────────────────────────
cd "$REPO/frontend"
echo "🚀 Starting frontend on :5173..."
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3

# ── 8. Open browser ──────────────────────────────────────────────────────────
open http://localhost:5173

echo ""
echo "✅ GA Engine is running!"
echo "   → http://localhost:5173"
echo "   Backend log : $LOG_DIR/backend.log"
echo "   Frontend log: $LOG_DIR/frontend.log"
echo ""
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Engine stopped.'; exit 0" INT TERM
wait
