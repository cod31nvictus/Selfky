const logger = require('./logger');
const { getRedisClient } = require('../config/redis');

class ApplicationMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      performance: {
        responseTimes: [],
        averageResponseTime: 0,
        slowQueries: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      system: {
        memory: {},
        cpu: {},
        uptime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        slowQueries: 0
      },
      redis: {
        connected: false,
        operations: 0,
        errors: 0
      },
      users: {
        active: 0,
        total: 0,
        sessions: {}
      }
    };
    
    this.startTime = Date.now();
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Start periodic monitoring
    setInterval(() => this.collectSystemMetrics(), 30000); // Every 30 seconds
    setInterval(() => this.cleanupOldData(), 300000); // Every 5 minutes
    setInterval(() => this.logHealthReport(), 600000); // Every 10 minutes
    setInterval(() => this.cleanupInactiveUsers(), 60000); // Every 1 minute - cleanup inactive users
    
    logger.info('Application monitoring initialized');
  }

  // Request monitoring
  trackRequest(endpoint, method, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track by endpoint
    const key = `${method} ${endpoint}`;
    if (!this.metrics.requests.byEndpoint[key]) {
      this.metrics.requests.byEndpoint[key] = {
        count: 0,
        avgResponseTime: 0,
        errors: 0
      };
    }
    
    this.metrics.requests.byEndpoint[key].count++;
    this.metrics.requests.byEndpoint[key].avgResponseTime = 
      (this.metrics.requests.byEndpoint[key].avgResponseTime * (this.metrics.requests.byEndpoint[key].count - 1) + responseTime) / 
      this.metrics.requests.byEndpoint[key].count;

    if (statusCode >= 400) {
      this.metrics.requests.byEndpoint[key].errors++;
    }

    // Track response times
    this.metrics.performance.responseTimes.push(responseTime);
    if (this.metrics.performance.responseTimes.length > 100) {
      this.metrics.performance.responseTimes.shift();
    }

    // Track slow queries (> 1 second)
    if (responseTime > 1000) {
      this.metrics.performance.slowQueries.push({
        endpoint,
        method,
        responseTime,
        timestamp: Date.now()
      });
    }

    // Update average response time
    this.metrics.performance.averageResponseTime = 
      this.metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.performance.responseTimes.length;
  }

  // Error tracking
  trackError(error, context = {}) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'Unknown';
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;

    // Store recent errors (last 50)
    this.metrics.errors.recent.push({
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });

    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent.shift();
    }

    logger.error(`Error tracked: ${errorType} - ${error.message}`, { context });
  }

  // Database monitoring
  trackDatabaseOperation(operation, duration) {
    this.metrics.database.queries++;
    
    if (duration > 1000) { // Slow query threshold
      this.metrics.database.slowQueries++;
      logger.warn(`Slow database operation: ${operation} took ${duration}ms`);
    }
  }

  updateDatabaseConnections(count) {
    this.metrics.database.connections = count;
  }

  // Redis monitoring
  updateRedisStatus(connected) {
    this.metrics.redis.connected = connected;
  }

  trackRedisOperation(success = true) {
    this.metrics.redis.operations++;
    if (!success) {
      this.metrics.redis.errors++;
    }
  }

  // User session tracking
  async trackUserLogin(userId, userEmail) {
    try {
      const redisClient = getRedisClient();
      const sessionKey = `user_session:${userId}`;
      const sessionData = {
        userId,
        email: userEmail,
        loginTime: Date.now(),
        lastActivity: Date.now()
      };
      
      // Set session with 30 minute expiry
      await redisClient.setex(sessionKey, 1800, JSON.stringify(sessionData));
      
      // Update active users count
      await this.updateActiveUserCount();
      
      logger.info(`User ${userEmail} logged in. Active users: ${this.metrics.users.active}`);
    } catch (error) {
      logger.error('Error tracking user login:', error);
    }
  }

  async trackUserLogout(userId) {
    try {
      const redisClient = getRedisClient();
      const sessionKey = `user_session:${userId}`;
      
      // Remove session
      await redisClient.del(sessionKey);
      
      // Update active users count
      await this.updateActiveUserCount();
      
      logger.info(`User ${userId} logged out. Active users: ${this.metrics.users.active}`);
    } catch (error) {
      logger.error('Error tracking user logout:', error);
    }
  }

  async updateUserActivity(userId) {
    try {
      const redisClient = getRedisClient();
      const sessionKey = `user_session:${userId}`;
      
      // Get current session data
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = Date.now();
        
        // Update session with new activity time
        await redisClient.setex(sessionKey, 1800, JSON.stringify(session));
      }
    } catch (error) {
      logger.error('Error updating user activity:', error);
    }
  }

  async updateActiveUserCount() {
    try {
      const redisClient = getRedisClient();
      const pattern = 'user_session:*';
      const keys = await redisClient.keys(pattern);
      
      this.metrics.users.active = keys.length;
      
      // Get session details for monitoring
      const sessions = {};
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          sessions[session.userId] = {
            email: session.email,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity
          };
        }
      }
      
      this.metrics.users.sessions = sessions;
    } catch (error) {
      logger.error('Error updating active user count:', error);
      this.metrics.users.active = 0;
    }
  }

  async cleanupInactiveUsers() {
    try {
      const redisClient = getRedisClient();
      const pattern = 'user_session:*';
      const keys = await redisClient.keys(pattern);
      
      const now = Date.now();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
      
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (now - session.lastActivity > inactiveThreshold) {
            await redisClient.del(key);
            logger.info(`Removed inactive session for user ${session.email}`);
          }
        }
      }
      
      // Update count after cleanup
      await this.updateActiveUserCount();
    } catch (error) {
      logger.error('Error cleaning up inactive users:', error);
    }
  }

  async getActiveUsers() {
    try {
      await this.updateActiveUserCount();
      return {
        count: this.metrics.users.active,
        sessions: this.metrics.users.sessions
      };
    } catch (error) {
      logger.error('Error getting active users:', error);
      return { count: 0, sessions: {} };
    }
  }

  // System metrics collection
  async collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      this.metrics.system.memory = {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      };

      this.metrics.system.uptime = Math.round((Date.now() - this.startTime) / 1000); // seconds

      // Check MongoDB connection
      try {
        const mongoose = require('mongoose');
        const dbState = mongoose.connection.readyState;
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const isConnected = dbState === 1;
        this.updateDatabaseConnections(isConnected ? 1 : 0);
        
        if (!isConnected) {
          logger.warn(`Database connection state: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
        }
      } catch (error) {
        this.updateDatabaseConnections(0);
        logger.error('Database connection check failed:', error.message);
      }

      // Check Redis connection
      try {
        const redisClient = getRedisClient();
        await redisClient.ping();
        this.updateRedisStatus(true);
      } catch (error) {
        this.updateRedisStatus(false);
        logger.error('Redis connection check failed:', error.message);
      }

    } catch (error) {
      logger.error('Error collecting system metrics:', error.message);
    }
  }

  // Data cleanup
  cleanupOldData() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Clean up old slow queries
    this.metrics.performance.slowQueries = 
      this.metrics.performance.slowQueries.filter(query => 
        query.timestamp > fiveMinutesAgo
      );

    // Clean up old errors
    this.metrics.errors.recent = 
      this.metrics.errors.recent.filter(error => 
        error.timestamp > fiveMinutesAgo
      );

    logger.debug('Cleaned up old monitoring data');
  }

  // Health report
  logHealthReport() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.errors.total / this.metrics.requests.total * 100).toFixed(2) : 0;
    
    const report = {
      uptime: `${uptime} minutes`,
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 ? 
          (this.metrics.requests.successful / this.metrics.requests.total * 100).toFixed(2) + '%' : '0%'
      },
      performance: {
        averageResponseTime: Math.round(this.metrics.performance.averageResponseTime) + 'ms',
        slowQueries: this.metrics.performance.slowQueries.length
      },
      errors: {
        total: this.metrics.errors.total,
        errorRate: errorRate + '%',
        recentErrors: this.metrics.errors.recent.length
      },
      system: {
        memory: this.metrics.system.memory,
        uptime: this.metrics.system.uptime
      },
      database: {
        connections: this.metrics.database.connections,
        queries: this.metrics.database.queries,
        slowQueries: this.metrics.database.slowQueries
      },
      redis: {
        connected: this.metrics.redis.connected,
        operations: this.metrics.redis.operations,
        errors: this.metrics.redis.errors
      },
      users: {
        active: this.metrics.users.active,
        total: this.metrics.users.total,
        sessions: this.metrics.users.sessions
      }
    };

    logger.info('Application Health Report:', report);

    // Alert if error rate is high
    if (parseFloat(errorRate) > 5) {
      logger.warn(`High error rate detected: ${errorRate}%`);
    }

    // Alert if memory usage is high
    if (this.metrics.system.memory.heapUsed > 500) { // 500MB
      logger.warn(`High memory usage: ${this.metrics.system.memory.heapUsed}MB`);
    }

    // Alert if Redis is disconnected
    if (!this.metrics.redis.connected) {
      logger.warn('Redis connection lost');
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString()
    };
  }

  // Get health status
  getHealthStatus() {
    const errorRate = this.metrics.requests.total > 0 ? 
      this.metrics.errors.total / this.metrics.requests.total : 0;
    
    const isHealthy = 
      errorRate < 0.05 && // Less than 5% error rate
      this.metrics.redis.connected &&
      this.metrics.database.connections > 0 && // Database must be connected
      this.metrics.system.memory.heapUsed < 1000; // Less than 1GB memory

    return {
      healthy: isHealthy,
      errorRate: (errorRate * 100).toFixed(2) + '%',
      redisConnected: this.metrics.redis.connected,
      databaseConnected: this.metrics.database.connections > 0,
      memoryUsage: this.metrics.system.memory.heapUsed + 'MB'
    };
  }
}

// Create singleton instance
const monitor = new ApplicationMonitor();

module.exports = monitor; 