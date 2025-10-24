/**
 * Mock STT Service - Simulates speech-to-text processing for MVP development
 * This service returns predefined responses to simulate real-time transcription
 */
class MockSTTService {
  constructor() {
    this.mockResponses = [
      "Dobrodošli na konferenciju o tehnologiji.",
      "Hvala što ste došli na našu prezentaciju.",
      "Danas ćemo govoriti o umetnoj inteligenciji.",
      "Ova tehnologija će promeniti način kako radimo.",
      "Imamo nekoliko ključnih tačaka za diskusiju.",
      "Prvo, analizirajmo trenutno stanje industrije.",
      "Drugo, razmotrimo buduće trendove.",
      "Treće, identifikujmo mogućnosti za napredak.",
      "Zaključak je da je budućnost u našim rukama.",
      "Hvala vam na pažnji i pitanjima."
    ];
    
    this.currentIndex = 0;
    this.lastProcessTime = 0;
    this.minInterval = 1000; // Minimum 1 second between responses (faster for testing)
    this.audioBuffer = Buffer.alloc(0);
    this.bufferThreshold = 1000; // Simulate processing after 1KB of audio (much lower threshold)
  }

  /**
   * Process audio data and return mock transcription
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Mock transcription result
   */
  async processAudio(audioBuffer, options = {}) {
    // Accumulate audio buffer
    this.audioBuffer = Buffer.concat([this.audioBuffer, audioBuffer]);
    
    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    
    // Only process if we have enough audio data and enough time has passed
    if (this.audioBuffer.length < this.bufferThreshold || timeSinceLastProcess < this.minInterval) {
      return null;
    }

    // Reset buffer and update timing
    this.audioBuffer = Buffer.alloc(0);
    this.lastProcessTime = now;

    // Get next mock response
    const mockText = this.getNextMockResponse();
    
    // Simulate processing delay
    await this.simulateProcessingDelay();

    // Generate mock result
    const result = {
      text: mockText,
      confidence: this.generateMockConfidence(),
      language: options.sourceLanguage || 'sr',
      timestamp: new Date().toISOString(),
      isPartial: false,
      isFinal: true
    };

    // Add translation if enabled
    if (options.enableTranslation && options.targetLanguage !== options.sourceLanguage) {
      result.translatedText = this.translateText(mockText, options.targetLanguage);
    }

    console.log(`Mock STT Result: "${result.text}" (confidence: ${result.confidence})`);
    
    return result;
  }

  /**
   * Get next mock response from the predefined list
   * @returns {string} Mock response text
   */
  getNextMockResponse() {
    const response = this.mockResponses[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.mockResponses.length;
    return response;
  }

  /**
   * Generate mock confidence score
   * @returns {number} Confidence score between 0.7 and 0.95
   */
  generateMockConfidence() {
    return Math.random() * 0.25 + 0.7; // 0.7 to 0.95
  }

  /**
   * Simulate processing delay
   * @returns {Promise<void>}
   */
  async simulateProcessingDelay() {
    const delay = Math.random() * 500 + 200; // 200-700ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simple mock translation (in real implementation, this would call a translation service)
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {string} Translated text
   */
  translateText(text, targetLanguage) {
    // Simple mock translation mapping
    const translations = {
      'en': {
        "Dobrodošli na konferenciju o tehnologiji.": "Welcome to the technology conference.",
        "Hvala što ste došli na našu prezentaciju.": "Thank you for coming to our presentation.",
        "Danas ćemo govoriti o umetnoj inteligenciji.": "Today we will talk about artificial intelligence.",
        "Ova tehnologija će promeniti način kako radimo.": "This technology will change the way we work.",
        "Imamo nekoliko ključnih tačaka za diskusiju.": "We have several key points for discussion.",
        "Prvo, analizirajmo trenutno stanje industrije.": "First, let's analyze the current state of the industry.",
        "Drugo, razmotrimo buduće trendove.": "Second, let's consider future trends.",
        "Treće, identifikujmo mogućnosti za napredak.": "Third, let's identify opportunities for progress.",
        "Zaključak je da je budućnost u našim rukama.": "The conclusion is that the future is in our hands.",
        "Hvala vam na pažnji i pitanjima.": "Thank you for your attention and questions."
      }
    };

    return translations[targetLanguage]?.[text] || text;
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      name: 'Mock STT Service',
      type: 'mock',
      description: 'Simulates speech-to-text processing for development and testing',
      capabilities: {
        streaming: true,
        translation: true,
        languages: ['sr', 'en']
      }
    };
  }

  /**
   * Initialize the service (no-op for mock service)
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('Mock STT Service initialized');
  }

  /**
   * Cleanup resources (no-op for mock service)
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('Mock STT Service cleaned up');
  }
}

module.exports = MockSTTService;
