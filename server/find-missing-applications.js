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

// Main function to find missing applications
const findMissingApplications = async () => {
  try {
    console.log('🔍 Finding missing applications by cross-referencing Payment and Application collections...\n');

    // Step 1: Get all completed payments
    const completedPayments = await Payment.find({ status: 'completed' })
      .populate('applicationId', 'applicationNumber courseType status payment')
      .populate('userId', 'name email');
    
    console.log(`📊 Found ${completedPayments.length} completed payments`);
    
    // Step 2: Get all applications
    const allApplications = await Application.find({})
      .populate('userId', 'name email');
    
    console.log(`📋 Found ${allApplications.length} total applications`);
    
    // Step 3: Find payments that don't have matching application status
    const mismatchedPayments = [];
    const orphanedPayments = [];
    
    for (const payment of completedPayments) {
      if (!payment.applicationId) {
        orphanedPayments.push(payment);
        continue;
      }
      
      const application = payment.applicationId;
      
      // Check if application status doesn't match payment status
      if (application.status !== 'payment_completed') {
        mismatchedPayments.push({
          payment: payment,
          application: application,
          currentStatus: application.status,
          expectedStatus: 'payment_completed'
        });
      }
    }
    
    console.log(`⚠️  Found ${mismatchedPayments.length} applications with mismatched status`);
    console.log(`⚠️  Found ${orphanedPayments.length} orphaned payments (no application reference)`);
    
    // Step 4: Show detailed breakdown of mismatched applications
    if (mismatchedPayments.length > 0) {
      console.log('\n🔧 APPLICATIONS WITH MISMATCHED STATUS:');
      console.log('=======================================');
      
      const bpharmMismatched = mismatchedPayments.filter(item => item.application.courseType === 'bpharm');
      const mpharmMismatched = mismatchedPayments.filter(item => item.application.courseType === 'mpharm');
      
      console.log(`BPharm mismatched: ${bpharmMismatched.length}`);
      console.log(`MPharm mismatched: ${mpharmMismatched.length}`);
      
      console.log('\n📝 DETAILED BREAKDOWN:');
      mismatchedPayments.forEach((item, index) => {
        const app = item.application;
        const payment = item.payment;
        console.log(`\n${index + 1}. ${app.applicationNumber} (${app.courseType})`);
        console.log(`   User: ${app.userId?.name || app.userId?.email}`);
        console.log(`   Current Status: ${app.status}`);
        console.log(`   Expected Status: payment_completed`);
        console.log(`   Payment: ₹${payment.amount} on ${payment.updatedAt.toLocaleDateString()}`);
        console.log(`   Payment ID: ${payment.razorpayOrderId}`);
      });
    }
    
    // Step 5: Show orphaned payments
    if (orphanedPayments.length > 0) {
      console.log('\n⚠️  ORPHANED PAYMENTS (NO APPLICATION REFERENCE):');
      console.log('==================================================');
      
      orphanedPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment: ${payment.razorpayOrderId}`);
        console.log(`   User: ${payment.userId?.name || payment.userId?.email}`);
        console.log(`   Amount: ₹${payment.amount}`);
        console.log(`   Date: ${payment.updatedAt.toLocaleDateString()}`);
        console.log(`   Receipt: ${payment.receipt}`);
      });
    }
    
    // Step 6: Count by course type
    const bpharmWithPayments = completedPayments.filter(p => 
      p.applicationId && p.applicationId.courseType === 'bpharm'
    );
    
    const mpharmWithPayments = completedPayments.filter(p => 
      p.applicationId && p.applicationId.courseType === 'mpharm'
    );
    
    console.log('\n📊 PAYMENT BREAKDOWN BY COURSE TYPE:');
    console.log('=====================================');
    console.log(`BPharm with payments: ${bpharmWithPayments.length}`);
    console.log(`MPharm with payments: ${mpharmWithPayments.length}`);
    console.log(`Total with payments: ${bpharmWithPayments.length + mpharmWithPayments.length}`);
    
    // Step 7: Count applications by status
    const bpharmCompleted = await Application.countDocuments({ 
      courseType: 'bpharm', 
      status: 'payment_completed' 
    });
    
    const mpharmCompleted = await Application.countDocuments({ 
      courseType: 'mpharm', 
      status: 'payment_completed' 
    });
    
    console.log('\n📊 APPLICATION STATUS BREAKDOWN:');
    console.log('=================================');
    console.log(`BPharm with payment_completed: ${bpharmCompleted}`);
    console.log(`MPharm with payment_completed: ${mpharmCompleted}`);
    console.log(`Total with payment_completed: ${bpharmCompleted + mpharmCompleted}`);
    
    // Step 8: Calculate the gap
    const bpharmGap = bpharmWithPayments.length - bpharmCompleted;
    const mpharmGap = mpharmWithPayments.length - mpharmCompleted;
    
    console.log('\n⚠️  GAP ANALYSIS:');
    console.log('==================');
    console.log(`BPharm gap: ${bpharmWithPayments.length} payments vs ${bpharmCompleted} applications = ${bpharmGap} missing`);
    console.log(`MPharm gap: ${mpharmWithPayments.length} payments vs ${mpharmCompleted} applications = ${mpharmGap} missing`);
    
    if (bpharmGap > 0) {
      console.log(`\n🔍 The ${bpharmGap} missing BPharm applications are the ones with mismatched status above.`);
      console.log(`They exist in the database but don't have 'payment_completed' status.`);
    }
    
  } catch (error) {
    console.error('❌ Error in find missing applications:', error);
  }
};

// Run the function
const main = async () => {
  try {
    await connectDB();
    await findMissingApplications();
    
    console.log('\n🎉 Missing applications analysis completed!');
    console.log('Review the output above to see exactly which applications need fixing.');
    
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

module.exports = { findMissingApplications };
