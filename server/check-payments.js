require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Application = require('./models/Application');
const User = require('./models/User');

async function checkPayments() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Check if environment variables are loaded
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MongoDB URI not found in environment variables');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      process.exit(1);
    }
    
    console.log('MongoDB URI found, connecting...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
    
    const payments = await Payment.find({})
      .populate('applicationId', 'applicationNumber courseType')
      .populate('userId', 'name email');
    
    console.log(`Total payments found: ${payments.length}`);
    
    if (payments.length === 0) {
      console.log('No payment records found in database');
    } else {
      console.log('\nPayment records:');
      payments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment ID: ${payment._id}`);
        console.log(`   Order ID: ${payment.orderId}`);
        console.log(`   Transaction ID: ${payment.transactionId}`);
        console.log(`   Amount: ${payment.amount}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Created: ${payment.createdAt}`);
        console.log(`   Updated: ${payment.updatedAt}`);
        
        if (payment.applicationId) {
          console.log(`   Application: ${payment.applicationId.applicationNumber} (${payment.applicationId.courseType})`);
        }
        
        if (payment.userId) {
          console.log(`   User: ${payment.userId.name} (${payment.userId.email})`);
        }
      });
    }
    
    // Also check for any recent payment attempts
    console.log('\n--- Recent Payment Activity ---');
    const recentPayments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (recentPayments.length > 0) {
      console.log('Most recent payments:');
      recentPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.status} - ${payment.amount} - ${payment.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking payments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkPayments(); 