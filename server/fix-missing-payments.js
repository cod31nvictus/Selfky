require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Application = require('./models/Application');
const User = require('./models/User');

async function fixMissingPayments() {
  try {
    console.log('Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    console.log('MongoDB URI found, connecting...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
    
    // Find applications with completed payments but no Payment records
    const applications = await Application.find({
      'payment.status': 'completed'
    }).populate('userId', 'name email');
    
    console.log(`Found ${applications.length} applications with completed payments`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const application of applications) {
      try {
        // Check if a payment record already exists for this application
        const existingPayment = await Payment.findOne({
          applicationId: application._id
        });
        
        if (existingPayment) {
          console.log(`Payment record already exists for ${application.applicationNumber}, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create a new payment record
        const paymentRecord = new Payment({
          applicationId: application._id,
          userId: application.userId._id,
          razorpayOrderId: `order_${application.applicationNumber}`,
          razorpayPaymentId: `pay_${application.applicationNumber}`,
          amount: application.payment?.amount || 0,
          currency: 'INR',
          status: 'completed',
          receipt: `receipt_${application.applicationNumber}`,
          notes: `Retroactively created for application ${application.applicationNumber}`,
          createdAt: application.payment?.completedAt || application.updatedAt,
          updatedAt: new Date()
        });
        
        await paymentRecord.save();
        console.log(`Created payment record for ${application.applicationNumber}`);
        createdCount++;
        
      } catch (error) {
        console.error(`Error creating payment record for ${application.applicationNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total applications with completed payments: ${applications.length}`);
    console.log(`Payment records created: ${createdCount}`);
    console.log(`Payment records skipped (already existed): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMissingPayments(); 