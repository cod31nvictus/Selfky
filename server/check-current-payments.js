const mongoose = require('mongoose');

// Use the exact same MongoDB URI that the server uses
require('dotenv').config({ path: './.env' });
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function checkCurrentPayments() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      writeConcern: {
        w: 'majority',
        j: true
      },
      readPreference: 'primaryPreferred',
      bufferCommands: false,
      compressors: ['zlib'],
      retryWrites: true,
      retryReads: true,
      ssl: true,
      tlsAllowInvalidCertificates: false
    });
    
    console.log('Connected to MongoDB Atlas successfully');
    
    const paymentsCollection = mongoose.connection.db.collection('payments');
    
    // Count all documents
    const totalCount = await paymentsCollection.countDocuments({});
    console.log(`Total documents in payments collection: ${totalCount}`);
    
    // Count documents with transactionId: null
    const nullCount = await paymentsCollection.countDocuments({ transactionId: null });
    console.log(`Documents with transactionId: null: ${nullCount}`);
    
    // Count documents without transactionId field
    const missingCount = await paymentsCollection.countDocuments({ transactionId: { $exists: false } });
    console.log(`Documents without transactionId field: ${missingCount}`);
    
    // Show all documents if any exist
    if (totalCount > 0) {
      console.log('\nAll documents in payments collection:');
      const allDocs = await paymentsCollection.find({}).toArray();
      console.log(JSON.stringify(allDocs, null, 2));
    }
    
    // Check indexes
    console.log('\nCurrent indexes on payments collection:');
    const indexes = await paymentsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

checkCurrentPayments(); 