const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

function getRedisConfig() {
  return {
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    }
    // No password, no TLS
  };
}

async function createRedisClient() {
  try {
    const config = getRedisConfig();
    logger.info('Creating Redis client with config:', JSON.stringify(config.socket));
    redisClient = redis.createClient(config);

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
    await redisClient.ping();
    logger.info('Redis ping successful');

    logger.info('Redis client initialized successfully');
    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = {
  createRedisClient,
  getRedisClient
}; 