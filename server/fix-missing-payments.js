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
    const applicationsWithPayments = await Application.find({
      $or: [
        { status: 'payment_completed' },
        { status: 'admit_card_generated' }
      ]
    }).populate('userId', 'name email');
    
    console.log(`Found ${applicationsWithPayments.length} applications with completed payments`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const application of applicationsWithPayments) {
      // Check if payment record already exists
      const existingPayment = await Payment.findOne({
        applicationId: application._id
      });
      
      if (existingPayment) {
        console.log(`Payment record already exists for application ${application.applicationNumber}`);
        skippedCount++;
        continue;
      }
      
      // Create retroactive payment record
      try {
        const paymentRecord = new Payment({
          applicationId: application._id,
          userId: application.userId._id,
          razorpayOrderId: `retro_order_${application.applicationNumber}`,
          razorpayPaymentId: `retro_payment_${application.applicationNumber}`,
          amount: application.payment?.amount || 1000, // Default amount
          currency: 'INR',
          status: 'completed',
          receipt: `retro_receipt_${application.applicationNumber}`,
          notes: { 
            retroactive: true, 
            createdByScript: true,
            originalStatus: application.status,
            applicationNumber: application.applicationNumber
          },
          createdAt: application.updatedAt || application.createdAt,
          updatedAt: application.updatedAt || application.createdAt
        });
        
        await paymentRecord.save();
        console.log(`Created retroactive payment record for ${application.applicationNumber} (${application.userId.email})`);
        createdCount++;
        
      } catch (error) {
        console.error(`Error creating payment record for ${application.applicationNumber}:`, error.message);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total applications with completed payments: ${applicationsWithPayments.length}`);
    console.log(`Payment records created: ${createdCount}`);
    console.log(`Payment records skipped (already existed): ${skippedCount}`);
    
  } catch (error) {
    console.error('Error fixing missing payments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixMissingPayments(); 