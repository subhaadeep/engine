#!/bin/bash
# ===================================================
# GA ENGINE — UPDATE  (macOS double-click launcher)
# Run this after pulling new code to force-reinstall
# ===================================================
REPO="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════╗"
echo "║      GA Engine Updater       ║"
echo "╚══════════════════════════════╝"
echo ""

# Kill running processes first
echo "🔴 Stopping running engine..."
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ── 1. Git pull ────────────────────────────────
cd "$REPO"
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main
git clean -fd
echo "✓ Code updated to latest"

# ── 2. Force reinstall Python deps ─────────────────────
cd "$REPO/backend"
if [ ! -d ".venv" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv .venv
fi
echo "📦 Force reinstalling Python packages..."
.venv/bin/pip install -r requirements.txt --upgrade -q
echo "✓ Python deps updated"

# ── 3. Force reinstall npm deps ───────────────────────
cd "$REPO/frontend"
echo "📦 Force reinstalling npm packages..."
rm -rf node_modules package-lock.json
npm install
echo "✓ Node deps updated"

echo ""
echo "✅ Update complete!"
echo "   Now run START-ENGINE.command to launch."
echo ""
read -r -p "Press Enter to exit..."
