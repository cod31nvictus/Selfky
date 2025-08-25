const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const emailService = require('../utils/emailService');
const PDFGenerator = require('../utils/pdfGenerator');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: decoded.userId };
    next();
  });
};

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

// Get current user's application (most recent)
router.get('/my-application/current', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    if (!application) {
      return res.status(404).json({ error: 'No application found for this user' });
    }
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
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
router.post('/', authenticateToken, async (req, res) => {
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

    // Validate file types
    const photo = req.files.photo;
    const signature = req.files.signature;

    if (!photo.mimetype.startsWith('image/') || !signature.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filenames
    const photoExt = path.extname(photo.name);
    const signatureExt = path.extname(signature.name);
    const photoFilename = `photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${photoExt}`;
    const signatureFilename = `signature-${Date.now()}-${Math.round(Math.random() * 1E9)}${signatureExt}`;

    // Save files
    const photoPath = path.join(uploadDir, photoFilename);
    const signaturePath = path.join(uploadDir, signatureFilename);

    await photo.mv(photoPath);
    await signature.mv(signaturePath);

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
        photo: photoFilename,
        signature: signatureFilename
      },
      payment: {
        amount: category === 'General' 
          ? (courseType === 'bpharm' ? 1000 : 1200)
          : (courseType === 'bpharm' ? 800 : 1000),
        status: 'pending'
      },
      status: 'submitted'
    });

    await application.save();

    // Send application submitted email
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        await emailService.sendApplicationSubmittedEmail(
          user.email,
          application.applicationNumber,
          application.courseType,
          user.name || user.email
        );
      }
    } catch (emailError) {
      console.error('Error sending application submitted email:', emailError);
      // Don't fail the application creation if email fails
    }

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

// Get admit card
router.get('/:id/admit-card', authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch admit card' });
  }
});

// Generate admit card
router.post('/:id/generate-admit-card', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application status to admit card generated
    application.status = 'admit_card_generated';
    await application.save();

    res.json({
      message: 'Admit card generated successfully',
      applicationNumber: application.applicationNumber,
      admitCard: application.admitCard
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate admit card' });
  }
});

// Download admit card PDF
router.get('/:id/admit-card-pdf', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.payment.status !== 'completed') {
      return res.status(400).json({ error: 'Payment must be completed to download admit card' });
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfResult = await pdfGenerator.generateAdmitCard(application, application.admitCard);

    if (pdfResult.success) {
      // Send file
      res.download(pdfResult.filepath, pdfResult.filename, (err) => {
        // Clean up file after download
        fs.unlink(pdfResult.filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting PDF file:', unlinkErr);
        });
      });
    } else {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
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