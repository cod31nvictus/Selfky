const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const logger = require('./logger');

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB with simplified options
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky', {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    
    console.log('Connected to MongoDB');
    console.log('Creating database indexes...');
    
    // Create indexes for User model with proper error handling
    try {
      await User.collection.createIndex({ email: 1 }, { background: true });
      console.log('✅ User email index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ User email index already exists');
      } else {
        console.log('⚠️ User email index error:', error.message);
      }
    }

    try {
      await User.collection.createIndex({ resetToken: 1 }, { background: true });
      console.log('✅ User resetToken index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ User resetToken index already exists');
      } else {
        console.log('⚠️ User resetToken index error:', error.message);
      }
    }

    try {
      await User.collection.createIndex({ resetTokenExpiry: 1 }, { background: true });
      console.log('✅ User resetTokenExpiry index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ User resetTokenExpiry index already exists');
      } else {
        console.log('⚠️ User resetTokenExpiry index error:', error.message);
      }
    }

    try {
      await User.collection.createIndex({ createdAt: -1 }, { background: true });
      console.log('✅ User createdAt index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ User createdAt index already exists');
      } else {
        console.log('⚠️ User createdAt index error:', error.message);
      }
    }
    
    // Create indexes for Application model
    try {
      await Application.collection.createIndex({ applicationNumber: 1 }, { background: true });
      console.log('✅ Application applicationNumber index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application applicationNumber index already exists');
      } else {
        console.log('⚠️ Application applicationNumber index error:', error.message);
      }
    }

    try {
      await Application.collection.createIndex({ userId: 1 }, { background: true });
      console.log('✅ Application userId index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application userId index already exists');
      } else {
        console.log('⚠️ Application userId index error:', error.message);
      }
    }

    try {
      await Application.collection.createIndex({ courseType: 1 }, { background: true });
      console.log('✅ Application courseType index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application courseType index already exists');
      } else {
        console.log('⚠️ Application courseType index error:', error.message);
      }
    }

    try {
      await Application.collection.createIndex({ status: 1 }, { background: true });
      console.log('✅ Application status index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application status index already exists');
      } else {
        console.log('⚠️ Application status index error:', error.message);
      }
    }

    try {
      await Application.collection.createIndex({ 'payment.status': 1 }, { background: true });
      console.log('✅ Application payment.status index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application payment.status index already exists');
      } else {
        console.log('⚠️ Application payment.status index error:', error.message);
      }
    }

    try {
      await Application.collection.createIndex({ createdAt: -1 }, { background: true });
      console.log('✅ Application createdAt index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application createdAt index already exists');
      } else {
        console.log('⚠️ Application createdAt index error:', error.message);
      }
    }
    
    // Create indexes for Payment model
    try {
      await Payment.collection.createIndex({ applicationId: 1 }, { background: true });
      console.log('✅ Payment applicationId index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Payment applicationId index already exists');
      } else {
        console.log('⚠️ Payment applicationId index error:', error.message);
      }
    }

    try {
      await Payment.collection.createIndex({ userId: 1 }, { background: true });
      console.log('✅ Payment userId index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Payment userId index already exists');
      } else {
        console.log('⚠️ Payment userId index error:', error.message);
      }
    }

    try {
      await Payment.collection.createIndex({ status: 1 }, { background: true });
      console.log('✅ Payment status index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Payment status index already exists');
      } else {
        console.log('⚠️ Payment status index error:', error.message);
      }
    }

    try {
      await Payment.collection.createIndex({ createdAt: -1 }, { background: true });
      console.log('✅ Payment createdAt index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Payment createdAt index already exists');
      } else {
        console.log('⚠️ Payment createdAt index error:', error.message);
      }
    }

    // Create compound indexes
    try {
      await Application.collection.createIndex({ userId: 1, status: 1 }, { background: true });
      console.log('✅ Application userId+status compound index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Application userId+status compound index already exists');
      } else {
        console.log('⚠️ Application userId+status compound index error:', error.message);
      }
    }

    try {
      await Payment.collection.createIndex({ applicationId: 1, status: 1 }, { background: true });
      console.log('✅ Payment applicationId+status compound index created/verified');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Payment applicationId+status compound index already exists');
      } else {
        console.log('⚠️ Payment applicationId+status compound index error:', error.message);
      }
    }
    
    console.log('✅ All database indexes created/verified successfully!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the function
createIndexes().catch(console.error); 