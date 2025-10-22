const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const TitlingHandler = require('./websocket/titlingHandler');
const { createSTTService } = require('./services/sttServiceFactory');

class RealtimeTitlingServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });
    
    this.port = process.env.PORT || 3001;
    this.sttService = createSTTService(process.env.STT_SERVICE || 'mock');
    this.titlingHandler = new TitlingHandler(this.sttService);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // Enable CORS for all routes
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }));

    // Parse JSON bodies
    this.app.use(express.json());
    
    // Serve static files from frontend build
    this.app.use(express.static(path.join(__dirname, '../frontend/build')));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'realtime-titling',
        sttService: process.env.STT_SERVICE || 'mock'
      });
    });

    // API endpoints for configuration
    this.app.get('/api/config', (req, res) => {
      res.json({
        sttService: process.env.STT_SERVICE || 'mock',
        enableTranslation: process.env.ENABLE_TRANSLATION === 'true',
        targetLanguage: process.env.TARGET_LANGUAGE || 'en',
        sourceLanguage: process.env.SOURCE_LANGUAGE || 'sr'
      });
    });

    // Serve React app for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
      
      // Handle new connection
      this.titlingHandler.handleConnection(ws);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.titlingHandler.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.titlingHandler.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.titlingHandler.handleDisconnection(ws);
      });
    });

    // Broadcast subtitles to all connected clients
    this.titlingHandler.on('subtitle', (subtitle) => {
      this.broadcastToAllClients({
        type: 'subtitle',
        data: subtitle
      });
    });

    // Broadcast errors to all clients
    this.titlingHandler.on('error', (error) => {
      this.broadcastToAllClients({
        type: 'error',
        message: error.message
      });
    });
  }

  broadcastToAllClients(message) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 Real-time Titling Server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}/ws`);
      console.log(`🌐 HTTP endpoint: http://localhost:${this.port}`);
      console.log(`🎤 STT Service: ${process.env.STT_SERVICE || 'mock'}`);
      console.log(`🌍 Translation: ${process.env.ENABLE_TRANSLATION === 'true' ? 'enabled' : 'disabled'}`);
    });
  }

  stop() {
    this.server.close(() => {
      console.log('Server stopped');
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new RealtimeTitlingServer();
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = RealtimeTitlingServer;
