import React, { useState, useEffect } from 'react';
import './App.css';
import MicrophoneCapture from './components/MicrophoneCapture';
import SubtitleDisplay from './components/SubtitleDisplay';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket } from './hooks/useWebSocket';
import { Subtitle } from './types/subtitle';

function App() {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  const { 
    socket, 
    isConnected: wsConnected, 
    sendMessage, 
    lastMessage 
  } = useWebSocket('ws://localhost:3001/ws');

  // Handle WebSocket connection status
  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        
        switch (message.type) {
          case 'connected':
            setConnectionId(message.connectionId);
            setConfig(message.config);
            break;
          
          case 'subtitle':
            setSubtitles(prev => {
              const newSubtitles = [...prev, message.data];
              // Keep only last 10 subtitles
              return newSubtitles.slice(-10);
            });
            break;
          
          case 'error':
            console.error('WebSocket error:', message.message);
            break;
          
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Fetch initial configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to fetch configuration:', error);
      }
    };

    fetchConfig();
  }, []);

  const handleStartStream = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'start_stream' });
    }
  };

  const handleStopStream = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'stop_stream' });
    }
  };

  const handleAudioData = (audioData: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage({ 
        type: 'audio', 
        data: audioData 
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎤 Real-time Titling Service</h1>
        <p>Live speech-to-text and translation for conferences</p>
      </header>

      <main className="App-main">
        <ConnectionStatus 
          isConnected={isConnected}
          connectionId={connectionId}
          config={config}
        />

        <div className="controls-section">
          <MicrophoneCapture
            onStartStream={handleStartStream}
            onStopStream={handleStopStream}
            onAudioData={handleAudioData}
            isConnected={isConnected}
          />
        </div>

        <div className="subtitles-section">
          <SubtitleDisplay 
            subtitles={subtitles}
            config={config}
          />
        </div>
      </main>

      <footer className="App-footer">
        <p>Powered by Real-time Titling Service</p>
        <p>STT Service: {config?.sttService || 'Unknown'}</p>
      </footer>
    </div>
  );
}

export default App;
