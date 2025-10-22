/**
 * Google Cloud Speech-to-Text Service Implementation
 * Provides real-time speech-to-text using Google Cloud Speech API
 */
const speech = require('@google-cloud/speech');

class GoogleSTTService {
  constructor() {
    this.client = null;
    this.stream = null;
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
    this.config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: process.env.SOURCE_LANGUAGE || 'sr-RS',
      alternativeLanguageCodes: ['en-US'],
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true
    };
  }

  /**
   * Initialize Google Cloud Speech client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }

      this.client = new speech.SpeechClient({
        projectId: process.env.GOOGLE_PROJECT_ID
      });

      this.isInitialized = true;
      console.log('Google Cloud Speech-to-Text service initialized');
    } catch (error) {
      console.error('Failed to initialize Google STT service:', error);
      throw error;
    }
  }

  /**
   * Process audio data using Google Cloud Speech-to-Text
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

    // Update config based on options
    const config = {
      ...this.config,
      languageCode: options.sourceLanguage || this.config.languageCode,
      alternativeLanguageCodes: options.enableTranslation 
        ? [options.targetLanguage || 'en-US'] 
        : this.config.alternativeLanguageCodes
    };

    try {
      // Create streaming recognition request
      const request = {
        config: config,
        interimResults: true,
        singleUtterance: false
      };

      // Process audio in chunks
      const results = await this.processAudioChunk(this.audioBuffer, request);
      
      // Clear buffer after processing
      this.audioBuffer = Buffer.alloc(0);

      if (results && results.length > 0) {
        const result = results[0];
        const alternative = result.alternatives[0];
        
        return {
          text: alternative.transcript,
          confidence: alternative.confidence,
          language: result.languageCode || config.languageCode,
          timestamp: new Date().toISOString(),
          isPartial: !result.isFinal,
          isFinal: result.isFinal,
          translatedText: options.enableTranslation ? alternative.transcript : undefined
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing audio with Google STT:', error);
      throw error;
    }
  }

  /**
   * Process audio chunk with Google Cloud Speech API
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} request - Recognition request configuration
   * @returns {Promise<Array>} Recognition results
   */
  async processAudioChunk(audioBuffer, request) {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Google STT streaming error:', error);
          reject(error);
        })
        .on('data', (data) => {
          if (data.results && data.results.length > 0) {
            resolve(data.results);
          } else {
            resolve(null);
          }
        });

      // Send audio data
      recognizeStream.write(audioBuffer);
      recognizeStream.end();
    });
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      name: 'Google Cloud Speech-to-Text',
      type: 'google',
      description: 'Real-time speech-to-text using Google Cloud Speech API',
      capabilities: {
        streaming: true,
        translation: true,
        languages: ['sr-RS', 'en-US', 'de-DE', 'fr-FR', 'es-ES'],
        enhanced: true
      },
      config: this.config
    };
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    console.log('Google STT Service cleaned up');
  }
}

module.exports = GoogleSTTService;
