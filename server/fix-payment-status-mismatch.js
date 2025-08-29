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
const fixPaymentStatusMismatch = async () => {
  try {
    console.log('🔍 Starting payment status mismatch fix...\n');

    // Step 1: Get all completed payments
    const completedPayments = await Payment.find({ status: 'completed' })
      .populate('applicationId', 'applicationNumber courseType status payment')
      .populate('userId', 'name email');
    
    console.log(`📊 Found ${completedPayments.length} completed payments`);
    
    // Step 2: Get all applications
    const allApplications = await Application.find({})
      .populate('userId', 'name email');
    
    console.log(`📋 Found ${allApplications.length} total applications`);
    
    // Step 3: Analyze the mismatch
    const mismatchDetails = [];
    const fixedApplications = [];
    
    for (const payment of completedPayments) {
      if (!payment.applicationId) {
        console.log(`⚠️  Payment ${payment._id} has no application reference`);
        continue;
      }
      
      const application = payment.applicationId;
      
      // Check if application status doesn't match payment status
      if (application.status !== 'payment_completed') {
        mismatchDetails.push({
          paymentId: payment._id,
          applicationId: application._id,
          applicationNumber: application.applicationNumber,
          courseType: application.courseType,
          userName: payment.userId?.name || payment.userId?.email,
          currentStatus: application.status,
          expectedStatus: 'payment_completed',
          paymentAmount: payment.amount,
          paymentDate: payment.updatedAt
        });
        
        // Fix the application status
        try {
          application.status = 'payment_completed';
          application.payment.status = 'completed';
          application.payment.paymentDate = payment.updatedAt;
          await application.save();
          
          fixedApplications.push({
            applicationNumber: application.applicationNumber,
            courseType: application.courseType,
            oldStatus: application.status,
            newStatus: 'payment_completed'
          });
          
          console.log(`✅ Fixed application ${application.applicationNumber} (${application.courseType})`);
        } catch (error) {
          console.error(`❌ Failed to fix application ${application.applicationNumber}:`, error.message);
        }
      }
    }
    
    // Step 4: Generate report
    console.log('\n📈 MISMATCH ANALYSIS REPORT');
    console.log('============================');
    console.log(`Total completed payments: ${completedPayments.length}`);
    console.log(`Total applications: ${allApplications.length}`);
    console.log(`Applications with mismatched status: ${mismatchDetails.length}`);
    console.log(`Successfully fixed: ${fixedApplications.length}`);
    
    if (mismatchDetails.length > 0) {
      console.log('\n🔧 DETAILED MISMATCH BREAKDOWN:');
      console.log('================================');
      
      const courseTypeBreakdown = {};
      mismatchDetails.forEach(item => {
        if (!courseTypeBreakdown[item.courseType]) {
          courseTypeBreakdown[item.courseType] = 0;
        }
        courseTypeBreakdown[item.courseType]++;
      });
      
      Object.entries(courseTypeBreakdown).forEach(([courseType, count]) => {
        console.log(`${courseType.toUpperCase()}: ${count} applications`);
      });
      
      console.log('\n📝 INDIVIDUAL MISMATCHES:');
      mismatchDetails.forEach((item, index) => {
        console.log(`${index + 1}. ${item.applicationNumber} (${item.courseType}) - ${item.userName}`);
        console.log(`   Current: ${item.currentStatus} → Expected: ${item.expectedStatus}`);
        console.log(`   Payment: ₹${item.paymentAmount} on ${item.paymentDate.toLocaleDateString()}`);
      });
    }
    
    // Step 5: Verify the fix
    console.log('\n🔍 VERIFYING THE FIX...');
    const verifiedCompletedPayments = await Payment.find({ status: 'completed' })
      .populate('applicationId', 'applicationNumber courseType status');
    
    const stillMismatched = verifiedCompletedPayments.filter(payment => 
      payment.applicationId && payment.applicationId.status !== 'payment_completed'
    );
    
    if (stillMismatched.length === 0) {
      console.log('✅ All payment status mismatches have been resolved!');
    } else {
      console.log(`⚠️  ${stillMismatched.length} applications still have mismatched status`);
    }
    
    // Step 6: Final statistics
    const finalStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 FINAL APPLICATION STATUS BREAKDOWN:');
    console.log('=====================================');
    finalStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} applications`);
    });
    
    // Step 7: Count applications eligible for admit cards
    const eligibleForAdmitCard = await Application.countDocuments({
      status: 'payment_completed'
    });
    
    console.log(`\n🎫 Applications eligible for admit cards: ${eligibleForAdmitCard}`);
    
  } catch (error) {
    console.error('❌ Error in fix process:', error);
  }
};

// Run the fix
const main = async () => {
  try {
    await connectDB();
    await fixPaymentStatusMismatch();
    
    console.log('\n🎉 Payment status mismatch fix completed!');
    console.log('You can now run the invigilator sheet script to verify the fix.');
    
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

module.exports = { fixPaymentStatusMismatch };
