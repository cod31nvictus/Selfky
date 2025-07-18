const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const logger = require('./logger');

async function createIndexes() {
  try {
    console.log('Creating database indexes...');
    
    // Create indexes for User model
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ resetToken: 1 });
    await User.collection.createIndex({ resetTokenExpiry: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created');
    
    // Create indexes for Application model
    await Application.collection.createIndex({ applicationNumber: 1 });
    await Application.collection.createIndex({ userId: 1 });
    await Application.collection.createIndex({ courseType: 1 });
    await Application.collection.createIndex({ status: 1 });
    await Application.collection.createIndex({ 'payment.status': 1 });
    await Application.collection.createIndex({ createdAt: -1 });
    await Application.collection.createIndex({ updatedAt: -1 });
    await Application.collection.createIndex({ 'personalDetails.category': 1 });
    await Application.collection.createIndex({ 'admitCard.rollNumber': 1 });
    
    // Create compound indexes for Application
    await Application.collection.createIndex({ userId: 1, status: 1 });
    await Application.collection.createIndex({ courseType: 1, status: 1 });
    await Application.collection.createIndex({ 'payment.status': 1, createdAt: -1 });
    await Application.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('✅ Application indexes created');
    
    // Create indexes for Payment model (already defined in model)
    await Payment.collection.createIndex({ applicationId: 1, createdAt: -1 });
    await Payment.collection.createIndex({ userId: 1, createdAt: -1 });
    await Payment.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('✅ Payment indexes created');
    
    console.log('🎉 All database indexes created successfully!');
    
    // Log index information
    const userIndexes = await User.collection.getIndexes();
    const applicationIndexes = await Application.collection.getIndexes();
    const paymentIndexes = await Payment.collection.getIndexes();
    
    console.log('\n📊 Index Summary:');
    console.log(`Users: ${Object.keys(userIndexes).length} indexes`);
    console.log(`Applications: ${Object.keys(applicationIndexes).length} indexes`);
    console.log(`Payments: ${Object.keys(paymentIndexes).length} indexes`);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky')
    .then(() => {
      console.log('Connected to MongoDB');
      return createIndexes();
    })
    .then(() => {
      console.log('Index creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create indexes:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes }; 