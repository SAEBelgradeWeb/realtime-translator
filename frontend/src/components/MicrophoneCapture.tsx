import React, { useState, useRef, useEffect } from 'react';
import './MicrophoneCapture.css';

interface MicrophoneCaptureProps {
  onStartStream: () => void;
  onStopStream: () => void;
  onAudioData: (audioData: string) => void;
  isConnected: boolean;
}

const MicrophoneCapture: React.FC<MicrophoneCaptureProps> = ({
  onStartStream,
  onStopStream,
  onAudioData,
  isConnected
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      setHasPermission(true);
      setError(null);
      streamRef.current = stream;
      
      // Setup audio analysis for level monitoring
      setupAudioAnalysis(stream);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setHasPermission(false);
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    
    updateAudioLevel();
  };

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await requestMicrophonePermission();
      return;
    }

    if (!streamRef.current) {
      setError('No audio stream available');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const audioData = base64.split(',')[1]; // Remove data:audio/webm;base64, prefix
            onAudioData(audioData);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(100); // Send data every 100ms
      setIsRecording(true);
      onStartStream();
      setError(null);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    onStopStream();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="microphone-capture">
      <h3>🎤 Microphone Control</h3>
      
      <div className="permission-section">
        {hasPermission === null && (
          <button 
            className="permission-btn"
            onClick={requestMicrophonePermission}
            disabled={!isConnected}
          >
            Request Microphone Permission
          </button>
        )}
        
        {hasPermission === false && (
          <div className="permission-denied">
            <p>❌ Microphone access denied</p>
            <button 
              className="retry-btn"
              onClick={requestMicrophonePermission}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {hasPermission && (
        <div className="recording-controls">
          <div className="audio-level">
            <div className="level-bar">
              <div 
                className="level-fill"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <span className="level-text">
              Audio Level: {Math.round(audioLevel * 100)}%
            </span>
          </div>

          <button
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={!isConnected}
          >
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </button>

          <div className="status">
            {isRecording ? (
              <span className="recording-status">🔴 Recording...</span>
            ) : (
              <span className="idle-status">⏸️ Idle</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default MicrophoneCapture;
