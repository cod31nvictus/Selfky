require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function investigateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Investigating user data...');
    
    // Find the user
    const user = await User.findOne({ email: 'vatsalvardhan9@gmail.com' });
    
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('User ID:', user._id);
      console.log('Name:', user.name || 'Not set');
      
      // Check all user properties
      console.log('\n📋 All user properties:');
      const userKeys = Object.keys(user.toObject());
      console.log('Keys:', userKeys);
      
      // Check if application exists in different ways
      console.log('\n🔍 Application checks:');
      console.log('user.application:', user.application);
      console.log('user.application exists:', !!user.application);
      console.log('user.application type:', typeof user.application);
      
      if (user.application) {
        console.log('\n📋 Application details:');
        console.log('Photo:', user.application.photo);
        console.log('Signature:', user.application.signature);
        console.log('Course:', user.application.courseType);
        console.log('Payment status:', user.application.paymentStatus);
        console.log('Created:', user.application.createdAt);
      }
      
      // Check for nested application data
      console.log('\n🔍 Checking for nested data:');
      const userObj = user.toObject();
      for (let key in userObj) {
        if (typeof userObj[key] === 'object' && userObj[key] !== null) {
          console.log(`${key}:`, Object.keys(userObj[key]));
        }
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

investigateUser();
