import React from 'react';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionId: string | null;
  config: any;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  connectionId, 
  config 
}) => {
  return (
    <div className="connection-status">
      <div className="status-indicators">
        <div className={`status-item ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-icon">
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {connectionId && (
          <div className="connection-id">
            <span className="id-label">Connection ID:</span>
            <span className="id-value">{connectionId.slice(0, 8)}...</span>
          </div>
        )}
      </div>

      {config && (
        <div className="config-info">
          <div className="config-item">
            <span className="config-label">STT Service:</span>
            <span className={`config-value service-${config.sttService}`}>
              {config.sttService?.toUpperCase()}
            </span>
          </div>
          
          <div className="config-item">
            <span className="config-label">Translation:</span>
            <span className={`config-value ${config.enableTranslation ? 'enabled' : 'disabled'}`}>
              {config.enableTranslation ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          {config.enableTranslation && (
            <div className="config-item">
              <span className="config-label">Target Language:</span>
              <span className="config-value">
                {config.targetLanguage?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
