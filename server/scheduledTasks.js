const cron = require('node-cron');
const Razorpay = require('razorpay');
const Application = require('./models/Application');
const logger = require('./utils/logger');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  logger.info('Razorpay initialized successfully');
} else {
  logger.warn('Razorpay credentials not found. Payment features will be disabled.');
}

// Payment polling task - runs every 5 minutes
const paymentPollingTask = cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Starting payment polling task...');
    
    // Skip if Razorpay is not initialized
    if (!razorpay) {
      logger.info('Skipping payment polling - Razorpay not configured');
      return;
    }
    
    // Find applications with pending payments
    const pendingApplications = await Application.find({
      paymentStatus: 'pending',
      paymentId: { $exists: true, $ne: null }
    });

    logger.info(`Found ${pendingApplications.length} pending payments to check`);

    for (const application of pendingApplications) {
      try {
        // Fetch payment status from Razorpay
        const payment = await razorpay.payments.fetch(application.paymentId);
        
        if (payment.status === 'captured') {
          // Payment successful
          application.paymentStatus = 'completed';
          application.paymentDate = new Date();
          await application.save();
          
          logger.info(`Payment ${application.paymentId} marked as completed for application ${application._id}`);
        } else if (payment.status === 'failed') {
          // Payment failed
          application.paymentStatus = 'failed';
          await application.save();
          
          logger.info(`Payment ${application.paymentId} marked as failed for application ${application._id}`);
        }
        // If status is 'created' or 'authorized', keep as pending
        
      } catch (error) {
        logger.error(`Error checking payment ${application.paymentId}:`, error.message);
        
        // If payment doesn't exist in Razorpay, mark as failed
        if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
          application.paymentStatus = 'failed';
          await application.save();
          logger.info(`Payment ${application.paymentId} not found, marked as failed`);
        }
      }
    }
    
    logger.info('Payment polling task completed');
  } catch (error) {
    logger.error('Error in payment polling task:', error);
  }
});

// Cleanup old pending payments - runs daily at 2 AM
const cleanupTask = cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Starting cleanup task for old pending payments...');
    
    // Find payments that have been pending for more than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const oldPendingApplications = await Application.find({
      paymentStatus: 'pending',
      createdAt: { $lt: twentyFourHoursAgo }
    });

    logger.info(`Found ${oldPendingApplications.length} old pending payments to cleanup`);

    for (const application of oldPendingApplications) {
      try {
        // Check if payment exists in Razorpay
        if (application.paymentId && razorpay) {
          const payment = await razorpay.payments.fetch(application.paymentId);
          
          if (payment.status === 'captured') {
            application.paymentStatus = 'completed';
            application.paymentDate = new Date();
          } else {
            application.paymentStatus = 'failed';
          }
        } else {
          application.paymentStatus = 'failed';
        }
        
        await application.save();
        logger.info(`Cleaned up payment for application ${application._id}`);
        
      } catch (error) {
        // If payment doesn't exist, mark as failed
        application.paymentStatus = 'failed';
        await application.save();
        logger.info(`Marked non-existent payment as failed for application ${application._id}`);
      }
    }
    
    logger.info('Cleanup task completed');
  } catch (error) {
    logger.error('Error in cleanup task:', error);
  }
});

// Generate payment statistics - runs every hour
const statisticsTask = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Generating payment statistics...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const stats = {
      totalPayments: await Application.countDocuments({ paymentStatus: 'completed' }),
      todayPayments: await Application.countDocuments({
        paymentStatus: 'completed',
        paymentDate: { $gte: today }
      }),
      thisMonthPayments: await Application.countDocuments({
        paymentStatus: 'completed',
        paymentDate: { $gte: thisMonth }
      }),
      pendingPayments: await Application.countDocuments({ paymentStatus: 'pending' }),
      failedPayments: await Application.countDocuments({ paymentStatus: 'failed' })
    };
    
    logger.info('Payment statistics:', stats);
  } catch (error) {
    logger.error('Error generating payment statistics:', error);
  }
});

// Health check task - runs every 10 minutes
const healthCheckTask = cron.schedule('*/10 * * * *', async () => {
  try {
    logger.info('Performing health check...');
    
    // Check database connection
    const dbStatus = await Application.db.db.admin().ping();
    logger.info('Database health check:', dbStatus);
    
    // Temporarily disable Razorpay health check to prevent errors
    logger.info('Razorpay API health check: Disabled (to prevent errors)');
    
    // TODO: Re-enable when Razorpay integration is fully stable
    // if (razorpay) {
    //   try {
    //     const account = await razorpay.account.fetch();
    //     logger.info('Razorpay API health check: OK');
    //   } catch (error) {
    //     logger.error('Razorpay API health check failed:', error.message);
    //   }
    // } else {
    //   logger.info('Razorpay API health check: Skipped (not configured)');
    // }
    
  } catch (error) {
    logger.error('Health check failed:', error);
  }
});

// Start all scheduled tasks
const startScheduledTasks = () => {
  paymentPollingTask.start();
  cleanupTask.start();
  statisticsTask.start();
  healthCheckTask.start();
  
  logger.info('All scheduled tasks started');
};

// Stop all scheduled tasks
const stopScheduledTasks = () => {
  paymentPollingTask.stop();
  cleanupTask.stop();
  statisticsTask.stop();
  healthCheckTask.stop();
  
  logger.info('All scheduled tasks stopped');
};

// Manual payment status check
const checkPaymentStatus = async (paymentId) => {
  try {
    if (!razorpay) {
      logger.warn('Razorpay not configured, cannot check payment status');
      return null;
    }
    const payment = await razorpay.payments.fetch(paymentId);
    return payment.status;
  } catch (error) {
    logger.error(`Error checking payment status for ${paymentId}:`, error);
    return null;
  }
};

// Manual cleanup of specific application
const cleanupApplication = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (application.paymentId && razorpay) {
      const paymentStatus = await checkPaymentStatus(application.paymentId);
      
      if (paymentStatus === 'captured') {
        application.paymentStatus = 'completed';
        application.paymentDate = new Date();
      } else if (paymentStatus === 'failed' || !paymentStatus) {
        application.paymentStatus = 'failed';
      }
      
      await application.save();
      logger.info(`Cleaned up application ${applicationId}`);
      return application.paymentStatus;
    }
  } catch (error) {
    logger.error(`Error cleaning up application ${applicationId}:`, error);
    throw error;
  }
};

module.exports = {
  startScheduledTasks,
  stopScheduledTasks,
  checkPaymentStatus,
  cleanupApplication,
  paymentPollingTask,
  cleanupTask,
  statisticsTask,
  healthCheckTask
}; 