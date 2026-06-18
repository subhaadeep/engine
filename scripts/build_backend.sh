#!/usr/bin/env bash
# build_backend.sh — compile the FastAPI backend into a standalone binary via PyInstaller
# This is called automatically by Tauri's beforeBuildCommand in tauri.conf.json.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT/backend"
DIST_DIR="$ROOT/src-tauri/binaries"

mkdir -p "$DIST_DIR"

echo "==> Building backend binary..."
cd "$BACKEND_DIR"
source .venv/bin/activate

pip install pyinstaller --quiet

pyinstaller \
  --onefile \
  --name "engine-backend" \
  --distpath "$DIST_DIR" \
  --workpath "$BACKEND_DIR/build" \
  --specpath "$BACKEND_DIR" \
  --hidden-import=uvicorn \
  --hidden-import=uvicorn.logging \
  --hidden-import=uvicorn.loops \
  --hidden-import=uvicorn.loops.auto \
  --hidden-import=uvicorn.protocols \
  --hidden-import=uvicorn.protocols.http \
  --hidden-import=uvicorn.protocols.http.auto \
  --hidden-import=uvicorn.protocols.websockets \
  --hidden-import=uvicorn.protocols.websockets.auto \
  --hidden-import=uvicorn.lifespan \
  --hidden-import=uvicorn.lifespan.on \
  --hidden-import=sqlalchemy.dialects.sqlite \
  --hidden-import=aiosqlite \
  --hidden-import=numba \
  run.py

deactivate
echo "==> Backend binary written to $DIST_DIR"
