require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function runAudit() {
  try {
    console.log('Running fee audit...');
    
    // Check for zero fees
    const zeroFeeApps = await Application.find({'payment.amount': 0}).populate('userId', 'email name');
    console.log('Applications with ₹0 fees:', zeroFeeApps.length);
    
    for (const app of zeroFeeApps) {
      console.log(`  ${app.applicationNumber}: ${app.courseType}/${app.personalDetails?.category} - ${app.userId?.email}`);
    }
    
    // Check specific users
    const specificUsers = await User.find({
      email: { $in: ['dagrahari306@gmail.com', 'kratisrivastava344@gmail.com'] }
    });
    
    console.log('\nSpecific users found:', specificUsers.length);
    
    for (const user of specificUsers) {
      console.log(`\nUser: ${user.email}`);
      const userApps = await Application.find({ userId: user._id }).populate('userId', 'email name');
      
      for (const app of userApps) {
        console.log(`  ${app.applicationNumber}: ${app.courseType}/${app.personalDetails?.category} - ₹${app.payment?.amount}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runAudit(); 