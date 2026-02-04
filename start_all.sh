#!/bin/bash

# Kill any existing processes on ports
echo "🛑 Stopping existing services..."
lsof -ti :3001 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

echo "🚀 Starting AI Backend (Port 3001)..."
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend running (PID: $BACKEND_PID)"

echo "🎨 Starting Frontend (Port 5173)..."
# Use --host to expose to local network (needed if user is on different device/VM)
npm run dev -- --host &
FRONTEND_PID=$!

echo "✅ All systems go!"
echo "   - Local:   http://localhost:5173"
echo "   - Network: (Check the output below for IP address)"
echo "   (Press Ctrl+C to stop)"

# Wait for process
wait $FRONTEND_PID
