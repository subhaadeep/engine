#!/bin/bash
lsof -ti:8765 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
echo "GA Engine stopped."
sleep 2
