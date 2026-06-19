#!/bin/bash
# ===================================================
# GA ENGINE — UPDATE  (macOS double-click launcher)
# ===================================================
REPO="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════╗"
echo "║      GA Engine Updater       ║"
echo "╚══════════════════════════════╝"
echo ""

# Kill running processes
echo "🔴 Stopping running engine..."
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ── 1. Force pull (wipe ALL local changes) ──────────────────────────────────
cd "$REPO"
echo "📥 Force pulling latest code..."
git fetch origin
git stash        2>/dev/null || true
git checkout main 2>/dev/null || true
git reset --hard origin/main
git clean -fd
echo "✓ Code updated to latest"

# ── 2. Re-chmod scripts so they stay executable ──────────────────────────────
chmod +x "$REPO/START-ENGINE.command" "$REPO/UPDATE-ENGINE.command" 2>/dev/null || true

# ── 3. Force reinstall Python deps ──────────────────────────────────────────
cd "$REPO/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
echo "📦 Reinstalling Python packages..."
.venv/bin/pip install -r requirements.txt --upgrade -q
echo "✓ Python deps ready"

# ── 4. Force reinstall npm deps ─────────────────────────────────────────────
cd "$REPO/frontend"
echo "📦 Reinstalling npm packages (removes node_modules first)..."
rm -rf node_modules package-lock.json
npm install
echo "✓ Node deps ready"

echo ""
echo "✅ Update complete!"
echo "   Now double-click START-ENGINE.command to launch."
echo ""
read -r -p "Press Enter to exit..."
