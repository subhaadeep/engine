#!/bin/bash
# GA Engine — double-click launcher for macOS
# Place this file in the engine/ root folder.
# First time: chmod +x "GA Engine.command"  (run once in terminal)

cd "$(dirname "$0")"

echo ""
echo "  GA Engine  —  starting..."
echo ""

# Pull latest code silently
git pull --quiet

# Start backend in background
cd backend
python start.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready (max 30s)
echo "  Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8765/api/health > /dev/null 2>&1; then
    echo "  Backend ready  ✔"
    break
  fi
  sleep 1
done

# Start frontend
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 3

# Open browser
open http://localhost:5173

echo ""
echo "  App open at http://localhost:5173"
echo "  Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
