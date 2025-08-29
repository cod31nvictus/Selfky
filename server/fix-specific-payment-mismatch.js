const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Payment = require('./models/Payment');
const Application = require('./models/Application');
const User = require('./models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Main fix function
const fixSpecificPaymentMismatch = async () => {
  try {
    console.log('🔍 Starting specific payment status mismatch fix...\n');

    // Step 1: Find all completed payments
    const completedPayments = await Payment.find({ status: 'completed' });
    console.log(`📊 Found ${completedPayments.length} completed payments\n`);

    // Step 2: Find all applications with payment_completed status
    const completedApplications = await Application.find({ status: 'payment_completed' });
    console.log(`📋 Found ${completedApplications.length} applications with payment_completed status\n`);

    // Step 3: Find the specific mismatch - applications that should be payment_completed
    const mismatchedApplications = [];
    
    for (const payment of completedPayments) {
      if (payment.applicationId) {
        const application = await Application.findById(payment.applicationId);
        if (application && application.status !== 'payment_completed') {
          mismatchedApplications.push({
            payment,
            application,
            expectedStatus: 'payment_completed',
            currentStatus: application.status
          });
        }
      }
    }

    console.log(`⚠️  Found ${mismatchedApplications.length} applications with mismatched payment status:\n`);

    if (mismatchedApplications.length === 0) {
      console.log('✅ No mismatched applications found. All payments are properly linked.');
      return;
    }

    // Step 4: Display the mismatched applications
    for (const mismatch of mismatchedApplications) {
      console.log(`📝 Application: ${mismatch.application.applicationNumber} (${mismatch.application.courseType})`);
      console.log(`   User: ${mismatch.application.userId}`);
      console.log(`   Current Status: ${mismatch.currentStatus}`);
      console.log(`   Expected Status: ${mismatch.expectedStatus}`);
      console.log(`   Payment ID: ${mismatch.payment.razorpayPaymentId}`);
      console.log(`   Order ID: ${mismatch.payment.razorpayOrderId}`);
      console.log(`   Amount: ₹${mismatch.payment.amount}`);
      console.log(`   Payment Date: ${mismatch.payment.createdAt.toLocaleDateString()}`);
      console.log('   ---');
    }

    // Step 5: Fix the mismatched applications
    console.log(`🔧 Fixing ${mismatchedApplications.length} mismatched applications...\n`);
    
    let fixedCount = 0;
    for (const mismatch of mismatchedApplications) {
      try {
        // Update application status
        await Application.findByIdAndUpdate(
          mismatch.application._id,
          { 
            status: 'payment_completed',
            updatedAt: new Date()
          }
        );

        console.log(`✅ Fixed: ${mismatch.application.applicationNumber} - Status updated from '${mismatch.currentStatus}' to 'payment_completed'`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Failed to fix ${mismatch.application.applicationNumber}:`, error.message);
      }
    }

    // Step 6: Final verification
    console.log(`\n🔍 Final verification...`);
    const finalCompletedApplications = await Application.find({ status: 'payment_completed' });
    const finalCompletedPayments = await Payment.find({ status: 'completed' });
    
    console.log(`📊 Final count:`);
    console.log(`   Applications with payment_completed: ${finalCompletedApplications.length}`);
    console.log(`   Completed payments: ${finalCompletedPayments.length}`);
    
    if (finalCompletedApplications.length === finalCompletedPayments.length) {
      console.log(`✅ SUCCESS: All ${finalCompletedPayments.length} completed payments now have matching application status!`);
    } else {
      console.log(`⚠️  WARNING: Still have ${finalCompletedPayments.length - finalCompletedApplications.length} mismatched applications`);
    }

    // Step 7: Show breakdown by course type
    const bpharmCompleted = finalCompletedApplications.filter(app => app.courseType === 'bpharm').length;
    const mpharmCompleted = finalCompletedApplications.filter(app => app.courseType === 'mpharm').length;
    
    console.log(`\n📈 Course breakdown:`);
    console.log(`   BPharm with payment_completed: ${bpharmCompleted}`);
    console.log(`   MPharm with payment_completed: ${mpharmCompleted}`);
    console.log(`   Total: ${bpharmCompleted + mpharmCompleted}`);

    console.log(`\n🎉 Specific payment status mismatch fix completed!`);
    console.log(`Fixed ${fixedCount} applications.`);

  } catch (error) {
    console.error('❌ Error in fixSpecificPaymentMismatch:', error);
  }
};

// Run the fix
const runFix = async () => {
  try {
    await connectDB();
    await fixSpecificPaymentMismatch();
  } catch (error) {
    console.error('❌ Error running fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

runFix();
