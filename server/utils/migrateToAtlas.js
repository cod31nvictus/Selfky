const mongoose = require('mongoose');
const { connectToDatabase } = require('../config/database');
const User = require('../models/User');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const logger = require('./logger');

class AtlasMigration {
  constructor() {
    this.localConnection = null;
    this.atlasConnection = null;
  }

  // Connect to local MongoDB
  async connectToLocal() {
    try {
      const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky';
      this.localConnection = await mongoose.createConnection(localUri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000
      });
      
      logger.info('Connected to local MongoDB');
      return true;
    } catch (error) {
      logger.error('Failed to connect to local MongoDB:', error);
      throw error;
    }
  }

  // Connect to MongoDB Atlas
  async connectToAtlas() {
    try {
      // Temporarily set environment to use Atlas
      process.env.USE_MONGODB_ATLAS = 'true';
      await connectToDatabase();
      
      logger.info('Connected to MongoDB Atlas');
      return true;
    } catch (error) {
      logger.error('Failed to connect to MongoDB Atlas:', error);
      throw error;
    }
  }

  // Migrate collections
  async migrateCollection(collectionName, localModel, atlasModel) {
    try {
      logger.info(`Starting migration of ${collectionName}...`);
      
      // Get all documents from local
      const localDocs = await localModel.find({});
      logger.info(`Found ${localDocs.length} documents in ${collectionName}`);
      
      if (localDocs.length === 0) {
        logger.info(`No documents to migrate for ${collectionName}`);
        return;
      }
      
      // Insert into Atlas
      const result = await atlasModel.insertMany(localDocs, { 
        ordered: false, // Continue on errors
        rawResult: true 
      });
      
      logger.info(`Successfully migrated ${result.insertedCount} documents to Atlas`);
      
      if (result.writeErrors && result.writeErrors.length > 0) {
        logger.warn(`Some documents failed to migrate: ${result.writeErrors.length} errors`);
      }
      
    } catch (error) {
      logger.error(`Error migrating ${collectionName}:`, error);
      throw error;
    }
  }

  // Run full migration
  async migrateAll() {
    try {
      logger.info('Starting MongoDB Atlas migration...');
      
      // Connect to both databases
      await this.connectToLocal();
      await this.connectToAtlas();
      
      // Create local models using local connection
      const LocalUser = this.localConnection.model('User', User.schema);
      const LocalApplication = this.localConnection.model('Application', Application.schema);
      const LocalPayment = this.localConnection.model('Payment', Payment.schema);
      
      // Migrate each collection
      await this.migrateCollection('users', LocalUser, User);
      await this.migrateCollection('applications', LocalApplication, Application);
      await this.migrateCollection('payments', LocalPayment, Payment);
      
      logger.info('Migration completed successfully!');
      
      // Close local connection
      await this.localConnection.close();
      logger.info('Local MongoDB connection closed');
      
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  // Verify migration
  async verifyMigration() {
    try {
      logger.info('Verifying migration...');
      
      const atlasUserCount = await User.countDocuments();
      const atlasApplicationCount = await Application.countDocuments();
      const atlasPaymentCount = await Payment.countDocuments();
      
      logger.info('Atlas document counts:');
      logger.info(`- Users: ${atlasUserCount}`);
      logger.info(`- Applications: ${atlasApplicationCount}`);
      logger.info(`- Payments: ${atlasPaymentCount}`);
      
      return {
        users: atlasUserCount,
        applications: atlasApplicationCount,
        payments: atlasPaymentCount
      };
      
    } catch (error) {
      logger.error('Verification failed:', error);
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new AtlasMigration();
  
  migration.migrateAll()
    .then(() => migration.verifyMigration())
    .then((counts) => {
      logger.info('Migration verification completed:', counts);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = AtlasMigration; 