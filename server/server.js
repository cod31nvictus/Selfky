require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const S3Service = require('./utils/s3Service');
const DatabaseOptimizer = require('./utils/databaseOptimizer');
const { connectToDatabase } = require('./config/database');
const { createRedisClient, closeRedisClient } = require('./config/redis');

const app = express();

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

// S3 file serving endpoint
app.get('/api/files/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await S3Service.getSignedUrl(key);
    
    if (result.success) {
      res.json({ url: result.url });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Enhanced health check route with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbOptimizer = new DatabaseOptimizer();
    const dbHealth = await dbOptimizer.healthCheck();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      worker: process.pid,
      uptime: process.uptime(),
      database: dbHealth,
      memory: process.memoryUsage(),
      databaseType: process.env.USE_MONGODB_ATLAS === 'true' ? 'MongoDB Atlas' : 'Local MongoDB'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database performance monitoring endpoint
app.get('/api/db/stats', async (req, res) => {
  try {
    const dbOptimizer = new DatabaseOptimizer();
    const stats = dbOptimizer.getConnectionStats();
    
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

// Import scheduled tasks
require('./scheduledTasks');

// Start server with optimized database connection
const startServer = async () => {
  try {
    // Connect to database (Atlas or local)
    await connectToDatabase();
    
    // Use optimized database connection for additional features
    const dbOptimizer = new DatabaseOptimizer();
    await dbOptimizer.optimizeConnection();
    
    console.log('MongoDB connected with optimizations');

    // Initialize Redis client
    await createRedisClient();
    console.log('Redis client initialized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Start scheduled tasks in production
if (process.env.NODE_ENV === 'production') {
  const { startScheduledTasks } = require('./scheduledTasks');
  startScheduledTasks();
  console.log('Scheduled tasks started');
}

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeRedisClient();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeRedisClient();
  process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
}); 