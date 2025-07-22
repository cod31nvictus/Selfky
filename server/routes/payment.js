const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Application = require('../models/Application');
const User = require('../models/User');
const Payment = require('../models/Payment');
const emailService = require('../utils/emailService');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('Razorpay credentials not found. Payment features will be disabled.');
}

// Create payment order
router.post('/create-order', async (req, res) => {
  try {
    console.log('Payment order creation request received:', {
      body: req.body,
      notes: req.body.notes
    });
    if (!razorpay) {
      console.warn('Razorpay not configured - returning mock payment order for testing');
      // Return a mock order for testing purposes
      const mockOrder = {
        id: `mock_order_${Date.now()}`,
        amount: req.body.amount * 100,
        currency: req.body.currency || 'INR',
        receipt: req.body.receipt || `mock_receipt_${Date.now()}`
      };
      
      return res.json({
        success: true,
        order: mockOrder
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({ error: 'Amount and receipt are required' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    // Track payment attempt in Payment model - ALWAYS create record
    if (notes && notes.applicationId && notes.userId) {
      try {
        const application = await Application.findById(notes.applicationId);
        const user = await User.findById(notes.userId);
        
        console.log('Database lookup results:', {
          applicationId: notes.applicationId,
          userId: notes.userId,
          applicationFound: !!application,
          userFound: !!user
        });
        
        if (application && user) {
          // Create payment record
          const uniqueTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('Creating payment record for:', { applicationId: notes.applicationId, userId: notes.userId, orderId: order.id, transactionId: uniqueTransactionId });
          const paymentRecord = new Payment({
            applicationId: notes.applicationId,
            userId: notes.userId,
            razorpayOrderId: order.id,
            transactionId: uniqueTransactionId,
            amount: amount,
            currency: currency,
            status: 'pending',
            receipt: receipt,
            notes: notes
          });
          await paymentRecord.save();
          console.log('Payment record created successfully:', paymentRecord._id);

          // Update application status
          application.status = 'payment_pending';
          await application.save();
        } else {
          console.error('Application or User not found:', { applicationId: notes.applicationId, userId: notes.userId });
          // Still create a payment record even if application/user not found
          const uniqueTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const paymentRecord = new Payment({
            applicationId: notes.applicationId,
            userId: notes.userId,
            razorpayOrderId: order.id,
            transactionId: uniqueTransactionId,
            amount: amount,
            currency: currency,
            status: 'pending',
            receipt: receipt,
            notes: { ...notes, error: 'Application or User not found during creation' }
          });
          await paymentRecord.save();
          console.log('Payment record created with error:', paymentRecord._id);
        }
      } catch (dbError) {
        console.error('Error recording payment attempt:', dbError);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          stack: dbError.stack
        });
        
        // Even if database fails, we should still return the order
        // The payment will be tracked when verification happens
      }
    } else {
      console.error('Missing required fields for payment tracking:', { notes });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment signature
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

    // Handle mock payments for testing
    if (razorpay_order_id && razorpay_order_id.startsWith('mock_order_')) {
      console.log('Mock payment verification for testing');
      
      // Update application status for mock payment
      if (applicationId) {
        try {
          const application = await Application.findById(applicationId);
          if (application) {
            application.status = 'payment_completed';
            application.payment.status = 'completed';
            application.payment.paymentDate = new Date();
            await application.save();
          }
        } catch (dbError) {
          console.error('Error updating application for mock payment:', dbError);
        }
      }
      
      return res.json({
        success: true,
        message: 'Mock payment verified successfully',
        paymentId: razorpay_payment_id || 'mock_payment_id'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification parameters are required' });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment record and application
    if (applicationId) {
      try {
        // Find and update the payment record
        const paymentRecord = await Payment.findOneAndUpdate(
          { 
            applicationId: applicationId,
            razorpayOrderId: razorpay_order_id,
            status: 'pending'
          },
          {
            razorpayPaymentId: razorpay_payment_id,
            status: 'completed',
            updatedAt: new Date()
          },
          { new: true }
        );

        // Update application status
        const application = await Application.findById(applicationId);
        if (application) {
          application.status = 'payment_completed';
          await application.save();

          // Send payment completed email
          try {
            const user = await User.findById(application.userId);
            if (user) {
              await emailService.sendPaymentCompletedEmail(
                user.email,
                application.applicationNumber,
                application.courseType,
                user.name || user.email,
                application.payment.amount
              );
            }
          } catch (emailError) {
            console.error('Error sending payment completed email:', emailError);
            // Don't fail the payment verification if email fails
          }
        }

        if (!paymentRecord) {
          console.warn('No pending payment record found for order:', razorpay_order_id);
          
          // Create a payment record if none exists (for older payments)
          try {
            const application = await Application.findById(applicationId);
            if (application) {
              const newPaymentRecord = new Payment({
                applicationId: applicationId,
                userId: application.userId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount: application.payment?.amount || 0,
                currency: 'INR',
                status: 'completed',
                receipt: `receipt_${razorpay_order_id}`,
                notes: { retroactive: true, createdDuringVerification: true }
              });
              await newPaymentRecord.save();
              console.log('Created retroactive payment record:', newPaymentRecord._id);
            }
          } catch (createError) {
            console.error('Error creating retroactive payment record:', createError);
          }
        }
      } catch (dbError) {
        console.error('Error updating payment record:', dbError);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // If payment verification fails, update payment record to failed status
    if (applicationId) {
      try {
        const paymentRecord = await Payment.findOneAndUpdate(
          { 
            applicationId: applicationId,
            razorpayOrderId: razorpay_order_id,
            status: 'pending'
          },
          {
            status: 'failed',
            errorMessage: error.message || 'Payment verification failed',
            updatedAt: new Date()
          },
          { new: true }
        );

        if (paymentRecord) {
          console.log('Updated payment record to failed status:', paymentRecord._id);
        }
      } catch (dbError) {
        console.error('Error updating failed payment record:', dbError);
      }
    }
    
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Webhook to handle payment status updates from Razorpay
router.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;
    
    console.log('Webhook received:', { event, payload });
    
    if (event === 'payment.failed') {
      const { payment } = payload.entity;
      
      // Find and update the payment record
      const paymentRecord = await Payment.findOneAndUpdate(
        { razorpayPaymentId: payment.id },
        {
          status: 'failed',
          errorMessage: payment.error_description || 'Payment failed',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (paymentRecord) {
        console.log('Updated payment record to failed status via webhook:', paymentRecord._id);
      }
    } else if (event === 'payment.cancelled') {
      const { payment } = payload.entity;
      
      // Find and update the payment record
      const paymentRecord = await Payment.findOneAndUpdate(
        { razorpayPaymentId: payment.id },
        {
          status: 'cancelled',
          errorMessage: 'Payment was cancelled by user',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (paymentRecord) {
        console.log('Updated payment record to cancelled status via webhook:', paymentRecord._id);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Log failed payment attempt (for frontend errors, network failures, etc.)
router.post('/log-failed-attempt', async (req, res) => {
  try {
    const { applicationId, userId, orderId, amount, error, receipt } = req.body;
    
    if (!applicationId || !userId || !orderId) {
      return res.status(400).json({ error: 'Application ID, User ID, and Order ID are required' });
    }

    // Check if payment record already exists
    let paymentRecord = await Payment.findOne({
      razorpayOrderId: orderId,
      applicationId: applicationId
    });

    if (!paymentRecord) {
      // Create new payment record for failed attempt
      const uniqueTransactionId = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      paymentRecord = new Payment({
        applicationId: applicationId,
        userId: userId,
        razorpayOrderId: orderId,
        transactionId: uniqueTransactionId,
        amount: amount || 0,
        currency: 'INR',
        status: 'failed',
        receipt: receipt || `failed_${orderId}`,
        errorMessage: error || 'Payment attempt failed',
        notes: { loggedFromFrontend: true, failureType: 'frontend_error' }
      });
      await paymentRecord.save();
      console.log('Created payment record for failed attempt:', paymentRecord._id);
    } else {
      // Update existing record to failed status
      paymentRecord.status = 'failed';
      paymentRecord.errorMessage = error || 'Payment attempt failed';
      paymentRecord.updatedAt = new Date();
      paymentRecord.notes = { ...paymentRecord.notes, loggedFromFrontend: true, failureType: 'frontend_error' };
      await paymentRecord.save();
      console.log('Updated payment record to failed status:', paymentRecord._id);
    }

    res.json({
      success: true,
      message: 'Failed payment attempt logged successfully'
    });
  } catch (error) {
    console.error('Error logging failed payment attempt:', error);
    res.status(500).json({ error: 'Failed to log payment attempt' });
  }
});

// Get payment status
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service is not configured. Please contact administrator.' });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Get all payments for admin with pagination
router.get('/admin/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search = '' } = req.query;
    
    // Create filters
    const filters = {};
    if (status) filters.status = status;
    
    // Add search functionality
    if (search) {
      filters.$or = [
        { 'applicationId.applicationNumber': { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } },
        { 'userId.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Payment.countDocuments(filters);
    
    // Get paginated payments
    const payments = await Payment.find(filters)
      .populate('applicationId', 'applicationNumber courseType')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const formattedPayments = payments.map(payment => ({
      id: payment.razorpayPaymentId || payment.razorpayOrderId,
      applicationId: payment.applicationId?._id,
      userId: payment.userId?._id,
      userName: payment.userId?.name || 'N/A',
      userEmail: payment.userId?.email || 'N/A',
      amount: payment.amount,
      status: payment.status,
      date: payment.createdAt,
      applicationNumber: payment.applicationId?.applicationNumber || 'N/A',
      courseType: payment.applicationId?.courseType || 'N/A',
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      receipt: payment.receipt,
      errorMessage: payment.errorMessage,
      attemptType: payment.notes?.loggedFromFrontend ? 'Frontend Error' : 
                   payment.notes?.retroactive ? 'Retroactive' : 
                   payment.notes?.createdDuringVerification ? 'Verification' : 'Normal',
      failureType: payment.notes?.failureType || null
    }));

    res.json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Handle payment cancellation
router.post('/cancel', async (req, res) => {
  try {
    const { orderId, applicationId } = req.body;
    
    if (!orderId || !applicationId) {
      return res.status(400).json({ error: 'Order ID and Application ID are required' });
    }

    // Find the payment record
    const paymentRecord = await Payment.findOne({
      razorpayOrderId: orderId,
      applicationId: applicationId
    });

    if (!paymentRecord) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Update payment status to cancelled
    paymentRecord.status = 'cancelled';
    paymentRecord.errorMessage = 'Payment was cancelled by user';
    paymentRecord.updatedAt = new Date();
    await paymentRecord.save();

    // Update application status back to submitted
    const application = await Application.findById(applicationId);
    if (application) {
      application.status = 'submitted';
      await application.save();
    }

    console.log('Payment cancelled:', paymentRecord._id);

    res.json({
      success: true,
      message: 'Payment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

// Check and update cancelled payments (fallback for webhook issues)
router.post('/check-cancelled-payments', async (req, res) => {
  try {
    const { orderId, applicationId } = req.body;
    
    if (!orderId || !applicationId) {
      return res.status(400).json({ error: 'Order ID and Application ID are required' });
    }

    // Find the payment record
    const paymentRecord = await Payment.findOne({
      razorpayOrderId: orderId,
      applicationId: applicationId
    });

    if (!paymentRecord) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Check with Razorpay if the payment was cancelled
    if (razorpay) {
      try {
        const order = await razorpay.orders.fetch(orderId);
        console.log('Razorpay order status:', order.status);
        
        if (order.status === 'cancelled') {
          paymentRecord.status = 'cancelled';
          paymentRecord.errorMessage = 'Payment was cancelled on Razorpay';
          paymentRecord.updatedAt = new Date();
          await paymentRecord.save();
          
          console.log('Updated payment record to cancelled status:', paymentRecord._id);
          
          return res.json({
            success: true,
            message: 'Payment updated to cancelled status',
            status: 'cancelled'
          });
        }
      } catch (razorpayError) {
        console.error('Error checking Razorpay order:', razorpayError);
      }
    }

    res.json({
      success: true,
      message: 'Payment status checked',
      status: paymentRecord.status
    });
  } catch (error) {
    console.error('Error checking cancelled payments:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Get payment statistics for admin
router.get('/admin/statistics', async (req, res) => {
  try {
    // Get completed payments
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    
    // Get all payment attempts
    const totalAttempts = await Payment.countDocuments({});

    // Get total amount from completed payments
    const completedPaymentsData = await Payment.find({ status: 'completed' });
    const totalAmount = completedPaymentsData.reduce((sum, payment) => sum + payment.amount, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCompleted = await Payment.countDocuments({
      status: 'completed',
      createdAt: { $gte: today }
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthCompleted = await Payment.countDocuments({
      status: 'completed',
      createdAt: { $gte: thisMonth }
    });

    // Get status breakdown
    const statusBreakdown = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    statusBreakdown.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      statistics: {
        totalPayments: completedPayments,
        totalAttempts: totalAttempts,
        totalAmount,
        todayPayments: todayCompleted,
        thisMonthPayments: thisMonthCompleted,
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

module.exports = router; 