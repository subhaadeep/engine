#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Start development environment
# Starts the FastAPI backend and Tauri dev server concurrently
# ─────────────────────────────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "═══════════════════════════════════════════════════════"
echo "  GA Parameter Explorer — Development Mode"
echo "═══════════════════════════════════════════════════════"

# ─── Check Python venv ───────────────────────────────────────────────────────
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "[DEV] Creating Python virtual environment..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

echo "[DEV] Activating venv and installing dependencies..."
source "$BACKEND_DIR/.venv/bin/activate"
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
if command -v uv &> /dev/null; then
  uv pip install -q -r "$BACKEND_DIR/requirements.txt"
elif command -v pip &> /dev/null; then
  pip install -q -r "$BACKEND_DIR/requirements.txt"
else
  python -m pip install -q -r "$BACKEND_DIR/requirements.txt"
fi

# ─── Start FastAPI backend ───────────────────────────────────────────────────
echo "[DEV] Starting FastAPI backend on port 8765..."
cd "$BACKEND_DIR"
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload &
BACKEND_PID=$!
echo "[DEV] Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "[DEV] Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8765/health > /dev/null 2>&1; then
    echo "[DEV] Backend is ready!"
    break
  fi
  sleep 1
done

# ─── Start Tauri dev ─────────────────────────────────────────────────────────
echo "[DEV] Starting Tauri dev server..."
cd "$FRONTEND_DIR"
npm run tauri dev

# ─── Cleanup on exit ─────────────────────────────────────────────────────────
echo "[DEV] Shutting down..."
kill $BACKEND_PID 2>/dev/null || true
echo "[DEV] Done."
