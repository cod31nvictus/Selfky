require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/selfky';

async function testDatabase() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Check users
    const users = await User.find({});
    console.log('\n=== USERS ===');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt}`);
    });

    // Check applications
    const applications = await Application.find({});
    console.log('\n=== APPLICATIONS ===');
    console.log(`Total applications: ${applications.length}`);
    applications.forEach(app => {
      console.log(`- ${app.applicationNumber} - ${app.courseType} - Status: ${app.status} - Created: ${app.createdAt}`);
    });

    // Test admin routes
    console.log('\n=== TESTING ADMIN ROUTES ===');
    
    // Test applicants endpoint
    const testApplicants = await User.find({}, '-password').sort({ createdAt: -1 });
    console.log(`Admin applicants endpoint would return: ${testApplicants.length} users`);

    // Test applications endpoint
    const testApplications = await Application.find({})
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });
    console.log(`Admin applications endpoint would return: ${testApplications.length} applications`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  }
}

testDatabase(); 