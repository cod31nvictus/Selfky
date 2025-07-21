const mongoose = require('mongoose');

// Use the exact same MongoDB URI that the server uses
const MONGODB_URI = 'mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.e5jmlu.mongodb.net/selfky?retryWrites=true&w=majority&appName=selfky-cluster';

async function fixPayments() {
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
    
    // Count documents with transactionId: null
    const nullCount = await paymentsCollection.countDocuments({ transactionId: null });
    console.log(`Documents with transactionId: null: ${nullCount}`);
    
    if (nullCount > 0) {
      console.log('\nFixing documents with null transactionId...');
      
      // Remove the transactionId field from documents where it's null
      const result = await paymentsCollection.updateMany(
        { transactionId: null },
        { $unset: { transactionId: "" } }
      );
      
      console.log(`Updated ${result.modifiedCount} documents`);
      
      // Verify the fix
      const remainingNullCount = await paymentsCollection.countDocuments({ transactionId: null });
      console.log(`Remaining documents with transactionId: null: ${remainingNullCount}`);
      
      if (remainingNullCount === 0) {
        console.log('✅ Successfully fixed all documents with null transactionId');
      } else {
        console.log('⚠️ Some documents still have null transactionId');
      }
    } else {
      console.log('✅ No documents with null transactionId found');
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

fixPayments(); 