#!/usr/bin/env bash
# setup.sh — one-time environment setup for the GA Parameter Explorer engine
set -euo pipefail

echo "==> Setting up GA Parameter Explorer..."

# ── Rust / Tauri prerequisites ────────────────────────────────────────────
if ! command -v rustup &>/dev/null; then
  echo "  Installing Rust via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
  source "$HOME/.cargo/env"
else
  echo "  Rust already installed: $(rustc --version)"
fi

# ── Python backend ────────────────────────────────────────────────────────
echo "  Setting up Python venv..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..

# ── Node frontend ────────────────────────────────────────────────────────
echo "  Installing Node dependencies..."
cd frontend
npm install
cd ..

echo "==> Setup complete. Run ./scripts/dev.sh to start."
