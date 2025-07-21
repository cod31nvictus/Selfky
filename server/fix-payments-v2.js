const mongoose = require('mongoose');

// Use the exact same MongoDB URI that the server uses
const MONGODB_URI = 'mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.e5jmlu.mongodb.net/selfky?retryWrites=true&w=majority&appName=selfky-cluster';

async function fixPaymentsV2() {
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
    
    // Find documents that don't have transactionId field at all
    const docsWithoutTransactionId = await paymentsCollection.find({
      transactionId: { $exists: false }
    }).toArray();
    
    console.log(`Documents without transactionId field: ${docsWithoutTransactionId.length}`);
    
    if (docsWithoutTransactionId.length > 0) {
      console.log('\nSample documents without transactionId:');
      console.log(JSON.stringify(docsWithoutTransactionId.slice(0, 2), null, 2));
      
      console.log('\nAdding unique transactionId to documents...');
      
      // Add a unique transactionId to each document that doesn't have one
      for (const doc of docsWithoutTransactionId) {
        const uniqueTransactionId = `manual_${doc._id}_${Date.now()}`;
        
        await paymentsCollection.updateOne(
          { _id: doc._id },
          { $set: { transactionId: uniqueTransactionId } }
        );
        
        console.log(`Added transactionId: ${uniqueTransactionId} to document: ${doc._id}`);
      }
      
      console.log(`✅ Updated ${docsWithoutTransactionId.length} documents with unique transactionId`);
    } else {
      console.log('✅ No documents found without transactionId field');
    }
    
    // Check for documents with null transactionId
    const nullCount = await paymentsCollection.countDocuments({ transactionId: null });
    console.log(`\nDocuments with transactionId: null: ${nullCount}`);
    
    if (nullCount > 0) {
      console.log('Fixing documents with null transactionId...');
      
      const nullDocs = await paymentsCollection.find({ transactionId: null }).toArray();
      
      for (const doc of nullDocs) {
        const uniqueTransactionId = `manual_${doc._id}_${Date.now()}`;
        
        await paymentsCollection.updateOne(
          { _id: doc._id },
          { $set: { transactionId: uniqueTransactionId } }
        );
        
        console.log(`Updated null transactionId to: ${uniqueTransactionId} for document: ${doc._id}`);
      }
      
      console.log(`✅ Updated ${nullDocs.length} documents with null transactionId`);
    }
    
    // Final verification
    const finalNullCount = await paymentsCollection.countDocuments({ transactionId: null });
    const finalMissingCount = await paymentsCollection.countDocuments({ transactionId: { $exists: false } });
    
    console.log(`\nFinal check:`);
    console.log(`- Documents with transactionId: null: ${finalNullCount}`);
    console.log(`- Documents without transactionId field: ${finalMissingCount}`);
    
    if (finalNullCount === 0 && finalMissingCount === 0) {
      console.log('✅ All documents now have valid transactionId values');
    } else {
      console.log('⚠️ Some documents still have issues');
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

fixPaymentsV2(); 