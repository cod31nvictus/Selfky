const monitor = require('../utils/monitor');
const logger = require('../utils/logger');

// Request monitoring middleware
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  // Track request start
  logger.info(`${req.method} ${req.path} - Request started`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  });

  // Override response methods to track completion
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    trackResponse(req, res, responseTime);
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    trackResponse(req, res, responseTime);
    return originalJson.call(this, data);
  };

  res.end = function(data) {
    const responseTime = Date.now() - startTime;
    trackResponse(req, res, responseTime);
    return originalEnd.call(this, data);
  };

  // Track errors
  res.on('error', (error) => {
    const responseTime = Date.now() - startTime;
    monitor.trackError(error, {
      endpoint: req.path,
      method: req.method,
      responseTime
    });
  });

  next();
};

// Track response completion
function trackResponse(req, res, responseTime) {
  const statusCode = res.statusCode;
  const endpoint = req.path;
  const method = req.method;

  // Track in monitor
  monitor.trackRequest(endpoint, method, statusCode, responseTime);

  // Log response
  const logLevel = statusCode >= 400 ? 'error' : 'info';
  logger[logLevel](`${method} ${endpoint} - ${statusCode} (${responseTime}ms)`, {
    statusCode,
    responseTime,
    ip: req.ip
  });
}

// Error handling middleware
const errorMonitor = (error, req, res, next) => {
  const responseTime = Date.now() - (req.startTime || Date.now());
  
  // Track error in monitor
  monitor.trackError(error, {
    endpoint: req.path,
    method: req.method,
    responseTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Log detailed error
  logger.error('Unhandled error:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    responseTime
  });

  // Send error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
};

// Database operation monitoring
const databaseMonitor = (operation, startTime) => {
  const duration = Date.now() - startTime;
  monitor.trackDatabaseOperation(operation, duration);
  
  if (duration > 1000) {
    logger.warn(`Slow database operation: ${operation} took ${duration}ms`);
  }
};

// Redis operation monitoring
const redisMonitor = async (operation, redisFunction) => {
  const startTime = Date.now();
  try {
    const result = await redisFunction();
    const duration = Date.now() - startTime;
    monitor.trackRedisOperation(true);
    
    if (duration > 100) { // Redis operations should be fast
      logger.warn(`Slow Redis operation: ${operation} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.trackRedisOperation(false);
    logger.error(`Redis operation failed: ${operation}`, {
      error: error.message,
      duration
    });
    throw error;
  }
};

module.exports = {
  requestMonitor,
  errorMonitor,
  databaseMonitor,
  redisMonitor
}; 