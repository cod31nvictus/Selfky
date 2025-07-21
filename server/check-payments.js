require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

async function checkPayments() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
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
        console.log(`   Order ID: ${payment.razorpayOrderId}`);
        console.log(`   Payment ID: ${payment.razorpayPaymentId || 'N/A'}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Amount: ${payment.amount}`);
        console.log(`   Application: ${payment.applicationId?.applicationNumber || 'N/A'}`);
        console.log(`   User: ${payment.userId?.name || 'N/A'} (${payment.userId?.email || 'N/A'})`);
        console.log(`   Created: ${payment.createdAt}`);
      });
    }
    
    // Check applications with payment status
    const Application = require('./models/Application');
    const applications = await Application.find({
      $or: [
        { 'payment.status': { $exists: true } },
        { status: { $in: ['payment_pending', 'payment_completed'] } }
      ]
    }).populate('userId', 'name email');
    
    console.log(`\nApplications with payment info: ${applications.length}`);
    
    applications.forEach((app, index) => {
      console.log(`\n${index + 1}. Application: ${app.applicationNumber}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Payment Status: ${app.payment?.status || 'N/A'}`);
      console.log(`   Payment ID: ${app.payment?.paymentId || 'N/A'}`);
      console.log(`   User: ${app.userId?.name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkPayments(); 