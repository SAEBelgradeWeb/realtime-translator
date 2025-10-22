/**
 * OpenAI Whisper API Service Implementation
 * Provides speech-to-text using OpenAI's Whisper API
 */
const OpenAI = require('openai');

class OpenAISTTService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
    this.bufferThreshold = 25000000; // 25MB threshold for OpenAI API
    this.maxBufferSize = 25000000; // 25MB max file size for OpenAI
  }

  /**
   * Initialize OpenAI client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable not set');
      }

      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      this.isInitialized = true;
      console.log('OpenAI Whisper service initialized');
    } catch (error) {
      console.error('Failed to initialize OpenAI STT service:', error);
      throw error;
    }
  }

  /**
   * Process audio data using OpenAI Whisper API
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
      // Create a temporary file for the audio data
      const audioFile = await this.createAudioFile(this.audioBuffer);
      
      // Process with OpenAI Whisper
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options.sourceLanguage || 'sr',
        response_format: 'verbose_json',
        temperature: 0.0
      });

      // Clear buffer after processing
      this.audioBuffer = Buffer.alloc(0);

      if (transcription && transcription.text) {
        const result = {
          text: transcription.text,
          confidence: transcription.segments?.[0]?.avg_logprob ? 
            Math.exp(transcription.segments[0].avg_logprob) : 0.9,
          language: transcription.language || options.sourceLanguage || 'sr',
          timestamp: new Date().toISOString(),
          isPartial: false,
          isFinal: true,
          segments: transcription.segments
        };

        // Add translation if enabled and different from source language
        if (options.enableTranslation && options.targetLanguage !== options.sourceLanguage) {
          result.translatedText = await this.translateText(transcription.text, options.targetLanguage);
        }

        console.log(`OpenAI Whisper Result: "${result.text}" (confidence: ${result.confidence})`);
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error processing audio with OpenAI Whisper:', error);
      throw error;
    }
  }

  /**
   * Create a temporary audio file from buffer
   * @param {Buffer} audioBuffer - Audio data buffer
   * @returns {Promise<File>} Audio file object
   */
  async createAudioFile(audioBuffer) {
    // For OpenAI API, we need to create a proper audio file
    // This is a simplified implementation - in production, you might want to use a proper file system
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `audio_${Date.now()}.wav`);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFile, audioBuffer);
    
    // Create file object for OpenAI API
    const file = fs.createReadStream(tempFile);
    
    // Clean up temporary file after processing
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.warn('Failed to clean up temporary audio file:', error);
      }
    }, 5000);

    return file;
  }

  /**
   * Translate text using OpenAI API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLanguage) {
    try {
      const response = await this.client.chat.completions.create({
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
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error translating text:', error);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      name: 'OpenAI Whisper',
      type: 'openai',
      description: 'Speech-to-text using OpenAI Whisper API',
      capabilities: {
        streaming: false, // Whisper API doesn't support streaming
        translation: true,
        languages: ['sr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        enhanced: true
      },
      config: {
        model: 'whisper-1',
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
    console.log('OpenAI STT Service cleaned up');
  }
}

module.exports = OpenAISTTService;
