require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Checking database collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections found:');
    collections.forEach(col => console.log('-', col.name));
    
    // Check if there's a separate Application collection
    if (collections.find(col => col.name === 'applications')) {
      console.log('\n✅ Found applications collection!');
      
      // Check what's in the applications collection
      const Application = mongoose.connection.db.collection('applications');
      const appCount = await Application.countDocuments();
      console.log(`Applications count: ${appCount}`);
      
      if (appCount > 0) {
        const sampleApp = await Application.findOne({});
        console.log('Sample application keys:', Object.keys(sampleApp));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCollections();
