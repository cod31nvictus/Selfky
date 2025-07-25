const express = require('express');
const router = express.Router();
const monitor = require('../utils/monitor');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken'); // Added for admin token verification
// Middleware to check if admin
const isAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken) {
    return res.status(401).json({ error: 'Admin token required' });
  }
  
  try {
    // Verify the admin token using JWT
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    
    // Check if the token has admin role
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    // Add admin info to request
    req.admin = {
      id: decoded.adminId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
};

// Apply admin authentication to all monitoring routes
router.use(isAdmin);

// Get application health status
router.get('/health', async (req, res) => {
  try {
    const healthStatus = monitor.getHealthStatus();
    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status'
    });
  }
});

// Get detailed metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const performanceData = {
      averageResponseTime: metrics.performance.averageResponseTime,
      slowQueries: metrics.performance.slowQueries,
      topEndpoints: Object.entries(metrics.requests.byEndpoint)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([endpoint, data]) => ({
          endpoint,
          count: data.count,
          avgResponseTime: data.avgResponseTime,
          errors: data.errors
        }))
    };

    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

// Get error metrics
router.get('/errors', async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const errorData = {
      totalErrors: metrics.errors.total,
      errorRate: metrics.requests.total > 0 ? 
        (metrics.errors.total / metrics.requests.total * 100).toFixed(2) : 0,
      errorsByType: metrics.errors.byType,
      recentErrors: metrics.errors.recent.slice(-20) // Last 20 errors
    };

    res.json({
      success: true,
      data: errorData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting error metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error metrics'
    });
  }
});

// Get system metrics
router.get('/system', async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const systemData = {
      memory: metrics.system.memory,
      uptime: metrics.system.uptime,
      database: {
        connections: metrics.database.connections,
        queries: metrics.database.queries,
        slowQueries: metrics.database.slowQueries
      },
      redis: {
        connected: metrics.redis.connected,
        operations: metrics.redis.operations,
        errors: metrics.redis.errors
      }
    };

    res.json({
      success: true,
      data: systemData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics'
    });
  }
});

// Force health report generation
router.post('/health-report', async (req, res) => {
  try {
    monitor.logHealthReport();
    res.json({
      success: true,
      message: 'Health report generated successfully'
    });
  } catch (error) {
    logger.error('Error generating health report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health report'
    });
  }
});

// Get active users count
router.get('/active-users', async (req, res) => {
  try {
    const activeUsers = await monitor.getActiveUsers();
    res.json({
      success: true,
      data: activeUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active users'
    });
  }
});

// Get real-time monitoring data (for dashboard)
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const healthStatus = monitor.getHealthStatus();
    const activeUsers = await monitor.getActiveUsers();
    
    const dashboardData = {
      health: healthStatus,
      summary: {
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.total > 0 ? 
          (metrics.requests.successful / metrics.requests.total * 100).toFixed(2) : 0,
        averageResponseTime: Math.round(metrics.performance.averageResponseTime),
        errorRate: metrics.requests.total > 0 ? 
          (metrics.errors.total / metrics.requests.total * 100).toFixed(2) : 0,
        uptime: Math.round((Date.now() - metrics.startTime) / 1000 / 60), // minutes
        activeUsers: activeUsers.count
      },
      system: {
        memory: metrics.system.memory,
        redis: metrics.redis.connected,
        database: metrics.database.connections > 0
      },
      users: activeUsers,
      alerts: []
    };

    // Generate alerts
    if (parseFloat(dashboardData.summary.errorRate) > 5) {
      dashboardData.alerts.push({
        type: 'error',
        message: `High error rate: ${dashboardData.summary.errorRate}%`
      });
    }

    if (metrics.system.memory.heapUsed > 500) {
      dashboardData.alerts.push({
        type: 'warning',
        message: `High memory usage: ${metrics.system.memory.heapUsed}MB`
      });
    }

    if (!metrics.redis.connected) {
      dashboardData.alerts.push({
        type: 'error',
        message: 'Redis connection lost'
      });
    }

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
});

module.exports = router; 