require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Application = require('./models/Application');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Fee calculation function (same as in applications.js)
function calculateFee(courseType, category) {
  let calculatedFee = 0;
  
  // Normalize category to handle edge cases
  const normalizedCategory = category ? category.trim() : '';
  
  console.log(`Fee calculation input: courseType=${courseType}, category="${category}", normalizedCategory="${normalizedCategory}"`);
  
  if (courseType === 'bpharm') {
    // BPharm fees
    if (['General', 'OBC', 'EWS'].includes(normalizedCategory)) {
      calculatedFee = 1200;
    } else if (['SC', 'ST', 'PWD'].includes(normalizedCategory)) {
      calculatedFee = 900;
    } else {
      // Fallback for unknown categories
      console.warn(`Unknown category "${normalizedCategory}" for BPharm, using default fee`);
      calculatedFee = 1200;
    }
  } else if (courseType === 'mpharm') {
    // MPharm fees
    if (['General', 'OBC', 'EWS'].includes(normalizedCategory)) {
      calculatedFee = 1500;
    } else if (['SC', 'ST', 'PWD'].includes(normalizedCategory)) {
      calculatedFee = 1000;
    } else {
      // Fallback for unknown categories
      console.warn(`Unknown category "${normalizedCategory}" for MPharm, using default fee`);
      calculatedFee = 1500;
    }
  } else {
    // Fallback for unknown course type
    console.warn(`Unknown course type "${courseType}", using default fee`);
    calculatedFee = 1500;
  }
  
  // Final safety check
  if (calculatedFee === 0) {
    console.error(`Fee calculation resulted in 0 for ${courseType}/${normalizedCategory}, using fallback`);
    calculatedFee = courseType === 'bpharm' ? 1200 : 1500;
  }
  
  console.log(`Fee calculation result for ${courseType}/${normalizedCategory}: ₹${calculatedFee}`);
  return calculatedFee;
}

async function fixPaymentZeroAmounts() {
  try {
    console.log('Starting to check and fix Payment records with ₹0 amounts...');
    
    // Find all payment records with zero amounts
    const zeroAmountPayments = await Payment.find({
      amount: { $in: [0, null, undefined] }
    }).populate('applicationId').populate('userId', 'email name');
    
    console.log(`Found ${zeroAmountPayments.length} payment records with zero amounts`);
    
    if (zeroAmountPayments.length === 0) {
      console.log('No payment records with zero amounts found. All good!');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const payment of zeroAmountPayments) {
      try {
        console.log(`\nProcessing payment record ${payment._id}:`);
        console.log(`  Transaction ID: ${payment.transactionId}`);
        console.log(`  Razorpay Order ID: ${payment.razorpayOrderId}`);
        console.log(`  Current Amount: ${payment.amount}`);
        console.log(`  Status: ${payment.status}`);
        
        // Get application details
        const application = payment.applicationId;
        if (!application) {
          console.log(`  ❌ No application found for payment record`);
          errorCount++;
          continue;
        }
        
        const courseType = application.courseType;
        const category = application.personalDetails?.category;
        
        console.log(`  Application Number: ${application.applicationNumber}`);
        console.log(`  Course Type: ${courseType}`);
        console.log(`  Category: ${category}`);
        console.log(`  User Email: ${payment.userId?.email}`);
        
        // Calculate correct fee
        const calculatedFee = calculateFee(courseType, category);
        
        // Update the payment record with correct amount
        payment.amount = calculatedFee;
        await payment.save();
        
        console.log(`  ✅ Updated Amount: ₹${calculatedFee}`);
        console.log(`  ---`);
        
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error fixing payment record ${payment._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total payment records with zero amounts: ${zeroAmountPayments.length}`);
    console.log(`Payment records fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Also check for payment records with very low amounts (₹1-5)
    const lowAmountPayments = await Payment.find({
      amount: { $in: [1, 2, 3, 4, 5] }
    }).populate('applicationId').populate('userId', 'email name');
    
    if (lowAmountPayments.length > 0) {
      console.log(`\nFound ${lowAmountPayments.length} payment records with very low amounts (₹1-5):`);
      for (const payment of lowAmountPayments) {
        console.log(`  ${payment.transactionId}: ₹${payment.amount} (${payment.applicationId?.courseType}/${payment.applicationId?.personalDetails?.category}) - ${payment.userId?.email}`);
      }
    }
    
    // Check specific failed orders mentioned
    console.log('\n=== CHECKING SPECIFIC FAILED ORDERS ===');
    const specificOrderIds = [
      'failed_order_1753932272744',
      'failed_order_1753930143635',
      'failed_order_1753930143057',
      'failed_order_1753930142501',
      'failed_order_1753930141932',
      'failed_order_1753930141371',
      'failed_order_1753930140817',
      'failed_order_1753930140316',
      'failed_order_1753930139258',
      'failed_order_1753930133454',
      'failed_order_1753930110203'
    ];
    
    for (const orderId of specificOrderIds) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId })
        .populate('applicationId')
        .populate('userId', 'email name');
      
      if (payment) {
        console.log(`  ${orderId}: ₹${payment.amount} - ${payment.userId?.email} - ${payment.applicationId?.applicationNumber}`);
      } else {
        console.log(`  ${orderId}: Not found in database`);
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPaymentZeroAmounts(); 