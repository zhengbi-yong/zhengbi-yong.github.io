#!/bin/bash

echo "Starting Zhengbi Yong's Personal Blog..."

# Start backend
echo "Starting backend..."
cd backend
./deploy.sh dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
PORT=3001 pnpm dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================="
echo "Services started!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================="

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait