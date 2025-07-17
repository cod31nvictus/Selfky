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
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service is not configured. Please contact administrator.' });
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

    // Track payment attempt in Payment model
    if (notes && notes.applicationId && notes.userId) {
      try {
        const application = await Application.findById(notes.applicationId);
        const user = await User.findById(notes.userId);
        
        if (application && user) {
          // Create payment record
          const paymentRecord = new Payment({
            applicationId: notes.applicationId,
            userId: notes.userId,
            razorpayOrderId: order.id,
            amount: amount,
            currency: currency,
            status: 'pending',
            receipt: receipt,
            notes: notes
          });
          await paymentRecord.save();

          // Update application status
          application.status = 'payment_pending';
          await application.save();
        } else {
          console.error('Application or User not found:', { applicationId: notes.applicationId, userId: notes.userId });
        }
      } catch (dbError) {
        console.error('Error recording payment attempt:', dbError);
        // Don't fail the payment order creation if DB update fails
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
    res.status(500).json({ error: 'Failed to verify payment' });
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

// Get all payments for admin
router.get('/admin/payments', async (req, res) => {
  try {
    // Get all payment attempts from Payment model
    const payments = await Payment.find({})
      .populate('applicationId', 'applicationNumber courseType')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const formattedPayments = payments.map(payment => ({
      id: payment.razorpayPaymentId || payment.razorpayOrderId,
      applicationId: payment.applicationId._id,
      userId: payment.userId._id,
      userName: payment.userId.name,
      userEmail: payment.userId.email,
      amount: payment.amount,
      status: payment.status,
      date: payment.createdAt,
      applicationNumber: payment.applicationId.applicationNumber,
      courseType: payment.applicationId.courseType,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      receipt: payment.receipt,
      errorMessage: payment.errorMessage
    }));

    res.json({
      success: true,
      payments: formattedPayments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
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