require('dotenv').config();
const mongoose = require('mongoose');
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

async function checkAndFixZeroFees() {
  try {
    console.log('Starting to check and fix applications with ₹0 fees...');
    
    // Find all applications with zero fees
    const zeroFeeApplications = await Application.find({
      'payment.amount': { $in: [0, null, undefined] }
    }).populate('userId', 'email name');
    
    console.log(`Found ${zeroFeeApplications.length} applications with zero fees`);
    
    if (zeroFeeApplications.length === 0) {
      console.log('No applications with zero fees found. All good!');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const application of zeroFeeApplications) {
      try {
        const courseType = application.courseType;
        const category = application.personalDetails?.category;
        
        console.log(`\nProcessing application ${application.applicationNumber}:`);
        console.log(`  Course Type: ${courseType}`);
        console.log(`  Category: ${category}`);
        console.log(`  User Email: ${application.userId?.email}`);
        console.log(`  Current Fee: ${application.payment?.amount}`);
        
        // Calculate correct fee
        const calculatedFee = calculateFee(courseType, category);
        
        // Update the application with correct fee
        application.payment.amount = calculatedFee;
        await application.save();
        
        console.log(`  Updated Fee: ₹${calculatedFee}`);
        console.log(`  ---`);
        
        fixedCount++;
        
      } catch (error) {
        console.error(`Error fixing application ${application.applicationNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total applications with zero fees: ${zeroFeeApplications.length}`);
    console.log(`Applications fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Also check for applications with very low fees (₹1-5)
    const lowFeeApplications = await Application.find({
      'payment.amount': { $in: [1, 2, 3, 4, 5] }
    }).populate('userId', 'email name');
    
    if (lowFeeApplications.length > 0) {
      console.log(`\nFound ${lowFeeApplications.length} applications with very low fees (₹1-5):`);
      for (const app of lowFeeApplications) {
        console.log(`  ${app.applicationNumber}: ₹${app.payment.amount} (${app.courseType}/${app.personalDetails?.category}) - ${app.userId?.email}`);
      }
    }
    
    // Check specific users mentioned
    console.log('\n=== CHECKING SPECIFIC USERS ===');
    const specificUsers = await User.find({
      email: { $in: ['dagrahari306@gmail.com', 'kratisrivastava344@gmail.com'] }
    });
    
    if (specificUsers.length > 0) {
      console.log(`Found ${specificUsers.length} specific users:`);
      for (const user of specificUsers) {
        console.log(`  ${user.email}`);
        
        const userApps = await Application.find({ userId: user._id }).populate('userId', 'email name');
        console.log(`  Applications: ${userApps.length}`);
        
        for (const app of userApps) {
          console.log(`    ${app.applicationNumber}: ${app.courseType}/${app.personalDetails?.category} - ₹${app.payment?.amount}`);
        }
      }
    } else {
      console.log('Specific users not found in database');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixZeroFees(); 