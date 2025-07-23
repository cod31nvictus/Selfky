const mongoose = require('mongoose');
const logger = require('./logger');

// MongoDB Atlas connection options
const atlasOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
        maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
        writeConcern: {
    w: 'majority',
    j: true
        },
        readPreference: 'primaryPreferred',
        bufferCommands: false,
        compressors: ['zlib'],
        retryWrites: true,
  retryReads: true,
  ssl: true,
  tlsAllowInvalidCertificates: false
};

const optimizeDatabase = async () => {
  try {
    logger.info('Starting database optimization for MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is required');
}
await mongoose.connect(mongoUri, atlasOptions);
    
    logger.info('Connected to MongoDB Atlas for optimization');

    const db = mongoose.connection.db;
    
    // Get collection statistics
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const stats = await db.collection(collection.name).stats();
      logger.info(`Collection: ${collection.name}`);
      logger.info(`  Documents: ${stats.count}`);
      logger.info(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      logger.info(`  Storage: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      logger.info(`  Indexes: ${stats.nindexes}`);
    }
    
    // Analyze and optimize indexes
    const User = require('../models/User');
    const Application = require('../models/Application');
    const Payment = require('../models/Payment');
    
    // Check for missing indexes
    const userIndexes = await User.collection.getIndexes();
    const applicationIndexes = await Application.collection.getIndexes();
    const paymentIndexes = await Payment.collection.getIndexes();
    
    logger.info('Current indexes:');
    logger.info('User indexes:', Object.keys(userIndexes));
    logger.info('Application indexes:', Object.keys(applicationIndexes));
    logger.info('Payment indexes:', Object.keys(paymentIndexes));
    
    // Create missing indexes if needed
    if (!userIndexes.email_1) {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      logger.info('Created User email index');
    }
    
    if (!applicationIndexes.applicationNumber_1) {
      await Application.collection.createIndex({ applicationNumber: 1 }, { unique: true });
      logger.info('Created Application applicationNumber index');
    }
    
    if (!paymentIndexes.transactionId_1) {
      await Payment.collection.createIndex({ transactionId: 1 }, { unique: true });
      logger.info('Created Payment transactionId index');
    }
    
    logger.info('Database optimization completed');
    // Don't close the connection - let the server manage it
    // await mongoose.connection.close();
    // logger.info('MongoDB Atlas connection closed');
    
    } catch (error) {
    logger.error('Database optimization failed:', error);
    throw error;
  }
};

module.exports = optimizeDatabase; 