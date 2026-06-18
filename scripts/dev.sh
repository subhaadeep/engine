#!/usr/bin/env bash
# dev.sh — launch backend + frontend in dev mode (for browser testing without Tauri)
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "==> Starting GA Parameter Explorer (dev mode)"

# ── Backend ──────────────────────────────────────────────────────────────
echo "  Starting FastAPI backend on http://localhost:8765"
cd "$ROOT/backend"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8765 --reload &
BACKEND_PID=$!
deactivate

# ── Frontend ─────────────────────────────────────────────────────────────
echo "  Starting Vite frontend on http://localhost:5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend PID : $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Open http://localhost:5173 in your browser."
echo "  Press Ctrl+C to stop all services."

# Cleanup on exit
trap "echo '  Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
