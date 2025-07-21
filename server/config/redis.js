const redis = require('redis');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  // Production (ElastiCache)
  production: {
    socket: {
      host: process.env.REDIS_HOST || 'clustercfg.selfky-redis-cache.ncv2gn.eun1.cache.amazonaws.com',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      connectTimeout: 10000,
      commandTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis max retry attempts reached');
          return false;
        }
        return Math.min(retries * 100, 3000);
      }
    },
    password: process.env.REDIS_PASSWORD || null,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  // Development (Local Redis)
  development: {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      connectTimeout: 10000,
      commandTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return false;
        }
        return Math.min(retries * 100, 3000);
      }
    },
    password: process.env.REDIS_PASSWORD || null,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  }
};

// Get Redis configuration based on environment
function getRedisConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = redisConfig[env] || redisConfig.development;
  
  // Log the configuration being used
  logger.info(`Redis config for ${env}: ${config.socket.host}:${config.socket.port}`);
  
  return config;
}

// Create Redis client
let redisClient = null;

async function createRedisClient() {
  try {
    const config = getRedisConfig();
    logger.info('Creating Redis client with config:', JSON.stringify(config.socket));
    
    // Create Redis client
    redisClient = redis.createClient(config);
    
    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });
    
    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
    
    // Connect to Redis with timeout
    logger.info('Attempting to connect to Redis...');
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    logger.info('Redis connect() completed successfully');
    
    // Test the connection
    logger.info('Testing Redis connection...');
    try {
      await redisClient.ping();
      logger.info('Redis ping successful');
    } catch (pingError) {
      logger.error('Redis ping failed:', pingError);
      throw pingError;
    }
    
    logger.info('Redis client initialized successfully');
    return redisClient;
    
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

// Get Redis client instance
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
}

// Close Redis connection
async function closeRedisClient() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client connection closed');
    } catch (error) {
      logger.error('Error closing Redis client:', error);
    }
  }
}

// Redis utility functions
const redisUtils = {
  // Set key with TTL
  async set(key, value, ttl = 3600) {
    const client = getRedisClient();
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },
  
  // Get key
  async get(key) {
    const client = getRedisClient();
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },
  
  // Delete key
  async del(key) {
    const client = getRedisClient();
    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },
  
  // Check if key exists
  async exists(key) {
    const client = getRedisClient();
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },
  
  // Set key with expiration
  async setEx(key, ttl, value) {
    const client = getRedisClient();
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SETEX error:', error);
      return false;
    }
  },
  
  // Increment counter
  async incr(key) {
    const client = getRedisClient();
    try {
      return await client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return null;
    }
  },
  
  // Get Redis info
  async getInfo() {
    const client = getRedisClient();
    try {
      return await client.info();
    } catch (error) {
      logger.error('Redis INFO error:', error);
      return null;
    }
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisClient,
  redisUtils
}; 