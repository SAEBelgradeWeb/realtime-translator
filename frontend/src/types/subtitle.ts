export interface Subtitle {
  id: string;
  text: string;
  translatedText?: string;
  confidence: number;
  timestamp: string;
  connectionId: string;
  language: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  connectionId?: string;
  config?: any;
}

export interface STTConfig {
  sttService: string;
  enableTranslation: boolean;
  targetLanguage: string;
  sourceLanguage: string;
}
