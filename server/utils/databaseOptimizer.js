const mongoose = require('mongoose');
const logger = require('./logger');

class DatabaseOptimizer {
  constructor() {
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0
    };
  }

  // Optimize MongoDB connection with advanced settings
  async optimizeConnection() {
    try {
      const options = {
        // Connection pooling
        maxPoolSize: 20, // Increased from 10
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        
        // Timeout settings
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        
        // Write concern for better performance
        writeConcern: {
          w: 1,
          j: false
        },
        
        // Read preference
        readPreference: 'primaryPreferred',
        
        // Buffer settings
        bufferMaxEntries: 0,
        bufferCommands: false,
        
        // Compression
        compressors: ['zlib'],
        
        // Retry settings
        retryWrites: true,
        retryReads: true
      };

      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selfky', options);
      
      logger.info('Database connection optimized successfully');
      
      // Monitor connection pool
      this.startConnectionMonitoring();
      
      return true;
    } catch (error) {
      logger.error('Database optimization failed:', error);
      throw error;
    }
  }

  // Monitor connection pool health
  startConnectionMonitoring() {
    setInterval(() => {
      const poolStatus = mongoose.connection.db.admin().command({ serverStatus: 1 });
      
      if (poolStatus) {
        this.connectionStats = {
          totalConnections: poolStatus.connections?.current || 0,
          activeConnections: poolStatus.connections?.active || 0,
          idleConnections: poolStatus.connections?.available || 0
        };
        
        logger.info('Database connection stats:', this.connectionStats);
      }
    }, 60000); // Check every minute
  }

  // Get connection statistics
  getConnectionStats() {
    return this.connectionStats;
  }

  // Optimize queries with lean() for better performance
  static optimizeQuery(query) {
    return query.lean().exec();
  }

  // Add pagination to queries
  static addPagination(query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }

  // Add sorting to queries
  static addSorting(query, sortBy = 'createdAt', sortOrder = 'desc') {
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    return query.sort(sort);
  }

  // Create compound queries for better performance
  static createCompoundQuery(filters = {}) {
    const query = {};
    
    // Add filters with proper indexing
    if (filters.status) query.status = filters.status;
    if (filters.courseType) query.courseType = filters.courseType;
    if (filters.userId) query.userId = filters.userId;
    if (filters.category) query['personalDetails.category'] = filters.category;
    
    // Date range filtering
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return query;
  }

  // Cache frequently accessed data
  static async cacheQuery(key, queryFn, ttl = 300000) { // 5 minutes default
    const cache = new Map();
    
    if (cache.has(key)) {
      const cached = cache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }
    
    const data = await queryFn();
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  // Optimize aggregation pipelines
  static optimizeAggregation(pipeline) {
    // Add $match stage early to reduce documents
    const optimizedPipeline = [];
    
    // Move $match stages to the beginning
    const matchStages = pipeline.filter(stage => stage.$match);
    const otherStages = pipeline.filter(stage => !stage.$match);
    
    optimizedPipeline.push(...matchStages, ...otherStages);
    
    // Add $limit stage if not present
    if (!pipeline.some(stage => stage.$limit)) {
      optimizedPipeline.push({ $limit: 1000 }); // Default limit
    }
    
    return optimizedPipeline;
  }

  // Health check for database
  async healthCheck() {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        connectionStats: this.getConnectionStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = DatabaseOptimizer; 