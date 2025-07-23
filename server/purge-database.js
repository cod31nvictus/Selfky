// Do not commit real credentials. Use .env files and .gitignore.
require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

console.log('🧹 Database Purge Script');
console.log('⚠️  WARNING: This will DELETE ALL DATA from the database');
console.log('');

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to purge the database? Type "YES" to confirm: ', async (answer) => {
  if (answer !== 'YES') {
    console.log('❌ Database purge cancelled');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);

    // Purge each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🗑️  Purging collection: ${collectionName}`);
      
      const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
      console.log(`   ✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
    }

    console.log('');
    console.log('🎉 Database purge completed successfully!');
    console.log('📝 All collections have been emptied');

  } catch (error) {
    console.error('❌ Error during database purge:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    rl.close();
    process.exit(0);
  }
}); 