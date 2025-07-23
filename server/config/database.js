const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB Atlas Database Configuration
const dbConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    // Connection pooling for Atlas
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    
    // Timeout settings optimized for Atlas
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    
    // Write concern for Atlas
    writeConcern: {
      w: 'majority',
      j: true
    },
    
    // Read preference for Atlas
    readPreference: 'primaryPreferred',
    
    // Buffer settings
    bufferCommands: false,
    
    // Compression
    compressors: ['zlib'],
    
    // Retry settings for Atlas
    retryWrites: true,
    retryReads: true,
    
    // Atlas specific settings
    ssl: true,
    tlsAllowInvalidCertificates: false
  }
};

// Connect to MongoDB Atlas
const connectToDatabase = async () => {
  try {
    const { uri, options } = dbConfig;
    
    logger.info('Connecting to MongoDB Atlas database');
    
    await mongoose.connect(uri, options);
    
    logger.info('MongoDB Atlas connected successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB Atlas connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Atlas disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB Atlas reconnected');
    });
    
    return true;
  } catch (error) {
    logger.error('MongoDB Atlas connection failed:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Atlas connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB Atlas connection:', error);
  }
};

module.exports = {
  connectToDatabase,
  closeDatabase,
  dbConfig
}; 