const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Generate unique application number
const generateApplicationNumber = async (courseType) => {
  const prefix = courseType === 'bpharm' ? 'BPH' : 'MPH';
  const year = '25';
  
  // Find the last application number for this course type
  const lastApplication = await Application.findOne({
    applicationNumber: new RegExp(`^${prefix}${year}`)
  }).sort({ applicationNumber: -1 });

  let nextNumber = 1;
  if (lastApplication) {
    const lastNumber = parseInt(lastApplication.applicationNumber.slice(-4));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
};

// Get all applications for a user
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get a specific application
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create new application (Step 1: Personal Details)
router.post('/', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const { courseType, fullName, fathersName, category, dateOfBirth } = req.body;

    // Validate required fields
    if (!courseType || !fullName || !fathersName || !category || !dateOfBirth) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.photo || !req.files.signature) {
      return res.status(400).json({ error: 'Photo and signature are required' });
    }

    // Generate unique application number
    const applicationNumber = await generateApplicationNumber(courseType);

    // Create application
    const application = new Application({
      applicationNumber,
      userId: req.user.id,
      courseType,
      personalDetails: {
        fullName,
        fathersName,
        category,
        dateOfBirth: new Date(dateOfBirth)
      },
      documents: {
        photo: req.files.photo[0].path,
        signature: req.files.signature[0].path
      },
      payment: {
        amount: category === 'General' 
          ? (courseType === 'bpharm' ? 1000 : 1200)
          : (courseType === 'bpharm' ? 800 : 1000)
      },
      status: 'submitted'
    });

    await application.save();

    res.status(201).json(application);
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application payment status
router.patch('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update payment details
    application.payment.status = status;
    if (transactionId) {
      application.payment.transactionId = transactionId;
    }
    if (status === 'completed') {
      application.payment.paymentDate = new Date();
      application.status = 'payment_completed';
    } else if (status === 'failed' || status === 'cancelled') {
      application.status = 'payment_pending';
    }

    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Generate admit card
router.post('/:id/admit-card', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.payment.status !== 'completed') {
      return res.status(400).json({ error: 'Payment must be completed to generate admit card' });
    }

    // Generate roll number
    const rollNumber = 'RN' + Math.floor(Math.random() * 10000);
    
    // Update admit card details
    application.admitCard.rollNumber = rollNumber;
    application.status = 'admit_card_generated';

    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate admit card' });
  }
});

// Get application statistics (for admin)
router.get('/stats/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can add admin role to User model)
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$courseType',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$payment.status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 