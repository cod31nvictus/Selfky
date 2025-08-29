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

// Main deep fix function
const deepFixPaymentMismatch = async () => {
  try {
    console.log('🔍 Starting DEEP payment status mismatch analysis...\n');

    // Step 1: Get all completed payments
    const completedPayments = await Payment.find({ status: 'completed' })
      .populate('applicationId', 'applicationNumber courseType status payment')
      .populate('userId', 'name email');
    
    console.log(`📊 Found ${completedPayments.length} completed payments`);
    
    // Step 2: Get all applications by course type
    const bpharmApplications = await Application.find({ courseType: 'bpharm' })
      .populate('userId', 'name email');
    
    const mpharmApplications = await Application.find({ courseType: 'mpharm' })
      .populate('userId', 'name email');
    
    console.log(`📋 Found ${bpharmApplications.length} BPharm applications`);
    console.log(`📋 Found ${mpharmApplications.length} MPharm applications`);
    console.log(`📋 Total applications: ${bpharmApplications.length + mpharmApplications.length}`);
    
    // Step 3: Analyze BPharm applications in detail
    console.log('\n🔍 ANALYZING BPHARM APPLICATIONS:');
    console.log('==================================');
    
    const bpharmWithPayments = [];
    const bpharmWithoutPayments = [];
    const bpharmMismatched = [];
    
    for (const app of bpharmApplications) {
      // Find payment record for this application
      const payment = completedPayments.find(p => 
        p.applicationId && p.applicationId._id.toString() === app._id.toString()
      );
      
      if (payment) {
        bpharmWithPayments.push({
          application: app,
          payment: payment,
          status: app.status
        });
        
        // Check if status is mismatched
        if (app.status !== 'payment_completed') {
          bpharmMismatched.push({
            application: app,
            payment: payment,
            currentStatus: app.status,
            expectedStatus: 'payment_completed'
          });
        }
      } else {
        bpharmWithoutPayments.push({
          application: app,
          status: app.status
        });
      }
    }
    
    console.log(`✅ BPharm with completed payments: ${bpharmWithPayments.length}`);
    console.log(`❌ BPharm without payment records: ${bpharmWithoutPayments.length}`);
    console.log(`⚠️  BPharm with mismatched status: ${bpharmMismatched.length}`);
    
    // Step 4: Analyze MPharm applications
    console.log('\n🔍 ANALYZING MPHARM APPLICATIONS:');
    console.log('==================================');
    
    const mpharmWithPayments = [];
    const mpharmWithoutPayments = [];
    const mpharmMismatched = [];
    
    for (const app of mpharmApplications) {
      const payment = completedPayments.find(p => 
        p.applicationId && p.applicationId._id.toString() === app._id.toString()
      );
      
      if (payment) {
        mpharmWithPayments.push({
          application: app,
          payment: payment,
          status: app.status
        });
        
        if (app.status !== 'payment_completed') {
          mpharmMismatched.push({
            application: app,
            payment: payment,
            currentStatus: app.status,
            expectedStatus: 'payment_completed'
          });
        }
      } else {
        mpharmWithoutPayments.push({
          application: app,
          status: app.status
        });
      }
    }
    
    console.log(`✅ MPharm with completed payments: ${mpharmWithPayments.length}`);
    console.log(`❌ MPharm without payment records: ${mpharmWithoutPayments.length}`);
    console.log(`⚠️  MPharm with mismatched status: ${mpharmMismatched.length}`);
    
    // Step 5: Find orphaned payments (payments without applications)
    const orphanedPayments = completedPayments.filter(p => !p.applicationId);
    console.log(`\n⚠️  Orphaned payments (no application reference): ${orphanedPayments.length}`);
    
    // Step 6: Fix all mismatched applications
    console.log('\n🔧 FIXING ALL MISMATCHED APPLICATIONS...');
    console.log('==========================================');
    
    const allMismatched = [...bpharmMismatched, ...mpharmMismatched];
    const fixedApplications = [];
    
    for (const item of allMismatched) {
      try {
        const app = item.application;
        const oldStatus = app.status;
        
        app.status = 'payment_completed';
        app.payment.status = 'completed';
        app.payment.paymentDate = item.payment.updatedAt;
        await app.save();
        
        fixedApplications.push({
          applicationNumber: app.applicationNumber,
          courseType: app.courseType,
          oldStatus: oldStatus,
          newStatus: 'payment_completed',
          userName: app.userId?.name || app.userId?.email
        });
        
        console.log(`✅ Fixed ${app.applicationNumber} (${app.courseType}) - ${oldStatus} → payment_completed`);
      } catch (error) {
        console.error(`❌ Failed to fix ${item.application.applicationNumber}:`, error.message);
      }
    }
    
    // Step 7: Investigate applications without payment records
    console.log('\n🔍 INVESTIGATING APPLICATIONS WITHOUT PAYMENT RECORDS...');
    console.log('=======================================================');
    
    const allWithoutPayments = [...bpharmWithoutPayments, ...mpharmWithoutPayments];
    
    for (const item of allWithoutPayments) {
      const app = item.application;
      console.log(`\n📝 Application: ${app.applicationNumber} (${app.courseType})`);
      console.log(`   Status: ${app.status}`);
      console.log(`   User: ${app.userId?.name || app.userId?.email}`);
      console.log(`   Created: ${app.createdAt.toLocaleDateString()}`);
      
      // Check if there's a payment by user email or other criteria
      const potentialPayment = completedPayments.find(p => 
        p.userId && p.userId.email === app.userId?.email
      );
      
      if (potentialPayment) {
        console.log(`   🔍 Found potential payment: ${potentialPayment.razorpayOrderId}`);
        console.log(`   💰 Amount: ₹${potentialPayment.amount}`);
        console.log(`   📅 Date: ${potentialPayment.updatedAt.toLocaleDateString()}`);
        
        if (!potentialPayment.applicationId) {
          console.log(`   ⚠️  Payment has no application reference - this might be the missing link!`);
        }
      } else {
        console.log(`   ❌ No payment found for this user`);
      }
    }
    
    // Step 8: Final verification
    console.log('\n🔍 FINAL VERIFICATION...');
    console.log('========================');
    
    const finalBpharm = await Application.countDocuments({ 
      courseType: 'bpharm', 
      status: 'payment_completed' 
    });
    
    const finalMpharm = await Application.countDocuments({ 
      courseType: 'mpharm', 
      status: 'payment_completed' 
    });
    
    const totalEligible = await Application.countDocuments({ 
      status: 'payment_completed' 
    });
    
    console.log(`🎯 BPharm with payment_completed: ${finalBpharm}`);
    console.log(`🎯 MPharm with payment_completed: ${finalMpharm}`);
    console.log(`🎯 Total eligible for admit cards: ${totalEligible}`);
    
    // Step 9: Summary
    console.log('\n📈 COMPREHENSIVE ANALYSIS SUMMARY');
    console.log('==================================');
    console.log(`Expected BPharm: 89 (based on payment screen)`);
    console.log(`Current BPharm: ${finalBpharm}`);
    console.log(`Missing BPharm: ${89 - finalBpharm}`);
    console.log(`Expected MPharm: 2`);
    console.log(`Current MPharm: ${finalMpharm}`);
    console.log(`Missing MPharm: ${2 - finalMpharm}`);
    
    if (finalBpharm < 89) {
      console.log(`\n⚠️  STILL MISSING ${89 - finalBpharm} BPHARM APPLICATIONS!`);
      console.log(`This suggests there are payment records that are not properly linked to applications.`);
      console.log(`You may need to manually investigate the orphaned payments.`);
    }
    
  } catch (error) {
    console.error('❌ Error in deep fix process:', error);
  }
};

// Run the fix
const main = async () => {
  try {
    await connectDB();
    await deepFixPaymentMismatch();
    
    console.log('\n🎉 Deep payment status analysis completed!');
    console.log('Review the output above to understand the complete picture.');
    
  } catch (error) {
    console.error('❌ Main process failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { deepFixPaymentMismatch };
