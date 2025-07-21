const mongoose = require('mongoose');

// Use the exact same MongoDB URI that the server uses
const MONGODB_URI = 'mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.e5jmlu.mongodb.net/selfky?retryWrites=true&w=majority&appName=selfky-cluster';

async function purgeDatabase() {
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
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Purge each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\nPurging collection: ${collectionName}`);
      
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
    }
    
    // Drop all indexes except _id
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\nDropping indexes for collection: ${collectionName}`);
      
      const indexes = await db.collection(collectionName).indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await db.collection(collectionName).dropIndex(index.name);
            console.log(`Dropped index: ${index.name}`);
          } catch (error) {
            console.log(`Could not drop index ${index.name}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Database purge completed successfully!');
    console.log('All collections have been emptied and indexes dropped.');
    console.log('The database is now clean and ready for fresh data.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

// Add confirmation prompt
console.log('⚠️  WARNING: This will delete ALL data from the database!');
console.log('This action cannot be undone.');
console.log('Are you sure you want to proceed? (y/N)');

// For safety, we'll require manual confirmation
process.stdin.once('data', (data) => {
  const input = data.toString().trim().toLowerCase();
  
  if (input === 'y' || input === 'yes') {
    console.log('Proceeding with database purge...');
    purgeDatabase();
  } else {
    console.log('Database purge cancelled.');
    process.exit(0);
  }
}); 