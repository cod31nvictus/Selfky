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
const fixPaymentVerificationBug = async () => {
  try {
    console.log('🔍 Starting payment verification bug fix...\n');

    // Step 1: Find all applications with payment_completed status
    const completedApplications = await Application.find({ status: 'payment_completed' });
    console.log(`📋 Found ${completedApplications.length} applications with payment_completed status\n`);

    // Step 2: Find applications where payment.status is not 'completed'
    const mismatchedApplications = [];
    
    for (const application of completedApplications) {
      if (application.payment && application.payment.status !== 'completed') {
        mismatchedApplications.push({
          application,
          currentPaymentStatus: application.payment.status,
          expectedPaymentStatus: 'completed'
        });
      }
    }

    console.log(`⚠️  Found ${mismatchedApplications.length} applications with mismatched payment.status:\n`);

    if (mismatchedApplications.length === 0) {
      console.log('✅ No mismatched applications found. All payment.status fields are correct.');
      return;
    }

    // Step 3: Display the mismatched applications
    for (const mismatch of mismatchedApplications) {
      console.log(`📝 Application: ${mismatch.application.applicationNumber} (${mismatch.application.courseType})`);
      console.log(`   User ID: ${mismatch.application.userId}`);
      console.log(`   Current payment.status: ${mismatch.currentPaymentStatus}`);
      console.log(`   Expected payment.status: ${mismatch.expectedPaymentStatus}`);
      console.log(`   Application status: ${mismatch.application.status}`);
      console.log(`   Payment amount: ₹${mismatch.application.payment.amount}`);
      console.log('   ---');
    }

    // Step 4: Fix the mismatched applications
    console.log(`🔧 Fixing ${mismatchedApplications.length} mismatched applications...\n`);
    
    let fixedCount = 0;
    for (const mismatch of mismatchedApplications) {
      try {
        // Update application.payment.status
        await Application.findByIdAndUpdate(
          mismatch.application._id,
          { 
            'payment.status': 'completed',
            updatedAt: new Date()
          }
        );

        console.log(`✅ Fixed: ${mismatch.application.applicationNumber} - payment.status updated from '${mismatch.currentPaymentStatus}' to 'completed'`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Failed to fix ${mismatch.application.applicationNumber}:`, error.message);
      }
    }

    // Step 5: Final verification
    console.log(`\n🔍 Final verification...`);
    const finalCompletedApplications = await Application.find({ status: 'payment_completed' });
    const finalCorrectPaymentStatus = await Application.find({ 
      status: 'payment_completed',
      'payment.status': 'completed'
    });
    
    console.log(`📊 Final count:`);
    console.log(`   Applications with payment_completed status: ${finalCompletedApplications.length}`);
    console.log(`   Applications with correct payment.status: ${finalCorrectPaymentStatus.length}`);
    
    if (finalCompletedApplications.length === finalCorrectPaymentStatus.length) {
      console.log(`✅ SUCCESS: All ${finalCompletedApplications.length} applications now have correct payment.status!`);
    } else {
      console.log(`⚠️  WARNING: Still have ${finalCompletedApplications.length - finalCorrectPaymentStatus.length} applications with incorrect payment.status`);
    }

    // Step 6: Show breakdown by course type
    const bpharmCompleted = finalCorrectPaymentStatus.filter(app => app.courseType === 'bpharm').length;
    const mpharmCompleted = finalCorrectPaymentStatus.filter(app => app.courseType === 'mpharm').length;
    
    console.log(`\n📈 Course breakdown:`);
    console.log(`   BPharm with correct payment.status: ${bpharmCompleted}`);
    console.log(`   MPharm with correct payment.status: ${mpharmCompleted}`);
    console.log(`   Total: ${bpharmCompleted + mpharmCompleted}`);

    console.log(`\n🎉 Payment verification bug fix completed!`);
    console.log(`Fixed ${fixedCount} applications.`);

  } catch (error) {
    console.error('❌ Error in fixPaymentVerificationBug:', error);
  }
};

// Run the fix
const runFix = async () => {
  try {
    await connectDB();
    await fixPaymentVerificationBug();
  } catch (error) {
    console.error('❌ Error running fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

runFix();
