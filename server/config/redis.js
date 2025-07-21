const Redis = require('ioredis');
const logger = require('../utils/logger');
const dns = require('dns');

let redisClient = null;

function getRedisConfig() {
  // For cluster mode, we provide an array of startup nodes
  return [
    {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10)
    }
  ];
}

async function createRedisClient() {
  if (redisClient) {
    logger.info('Redis client already initialized');
    return redisClient;
  }
  const startupNodes = getRedisConfig();
  logger.info('Creating Redis Cluster client with nodes: ' + JSON.stringify(startupNodes));
  redisClient = new Redis.Cluster(startupNodes, {
    dnsLookup: (address, callback) => dns.lookup(address, { family: 4 }, callback),
    redisOptions: {
      tls: { servername: process.env.REDIS_HOST }, // Set SNI for AWS ElastiCache
      family: 4, // Force IPv4
    },
    scaleReads: 'slave',
    slotsRefreshTimeout: 20000,
    slotsRefreshInterval: 10000
  });

  redisClient.on('connect', () => {
    logger.info('Redis Cluster client connected');
  });
  redisClient.on('ready', () => {
    logger.info('Redis Cluster client ready');
  });
  redisClient.on('error', (err) => {
    logger.error('Redis Cluster error: ' + err);
  });
  redisClient.on('close', () => {
    logger.warn('Redis Cluster connection closed');
  });

  // Wait for cluster to be ready
  await new Promise((resolve, reject) => {
    redisClient.once('ready', resolve);
    redisClient.once('error', reject);
    setTimeout(() => reject(new Error('Redis Cluster connection timeout after 15 seconds')), 15000);
  });
  logger.info('Redis Cluster client initialized successfully');
  return redisClient;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

module.exports = {
  createRedisClient,
  getRedisClient
}; 