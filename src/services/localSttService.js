/**
 * Local AI Service Implementation
 * Provides speech-to-text using local AI models (e.g., LocalAI, Whisper.cpp)
 */
const axios = require('axios');

class LocalSTTService {
  constructor() {
    this.baseUrl = process.env.LOCAL_AI_URL || 'http://localhost:8080';
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
    this.bufferThreshold = 16000; // Process every 16KB of audio
    this.maxBufferSize = 25000000; // 25MB max buffer size
  }

  /**
   * Initialize local AI service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Test connection to local AI service
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        this.isInitialized = true;
        console.log('Local AI service initialized');
      } else {
        throw new Error(`Local AI service health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to initialize Local AI service:', error);
      throw error;
    }
  }

  /**
   * Process audio data using local AI service
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Transcription result
   */
  async processAudio(audioBuffer, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Accumulate audio buffer
    this.audioBuffer = Buffer.concat([this.audioBuffer, audioBuffer]);

    // Only process when we have enough audio data
    if (this.audioBuffer.length < this.bufferThreshold) {
      return null;
    }

    // Prevent buffer overflow
    if (this.audioBuffer.length > this.maxBufferSize) {
      this.audioBuffer = this.audioBuffer.slice(-this.maxBufferSize);
    }

    try {
      // Create FormData for multipart upload
      const FormData = require('form-data');
      const form = new FormData();
      
      // Create a temporary buffer for the audio data
      const audioBlob = new Blob([this.audioBuffer], { type: 'audio/wav' });
      form.append('file', audioBlob, 'audio.wav');
      form.append('model', 'whisper-1');
      form.append('language', options.sourceLanguage || 'sr');
      form.append('response_format', 'verbose_json');

      // Send request to local AI service
      const response = await axios.post(
        `${this.baseUrl}/v1/audio/transcriptions`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Clear buffer after processing
      this.audioBuffer = Buffer.alloc(0);

      if (response.data && response.data.text) {
        const result = {
          text: response.data.text,
          confidence: response.data.segments?.[0]?.avg_logprob ? 
            Math.exp(response.data.segments[0].avg_logprob) : 0.9,
          language: response.data.language || options.sourceLanguage || 'sr',
          timestamp: new Date().toISOString(),
          isPartial: false,
          isFinal: true,
          segments: response.data.segments
        };

        // Add translation if enabled and different from source language
        if (options.enableTranslation && options.targetLanguage !== options.sourceLanguage) {
          result.translatedText = await this.translateTextLocally(result.text, options.targetLanguage);
        }

        console.log(`Local AI Result: "${result.text}" (confidence: ${result.confidence})`);
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error processing audio with Local AI service:', error);
      
      // If it's a connection error, mark as not initialized for retry
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        this.isInitialized = false;
      }
      
      throw error;
    }
  }

  /**
   * Translate text using local AI service
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateTextLocally(text, targetLanguage) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Translate the following text to ${targetLanguage}. Return only the translation without any additional text.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error translating text with local AI:', error);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      name: 'Local AI Service',
      type: 'local',
      description: 'Speech-to-text using local AI models (LocalAI, Whisper.cpp, etc.)',
      capabilities: {
        streaming: false, // Depends on local implementation
        translation: true,
        languages: ['sr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        enhanced: true,
        offline: true
      },
      config: {
        baseUrl: this.baseUrl,
        maxFileSize: '25MB',
        supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
      }
    };
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('Local AI Service cleaned up');
  }
}

module.exports = LocalSTTService;
