const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class TitlingHandler extends EventEmitter {
  constructor(sttService) {
    super();
    this.sttService = sttService;
    this.activeConnections = new Map(); // Map of WebSocket connections
    this.audioBuffers = new Map(); // Map of audio buffers per connection
    this.isProcessing = false;
    
    // Configuration
    this.maxBufferSize = 1024 * 1024; // 1MB max buffer per connection
    this.chunkSize = 1000; // Process audio in 1KB chunks (smaller for faster processing)
    this.processingInterval = 500; // Process every 500ms (less frequent but more reliable)
  }

  handleConnection(ws) {
    const connectionId = uuidv4();
    this.activeConnections.set(ws, {
      id: connectionId,
      connectedAt: new Date(),
      audioBuffer: Buffer.alloc(0),
      isStreaming: false,
      lastActivity: new Date()
    });

    console.log(`New connection established: ${connectionId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      connectionId: connectionId,
      message: 'Connected to Real-time Titling Service',
      config: {
        sttService: process.env.STT_SERVICE || 'mock',
        enableTranslation: process.env.ENABLE_TRANSLATION === 'true',
        targetLanguage: process.env.TARGET_LANGUAGE || 'en'
      }
    }));

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  handleMessage(ws, message) {
    const connection = this.activeConnections.get(ws);
    if (!connection) {
      console.error('Received message from unknown connection');
      return;
    }

    connection.lastActivity = new Date();

    switch (message.type) {
      case 'audio':
        this.handleAudioData(ws, message.data);
        break;
      
      case 'start_stream':
        this.handleStartStream(ws);
        break;
      
      case 'stop_stream':
        this.handleStopStream(ws);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      default:
        console.warn(`Unknown message type: ${message.type}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`
        }));
    }
  }

  handleAudioData(ws, audioData) {
    const connection = this.activeConnections.get(ws);
    if (!connection || !connection.isStreaming) {
      return;
    }

    try {
      // Convert base64 audio data to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Append to connection's audio buffer
      connection.audioBuffer = Buffer.concat([connection.audioBuffer, audioBuffer]);
      
      // Prevent buffer overflow
      if (connection.audioBuffer.length > this.maxBufferSize) {
        connection.audioBuffer = connection.audioBuffer.slice(-this.maxBufferSize);
        console.warn(`Audio buffer overflow for connection ${connection.id}`);
      }

    } catch (error) {
      console.error('Error processing audio data:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio data'
      }));
    }
  }

  handleStartStream(ws) {
    const connection = this.activeConnections.get(ws);
    if (!connection) {
      return;
    }

    connection.isStreaming = true;
    connection.audioBuffer = Buffer.alloc(0);
    
    console.log(`Audio streaming started for connection ${connection.id}`);
    
    ws.send(JSON.stringify({
      type: 'stream_started',
      message: 'Audio streaming started'
    }));
  }

  handleStopStream(ws) {
    const connection = this.activeConnections.get(ws);
    if (!connection) {
      return;
    }

    connection.isStreaming = false;
    
    console.log(`Audio streaming stopped for connection ${connection.id}`);
    
    ws.send(JSON.stringify({
      type: 'stream_stopped',
      message: 'Audio streaming stopped'
    }));
  }

  handleDisconnection(ws) {
    const connection = this.activeConnections.get(ws);
    if (connection) {
      console.log(`Connection ${connection.id} disconnected`);
      this.activeConnections.delete(ws);
    }

    // Stop processing if no active connections
    if (this.activeConnections.size === 0) {
      this.stopProcessing();
    }
  }

  startProcessing() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('Started audio processing loop');

    this.processingLoop = setInterval(() => {
      this.processAudioBuffers();
    }, this.processingInterval);
  }

  stopProcessing() {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    if (this.processingLoop) {
      clearInterval(this.processingLoop);
      this.processingLoop = null;
    }
    
    console.log('Stopped audio processing loop');
  }

  async processAudioBuffers() {
    const activeStreams = Array.from(this.activeConnections.entries())
      .filter(([ws, connection]) => connection.isStreaming && connection.audioBuffer.length > 0);

    if (activeStreams.length === 0) {
      return;
    }

    // Process audio from the first active stream (for MVP, we'll process one at a time)
    const [ws, connection] = activeStreams[0];
    
    if (connection.audioBuffer.length >= this.chunkSize) {
      try {
        // Extract chunk for processing
        const audioChunk = connection.audioBuffer.slice(0, this.chunkSize);
        connection.audioBuffer = connection.audioBuffer.slice(this.chunkSize);

        // Process audio chunk with STT service
        const result = await this.sttService.processAudio(audioChunk, {
          connectionId: connection.id,
          sourceLanguage: process.env.SOURCE_LANGUAGE || 'sr',
          targetLanguage: process.env.TARGET_LANGUAGE || 'en',
          enableTranslation: process.env.ENABLE_TRANSLATION === 'true'
        });

        if (result && result.text) {
          // Emit subtitle event
          this.emit('subtitle', {
            id: uuidv4(),
            text: result.text,
            translatedText: result.translatedText,
            confidence: result.confidence,
            timestamp: new Date().toISOString(),
            connectionId: connection.id,
            language: result.language
          });
        }

      } catch (error) {
        console.error('Error processing audio:', error);
        this.emit('error', error);
      }
    }
  }

  // Get connection statistics
  getStats() {
    return {
      activeConnections: this.activeConnections.size,
      isProcessing: this.isProcessing,
      connections: Array.from(this.activeConnections.values()).map(conn => ({
        id: conn.id,
        connectedAt: conn.connectedAt,
        isStreaming: conn.isStreaming,
        bufferSize: conn.audioBuffer.length,
        lastActivity: conn.lastActivity
      }))
    };
  }
}

module.exports = TitlingHandler;
