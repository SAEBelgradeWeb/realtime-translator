// STT Service Factory - Creates appropriate STT service based on configuration
const MockSTTService = require('./mockSttService');
const GoogleSTTService = require('./googleSttService');
const OpenAISTTService = require('./openaiSttService');
const LocalSTTService = require('./localSttService');

/**
 * Factory function to create STT service based on configuration
 * @param {string} serviceType - Type of STT service ('mock', 'google', 'openai', 'local')
 * @returns {Object} STT service instance
 */
function createSTTService(serviceType = 'mock') {
  console.log(`Creating STT service: ${serviceType}`);
  
  switch (serviceType.toLowerCase()) {
    case 'mock':
      return new MockSTTService();
    
    case 'google':
      return new GoogleSTTService();
    
    case 'openai':
      return new OpenAISTTService();
    
    case 'local':
      return new LocalSTTService();
    
    default:
      console.warn(`Unknown STT service type: ${serviceType}, falling back to mock`);
      return new MockSTTService();
  }
}

module.exports = {
  createSTTService
};
