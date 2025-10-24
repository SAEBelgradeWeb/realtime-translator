import React from 'react';
import { Subtitle } from '../types/subtitle';
import './SubtitleDisplay.css';

interface SubtitleDisplayProps {
  subtitles: Subtitle[];
  config: any;
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ subtitles, config }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50';
    if (confidence >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Get the latest subtitle for main display
  const latestSubtitle = subtitles.length > 0 ? subtitles[subtitles.length - 1] : null;

  return (
    <div className="subtitle-display">
      <div className="subtitle-header">
        <h3>📝 Live Subtitles</h3>
        <div className="subtitle-info">
          <span className="subtitle-count">
            {subtitles.length} subtitle{subtitles.length !== 1 ? 's' : ''}
          </span>
          {config?.enableTranslation && (
            <span className="translation-enabled">
              🌍 Translation to {config.targetLanguage?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="subtitles-container">
        {subtitles.length === 0 ? (
          <div className="no-subtitles">
            <div className="no-subtitles-icon">🎤</div>
            <p>Start speaking to see live subtitles appear here</p>
            <p className="subtitle-hint">
              Make sure your microphone is enabled and you're connected
            </p>
          </div>
        ) : (
          <div className="film-subtitles">
            {/* Main subtitle display - like film subtitles */}
            <div className="current-subtitle">
              {latestSubtitle && (
                <div className="subtitle-content">
                  <div className="subtitle-text">
                    {latestSubtitle.text}
                  </div>
                  
                  {latestSubtitle.translatedText && config?.enableTranslation && (
                    <div className="subtitle-translation">
                      {latestSubtitle.translatedText}
                    </div>
                  )}
                  
                  <div className="subtitle-meta">
                    <span className="subtitle-timestamp">
                      {formatTimestamp(latestSubtitle.timestamp)}
                    </span>
                    
                    <span 
                      className="subtitle-confidence"
                      style={{ color: getConfidenceColor(latestSubtitle.confidence) }}
                    >
                      {getConfidenceText(latestSubtitle.confidence)} ({Math.round(latestSubtitle.confidence * 100)}%)
                    </span>
                    
                    <span className="subtitle-language">
                      {latestSubtitle.language?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent subtitles list - scrollable */}
            <div className="recent-subtitles">
              <h4>Recent Subtitles</h4>
              <div className="subtitles-list">
                {subtitles.slice(-5).reverse().map((subtitle) => (
                  <div key={subtitle.id} className="subtitle-item">
                    <div className="subtitle-text-small">
                      {subtitle.text}
                    </div>
                    {subtitle.translatedText && config?.enableTranslation && (
                      <div className="subtitle-translation-small">
                        {subtitle.translatedText}
                      </div>
                    )}
                    <div className="subtitle-meta-small">
                      <span className="subtitle-timestamp">
                        {formatTimestamp(subtitle.timestamp)}
                      </span>
                      <span 
                        className="subtitle-confidence"
                        style={{ color: getConfidenceColor(subtitle.confidence) }}
                      >
                        {Math.round(subtitle.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="subtitle-footer">
        <div className="service-info">
          <span>STT Service: {config?.sttService || 'Unknown'}</span>
          <span>Language: {config?.sourceLanguage || 'Auto'}</span>
        </div>
      </div>
    </div>
  );
};

export default SubtitleDisplay;
