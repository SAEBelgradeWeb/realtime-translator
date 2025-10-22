#!/bin/bash

# Real-time Titling Service Startup Script

echo "🚀 Starting Real-time Titling Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d frontend/node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "🔧 Starting backend server..."
echo "📡 WebSocket endpoint: ws://localhost:3001/ws"
echo "🌐 HTTP endpoint: http://localhost:3001"
echo "🎤 STT Service: $(grep STT_SERVICE .env | cut -d'=' -f2 || echo 'mock')"
echo ""
echo "To start the frontend, run: npm run frontend"
echo "To stop the server, press Ctrl+C"
echo ""

# Start the backend server
npm start
