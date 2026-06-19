#!/bin/bash
# macOS — double-click to pull latest code from GitHub and restart
REPO="$(cd "$(dirname "$0")" && pwd)"

echo "Pulling latest from GitHub..."
cd "$REPO"

git fetch origin main -q
BEFORE=$(git rev-parse HEAD)
AFTER=$(git rev-parse origin/main)

if [ "$BEFORE" = "$AFTER" ]; then
    echo "Already up to date! No restart needed."
    sleep 2
    exit 0
fi

git pull origin main -q
echo "Updated! Installing any new dependencies..."

# Update Python deps if changed
cd "$REPO/backend"
.venv/bin/pip install -r requirements.txt -q 2>/dev/null

# Update npm deps if changed
cd "$REPO/frontend"
npm install --silent 2>/dev/null

# Kill old processes
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Restart backend
cd "$REPO/backend"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 > /tmp/ga-engine/backend.log 2>&1 &

# Wait for it
for i in {1..20}; do
    curl -s http://localhost:8765/api/health >/dev/null 2>&1 && break
    sleep 1
done

# Restart frontend
cd "$REPO/frontend"
npm run dev > /tmp/ga-engine/frontend.log 2>&1 &
sleep 3

open http://localhost:5173
echo "Engine updated and restarted! http://localhost:5173"
echo "Close this window when done."
wait
