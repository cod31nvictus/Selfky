require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabaseSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Checking Database Schema...');
    
    // Check Users collection schema
    console.log('\n👥 USERS Collection Schema:');
    const users = mongoose.connection.db.collection('users');
    const sampleUser = await users.findOne({});
    if (sampleUser) {
      console.log('Sample user keys:', Object.keys(sampleUser));
      console.log('User structure:', JSON.stringify(sampleUser, null, 2));
    }
    
    // Check Applications collection schema
    console.log('\n📋 APPLICATIONS Collection Schema:');
    const applications = mongoose.connection.db.collection('applications');
    const sampleApp = await applications.findOne({});
    if (sampleApp) {
      console.log('Sample application keys:', Object.keys(sampleApp));
      console.log('Application structure:', JSON.stringify(sampleApp, null, 2));
    }
    
    // Check Payments collection schema
    console.log('\n💳 PAYMENTS Collection Schema:');
    const payments = mongoose.connection.db.collection('payments');
    const samplePayment = await payments.findOne({});
    if (samplePayment) {
      console.log('Sample payment keys:', Object.keys(samplePayment));
      console.log('Payment structure:', JSON.stringify(samplePayment, null, 2));
    }
    
    // Check if there are any relationships
    console.log('\n🔗 Checking Relationships:');
    if (sampleApp && sampleUser) {
      console.log('Application userId type:', typeof sampleApp.userId);
      console.log('User _id type:', typeof sampleUser._id);
      console.log('Do they match?', sampleApp.userId.toString() === sampleUser._id.toString());
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseSchema();
