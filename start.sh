#!/bin/bash
echo "Starting Novel Platform..."

echo ""
echo "[1/2] Starting Backend..."
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && npm install && npm run dev"'

sleep 3

echo ""
echo "[2/2] Starting Frontend..."
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm install && npm run dev"'

echo ""
echo "========================================"
echo " Novel Platform is starting!"
echo " Frontend: http://localhost:5173"
echo " Backend:  http://localhost:3000"
echo "========================================"
