const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
  // MongoDB Atlas connection string
  atlas: {
    uri: process.env.MONGODB_ATLAS_URI || 'mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.xxxxx.mongodb.net/selfky?retryWrites=true&w=majority',
    options: {
      // Connection pooling
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      
      // Timeout settings
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Write concern for better performance
      writeConcern: {
        w: 1,
        j: false
      },
      
      // Read preference
      readPreference: 'primaryPreferred',
      
      // Buffer settings
      bufferMaxEntries: 0,
      bufferCommands: false,
      
      // Compression
      compressors: ['zlib'],
      
      // Retry settings
      retryWrites: true,
      retryReads: true
    }
  },
  
  // Local MongoDB (fallback)
  local: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 5000
    }
  }
};

// Get the appropriate database configuration
const getDbConfig = () => {
  const useAtlas = process.env.USE_MONGODB_ATLAS === 'true';
  return useAtlas ? dbConfig.atlas : dbConfig.local;
};

// Connect to database
const connectToDatabase = async () => {
  try {
    const config = getDbConfig();
    const { uri, options } = config;
    
    logger.info(`Connecting to database: ${useAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    
    await mongoose.connect(uri, options);
    
    logger.info('Database connected successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

module.exports = {
  connectToDatabase,
  closeDatabase,
  getDbConfig
}; 