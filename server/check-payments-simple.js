const mongoose = require('mongoose');

// Use the exact same MongoDB URI that the server uses
require('dotenv').config({ path: './.env' });
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function checkPayments() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('Using URI:', MONGODB_URI);
    
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
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if payments collection exists
    const paymentsCollection = mongoose.connection.db.collection('payments');
    
    // Count documents with transactionId: null
    const nullCount = await paymentsCollection.countDocuments({ transactionId: null });
    console.log(`Documents with transactionId: null: ${nullCount}`);
    
    // Show sample documents with null transactionId
    if (nullCount > 0) {
      console.log('\nSample documents with transactionId: null:');
      const sampleDocs = await paymentsCollection.find({ transactionId: null }).limit(3).toArray();
      console.log(JSON.stringify(sampleDocs, null, 2));
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

checkPayments(); 