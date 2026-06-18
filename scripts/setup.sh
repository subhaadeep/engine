#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — First-time project setup
# Installs all dependencies for backend + frontend
# ─────────────────────────────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "═══════════════════════════════════════════════════════"
echo "  GA Parameter Explorer — First-time Setup"
echo "═══════════════════════════════════════════════════════"

# ─── Python backend ──────────────────────────────────────────────────────────
echo ""
echo "[SETUP] Setting up Python backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "[SETUP] Creating Python 3.11+ virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
echo "[SETUP] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt

echo "[SETUP] Python backend setup complete."

# ─── Node.js frontend ────────────────────────────────────────────────────────
echo ""
echo "[SETUP] Setting up Node.js frontend..."
cd "$PROJECT_ROOT/frontend"
npm install

echo "[SETUP] Node.js frontend setup complete."

# ─── Create data directory ───────────────────────────────────────────────────
mkdir -p "$PROJECT_ROOT/backend/data"
mkdir -p "$PROJECT_ROOT/src-tauri/binaries"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  To start development:"
echo "    make dev"
echo ""
echo "  To build for production:"
echo "    make build"
echo "═══════════════════════════════════════════════════════"
