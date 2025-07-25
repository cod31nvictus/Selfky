require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const S3Service = require('./utils/s3Service');
const optimizeDatabase = require('./utils/databaseOptimizer');
const { connectToDatabase } = require('./config/database');
const { createRedisClient } = require('./config/redis');
const monitor = require('./utils/monitor');
const logger = require('./utils/logger');
const { requestMonitor, errorMonitor } = require('./middleware/monitoring');
const AWS = require('aws-sdk'); // Added for direct S3 serving

const app = express();

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.razorpay.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to specific routes
app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://selfky.com', 'https://www.selfky.com', 'http://selfky.com', 'http://www.selfky.com'] 
    : ['http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}));

// Apply monitoring middleware
app.use(requestMonitor);

// S3 file serving endpoint - primary file serving method
app.get('/api/files/:key(*)', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('Requested key:', key);

    const possibleKeys = [
      key, // as-is
      `photos/${key}`,
      `signatures/${key}`,
      `certificates/${key}`
    ];

    const s3 = new AWS.S3();
    let s3Object = null;
    let foundKey = null;

    for (const testKey of possibleKeys) {
      try {
        console.log('Trying S3 key:', testKey);
        const params = {
          Bucket: process.env.S3_BUCKET_NAME || 'selfky-applications-2025',
          Key: testKey
        };
        s3Object = await s3.getObject(params).promise();
        foundKey = testKey;
        console.log('S3 file found for key:', foundKey);
        break;
      } catch (error) {
        console.log('S3 error for key', testKey, ':', error.code);
        if (error.code === 'NoSuchKey') {
          continue;
        } else {
          throw error;
        }
      }
    }

    if (!s3Object) {
      console.log('File not found for any key');
      return res.status(404).json({ error: 'File not found' });
    }

    // Set proper content type based on file extension
    let contentType = s3Object.ContentType;
    if (!contentType) {
      const ext = foundKey.split('.').pop().toLowerCase();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
        default:
          contentType = 'application/octet-stream';
      }
    }

    res.set({
      'Content-Type': contentType,
      'Content-Length': s3Object.ContentLength,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*'
    });
    res.send(s3Object.Body);
  } catch (error) {
    console.error('Error serving S3 file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Enhanced health check route with database status
app.get('/api/health', async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    
    // Get Redis status
    let redisStatus = 'disconnected';
    try {
      const { getRedisClient } = require('./config/redis');
      const redisClient = getRedisClient();
      if (redisClient && redisClient.isReady) {
        redisStatus = 'connected';
      }
    } catch (error) {
      // Redis not available or not connected
      redisStatus = 'disconnected';
    }
    
    res.json({
      connectionStats: stats,
      timestamp: new Date().toISOString(),
      databaseType: process.env.USE_MONGODB_ATLAS === 'true' ? 'MongoDB Atlas' : 'Local MongoDB',
      redis: redisStatus,
      fileStorage: 'AWS S3'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// Backup management routes (admin only)
app.post('/api/admin/backup', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const BackupManager = require('./utils/backup');
    const backupManager = new BackupManager();
    
    const manifest = await backupManager.createCompleteBackup();
    
    res.json({
      success: true,
      message: 'Backup completed successfully',
      manifest: manifest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Backup failed',
      message: error.message
    });
  }
});

app.get('/api/admin/backups', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const BackupManager = require('./utils/backup');
    const backupManager = new BackupManager();
    
    const backups = backupManager.listBackups();
    
    res.json({
      success: true,
      backups: backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list backups',
      message: error.message
    });
  }
});

// Database performance monitoring endpoint
app.get('/api/db/stats', async (req, res) => {
  try {
    optimizeDatabase();
    const stats = optimizeDatabase.getConnectionStats();
    
    res.json({
      connectionStats: stats,
      timestamp: new Date().toISOString(),
      databaseType: process.env.USE_MONGODB_ATLAS === 'true' ? 'MongoDB Atlas' : 'Local MongoDB'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// MongoDB connection
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const monitoringRoutes = require('./routes/monitoring');

// Import scheduled tasks
require('./scheduledTasks');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Serve static files from React build in production (AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

async function startServer() {
  try {
    console.log('Starting server initialization...');
    
    // Connect to database (Atlas or local)
    console.log('Connecting to database...');
    await connectToDatabase();
    
    // Initialize database optimizer for monitoring (don't reconnect)
    console.log('Initializing database optimizer...');
    await optimizeDatabase();
    
    console.log('MongoDB connected with optimizations');

    // Initialize Redis (required)
    await createRedisClient(); // If this fails, let the error crash the process
    console.log('Redis client initialized successfully');

    console.log(`Starting HTTP server on port ${PORT}...`);
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
  }
};

startServer();

// Start scheduled tasks in production
if (process.env.NODE_ENV === 'production') {
  const { startScheduledTasks } = require('./scheduledTasks');
  startScheduledTasks();
  console.log('Scheduled tasks started');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  // await closeRedisClient(); // This line is removed as per the edit hint
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  // await closeRedisClient(); // This line is removed as per the edit hint
  process.exit(0);
});

// Error handling middleware with monitoring
app.use(errorMonitor); 