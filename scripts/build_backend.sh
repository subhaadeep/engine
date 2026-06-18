#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build_backend.sh — Build Python backend with PyInstaller
# Produces the sidecar binary and copies it to src-tauri/binaries/
# ─────────────────────────────────────────────────────────────────────────────
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BINARIES_DIR="$PROJECT_ROOT/src-tauri/binaries"

echo "═══════════════════════════════════════════════════════"
echo "  GA Parameter Explorer — Backend Build (PyInstaller)"
echo "═══════════════════════════════════════════════════════"

if ! command -v rustc &> /dev/null; then
  echo "[ERROR] rustc is not installed."
  echo "You must install Rust to build a Tauri application. Run this command:"
  echo "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

TARGET_TRIPLE=$(rustc -Vv | grep host | cut -d ' ' -f 2)
echo "[BUILD] Target triple: $TARGET_TRIPLE"

# ─── Activate venv ───────────────────────────────────────────────────────────
source "$BACKEND_DIR/.venv/bin/activate"

# ─── Install PyInstaller ─────────────────────────────────────────────────────
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
if command -v uv &> /dev/null; then
  uv pip install -q pyinstaller
elif command -v pip &> /dev/null; then
  pip install -q pyinstaller
else
  python -m pip install -q pyinstaller
fi

# ─── Build ───────────────────────────────────────────────────────────────────
echo "[BUILD] Running PyInstaller..."
cd "$BACKEND_DIR"
pyinstaller \
  --onefile \
  --name python-backend \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.loops \
  --hidden-import uvicorn.loops.auto \
  --hidden-import uvicorn.protocols \
  --hidden-import uvicorn.protocols.http \
  --hidden-import uvicorn.protocols.http.h11_impl \
  --hidden-import uvicorn.protocols.http.httptools_impl \
  --hidden-import uvicorn.protocols.websockets \
  --hidden-import uvicorn.protocols.websockets.websockets_impl \
  --hidden-import uvicorn.lifespan \
  --hidden-import uvicorn.lifespan.on \
  --hidden-import aiosqlite \
  --hidden-import sqlalchemy.dialects.sqlite \
  --hidden-import numba \
  --add-data "app/strategies:app/strategies" \
  --distpath dist \
  run.py

# ─── Copy to binaries dir with target triple suffix ──────────────────────────
mkdir -p "$BINARIES_DIR"
echo "[BUILD] Copying binary to $BINARIES_DIR/python-backend-$TARGET_TRIPLE"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  cp "$BACKEND_DIR/dist/python-backend.exe" "$BINARIES_DIR/python-backend-$TARGET_TRIPLE.exe"
else
  cp "$BACKEND_DIR/dist/python-backend" "$BINARIES_DIR/python-backend-$TARGET_TRIPLE"
  chmod +x "$BINARIES_DIR/python-backend-$TARGET_TRIPLE"
fi

echo "[BUILD] Backend binary built successfully!"
echo "[BUILD] Location: $BINARIES_DIR/python-backend-$TARGET_TRIPLE"
