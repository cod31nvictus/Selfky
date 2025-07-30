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
function calculateExpectedFee(courseType, category) {
  let calculatedFee = 0;
  
  // Normalize category to handle edge cases
  const normalizedCategory = category ? category.trim() : '';
  
  if (courseType === 'bpharm') {
    // BPharm fees
    if (['General', 'OBC', 'EWS'].includes(normalizedCategory)) {
      calculatedFee = 1200;
    } else if (['SC', 'ST', 'PWD'].includes(normalizedCategory)) {
      calculatedFee = 900;
    } else {
      // Fallback for unknown categories
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
      calculatedFee = 1500;
    }
  } else {
    // Fallback for unknown course type
    calculatedFee = 1500;
  }
  
  return calculatedFee;
}

async function auditFees() {
  try {
    console.log('Starting comprehensive fee audit...');
    
    // Get all applications
    const allApplications = await Application.find().populate('userId', 'email name');
    console.log(`Total applications: ${allApplications.length}`);
    
    const issues = {
      zeroFees: [],
      lowFees: [],
      incorrectFees: [],
      missingCategories: [],
      unknownCategories: []
    };
    
    const validCategories = ['General', 'OBC', 'EWS', 'SC', 'ST', 'PWD'];
    
    for (const app of allApplications) {
      const courseType = app.courseType;
      const category = app.personalDetails?.category;
      const currentFee = app.payment?.amount || 0;
      const expectedFee = calculateExpectedFee(courseType, category);
      
      // Check for zero fees
      if (currentFee === 0) {
        issues.zeroFees.push({
          applicationNumber: app.applicationNumber,
          email: app.userId?.email,
          courseType,
          category,
          currentFee,
          expectedFee
        });
      }
      
      // Check for very low fees (₹1-5)
      if (currentFee > 0 && currentFee <= 5) {
        issues.lowFees.push({
          applicationNumber: app.applicationNumber,
          email: app.userId?.email,
          courseType,
          category,
          currentFee,
          expectedFee
        });
      }
      
      // Check for incorrect fees
      if (currentFee !== expectedFee && currentFee > 5) {
        issues.incorrectFees.push({
          applicationNumber: app.applicationNumber,
          email: app.userId?.email,
          courseType,
          category,
          currentFee,
          expectedFee
        });
      }
      
      // Check for missing categories
      if (!category || category.trim() === '') {
        issues.missingCategories.push({
          applicationNumber: app.applicationNumber,
          email: app.userId?.email,
          courseType,
          category,
          currentFee,
          expectedFee
        });
      }
      
      // Check for unknown categories
      if (category && !validCategories.includes(category.trim())) {
        issues.unknownCategories.push({
          applicationNumber: app.applicationNumber,
          email: app.userId?.email,
          courseType,
          category,
          currentFee,
          expectedFee
        });
      }
    }
    
    // Print results
    console.log('\n=== FEE AUDIT RESULTS ===');
    
    console.log(`\n1. Zero Fees (${issues.zeroFees.length}):`);
    issues.zeroFees.forEach(issue => {
      console.log(`   ${issue.applicationNumber}: ${issue.email} - ${issue.courseType}/${issue.category} - ₹${issue.currentFee} (should be ₹${issue.expectedFee})`);
    });
    
    console.log(`\n2. Low Fees (₹1-5) (${issues.lowFees.length}):`);
    issues.lowFees.forEach(issue => {
      console.log(`   ${issue.applicationNumber}: ${issue.email} - ${issue.courseType}/${issue.category} - ₹${issue.currentFee} (should be ₹${issue.expectedFee})`);
    });
    
    console.log(`\n3. Incorrect Fees (${issues.incorrectFees.length}):`);
    issues.incorrectFees.forEach(issue => {
      console.log(`   ${issue.applicationNumber}: ${issue.email} - ${issue.courseType}/${issue.category} - ₹${issue.currentFee} (should be ₹${issue.expectedFee})`);
    });
    
    console.log(`\n4. Missing Categories (${issues.missingCategories.length}):`);
    issues.missingCategories.forEach(issue => {
      console.log(`   ${issue.applicationNumber}: ${issue.email} - ${issue.courseType} - ₹${issue.currentFee}`);
    });
    
    console.log(`\n5. Unknown Categories (${issues.unknownCategories.length}):`);
    issues.unknownCategories.forEach(issue => {
      console.log(`   ${issue.applicationNumber}: ${issue.email} - ${issue.courseType}/${issue.category} - ₹${issue.currentFee}`);
    });
    
    // Summary
    const totalIssues = issues.zeroFees.length + issues.lowFees.length + issues.incorrectFees.length + issues.missingCategories.length + issues.unknownCategories.length;
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total applications: ${allApplications.length}`);
    console.log(`Applications with issues: ${totalIssues}`);
    console.log(`Clean applications: ${allApplications.length - totalIssues}`);
    
    // Check specific users
    console.log(`\n=== SPECIFIC USERS CHECK ===`);
    const specificUsers = await User.find({
      email: { $in: ['dagrahari306@gmail.com', 'kratisrivastava344@gmail.com'] }
    });
    
    if (specificUsers.length > 0) {
      for (const user of specificUsers) {
        console.log(`\nUser: ${user.email}`);
        const userApps = await Application.find({ userId: user._id }).populate('userId', 'email name');
        
        for (const app of userApps) {
          const expectedFee = calculateExpectedFee(app.courseType, app.personalDetails?.category);
          const currentFee = app.payment?.amount || 0;
          const status = currentFee === expectedFee ? '✅ CORRECT' : '❌ INCORRECT';
          
          console.log(`  ${app.applicationNumber}: ${app.courseType}/${app.personalDetails?.category} - ₹${currentFee} (expected ₹${expectedFee}) - ${status}`);
        }
      }
    } else {
      console.log('Specific users not found');
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

auditFees(); 