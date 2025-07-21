const mongoose = require('mongoose');
const logger = require('./logger');

// MongoDB Atlas connection configuration
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

const createIndexes = async () => {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.mongodb.net/selfky?retryWrites=true&w=majority', atlasOptions);
    
    logger.info('Connected to MongoDB Atlas for index creation');

    // Import models
    const User = require('../models/User');
    const Application = require('../models/Application');
    const Payment = require('../models/Payment');

    // Create indexes for User collection
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });
    logger.info('User indexes created');

    // Create indexes for Application collection
    await Application.collection.createIndex({ userId: 1 });
    await Application.collection.createIndex({ applicationNumber: 1 }, { unique: true });
    await Application.collection.createIndex({ status: 1 });
    await Application.collection.createIndex({ createdAt: -1 });
    await Application.collection.createIndex({ courseType: 1 });
    logger.info('Application indexes created');

    // Create indexes for Payment collection
    await Payment.collection.createIndex({ applicationId: 1 });
    await Payment.collection.createIndex({ transactionId: 1 }, { unique: true });
    await Payment.collection.createIndex({ status: 1 });
    await Payment.collection.createIndex({ createdAt: -1 });
    logger.info('Payment indexes created');

    logger.info('All indexes created successfully');
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    process.exit(1);
  }
};

module.exports = createIndexes; 