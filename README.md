# Real-time Titling Service

A Node.js application for real-time speech-to-text and translation during conferences, featuring WebSocket-based audio streaming and multiple STT service integrations.

## Features

- 🎤 **Real-time Audio Capture**: Browser-based microphone access with audio level monitoring
- 🔄 **WebSocket Communication**: Low-latency bidirectional communication between frontend and backend
- 🗣️ **Multiple STT Services**: Support for Mock, Google Cloud, OpenAI Whisper, and Local AI services
- 🌍 **Translation Support**: Optional real-time translation to target languages
- 📱 **Responsive UI**: Modern React frontend with real-time subtitle display
- 🔧 **Configurable**: Easy switching between different STT services via environment variables

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Microphone access in your browser

### Installation

1. **Clone and setup the project:**
```bash
cd /home/vlelicanin/Projects/translator/realtime-titling
npm install
```

2. **Setup environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

### Running the Application

1. **Start the backend server:**
```bash
npm run dev
# or
npm start
```

2. **Start the frontend (in a new terminal):**
```bash
npm run frontend
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - WebSocket: ws://localhost:3001/ws

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# STT Service Configuration
STT_SERVICE=mock
# Options: mock, google, openai, local

# Google Cloud Speech-to-Text (if using google STT service)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_PROJECT_ID=your-project-id

# OpenAI API (if using openai STT service)
OPENAI_API_KEY=your-openai-api-key

# Local AI Service (if using local STT service)
LOCAL_AI_URL=http://localhost:8080/v1/audio/transcriptions

# Translation Configuration
ENABLE_TRANSLATION=true
TARGET_LANGUAGE=en
SOURCE_LANGUAGE=sr

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=100
```

### STT Service Options

#### 1. Mock Service (Default)
- **Purpose**: Development and testing
- **Features**: Simulated responses, no API keys required
- **Configuration**: `STT_SERVICE=mock`

#### 2. Google Cloud Speech-to-Text
- **Purpose**: Production-ready cloud STT
- **Features**: High accuracy, streaming support, multiple languages
- **Configuration**: 
  - `STT_SERVICE=google`
  - `GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json`
  - `GOOGLE_PROJECT_ID=your-project-id`

#### 3. OpenAI Whisper
- **Purpose**: High-quality cloud STT with translation
- **Features**: Excellent accuracy, built-in translation
- **Configuration**:
  - `STT_SERVICE=openai`
  - `OPENAI_API_KEY=your-api-key`

#### 4. Local AI Service
- **Purpose**: Self-hosted STT (LocalAI, Whisper.cpp, etc.)
- **Features**: Privacy, no cloud costs, offline operation
- **Configuration**:
  - `STT_SERVICE=local`
  - `LOCAL_AI_URL=http://localhost:8080/v1/audio/transcriptions`

## API Endpoints

### HTTP Endpoints

- `GET /health` - Health check
- `GET /api/config` - Get current configuration
- `GET /*` - Serve React frontend

### WebSocket Messages

#### Client to Server
```javascript
// Start audio streaming
{ type: 'start_stream' }

// Send audio data
{ type: 'audio', data: 'base64-encoded-audio' }

// Stop audio streaming
{ type: 'stop_stream' }

// Ping for connection health
{ type: 'ping' }
```

#### Server to Client
```javascript
// Connection established
{ type: 'connected', connectionId: 'uuid', config: {...} }

// Subtitle data
{ type: 'subtitle', data: { text: '...', translatedText: '...', confidence: 0.95 } }

// Error message
{ type: 'error', message: 'Error description' }

// Pong response
{ type: 'pong' }
```

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   React Frontend │ ◄─────────────► │  Node.js Backend │
│                 │                 │                 │
│ • Microphone    │                 │ • WebSocket     │
│ • Audio Capture │                 │ • STT Service   │
│ • Subtitle UI   │                 │ • Translation   │
└─────────────────┘                 └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   STT Services  │
                                    │                 │
                                    │ • Mock          │
                                    │ • Google Cloud  │
                                    │ • OpenAI        │
                                    │ • Local AI      │
                                    └─────────────────┘
```

## Development

### Project Structure

```
realtime-titling/
├── src/
│   ├── services/           # STT service implementations
│   │   ├── sttServiceFactory.js
│   │   ├── mockSttService.js
│   │   ├── googleSttService.js
│   │   ├── openaiSttService.js
│   │   └── localSttService.js
│   ├── websocket/         # WebSocket handling
│   │   └── titlingHandler.js
│   └── app.js            # Main server file
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main React app
│   └── package.json
├── package.json          # Backend dependencies
└── .env                  # Environment configuration
```

### Adding New STT Services

1. Create a new service class in `src/services/`
2. Implement the required methods:
   - `processAudio(audioBuffer, options)`
   - `getServiceInfo()`
   - `initialize()` (optional)
   - `cleanup()` (optional)
3. Add the service to `sttServiceFactory.js`
4. Update environment configuration

### Testing

```bash
# Run backend tests
npm test

# Test WebSocket connection
curl http://localhost:3001/health

# Test configuration endpoint
curl http://localhost:3001/api/config
```

## Deployment

### Production Build

```bash
# Build frontend
npm run frontend-build

# Start production server
NODE_ENV=production npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY frontend/build/ ./frontend/build/

EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Ensure browser has microphone access
   - Check HTTPS requirement for production

2. **WebSocket Connection Failed**
   - Verify backend server is running on port 3001
   - Check firewall settings

3. **STT Service Errors**
   - Verify API keys and credentials
   - Check service-specific configuration

4. **Audio Quality Issues**
   - Ensure good microphone quality
   - Check audio processing settings

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
