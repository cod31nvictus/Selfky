const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');

// Middleware to check if admin
const isAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken) {
    return res.status(401).json({ error: 'Admin token required' });
  }
  
  // For now, we'll accept any admin token that starts with 'admin_'
  // In production, you should validate the token properly
  if (!adminToken.startsWith('admin_')) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  
  next();
};

// Debug route to check admin authentication
router.get('/debug', isAdmin, (req, res) => {
  res.json({ message: 'Admin authentication working', token: req.headers['x-admin-token'] });
});

// Get all applicants (users)
router.get('/applicants', isAdmin, async (req, res) => {
  try {
    const applicants = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// Get all applications
router.get('/applications', isAdmin, async (req, res) => {
  try {
    const applications = await Application.find({})
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Reset user password (admin sets new password)
router.post('/applicants/:userId/reset-password', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body;
    
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    user.password = passwordHash;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get application details by ID
router.get('/applications/:applicationId', isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId)
      .populate('userId', 'email name');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application status
router.patch('/applications/:applicationId/status', isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    ).populate('userId', 'email name');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Create application for user (admin)
router.post('/applications', isAdmin, async (req, res) => {
  try {
    const { userId, courseType, fullName, fathersName, category, dateOfBirth } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if application already exists for this course
    const existingApplication = await Application.findOne({ 
      userId, 
      courseType 
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'Application already exists for this course' });
    }

    // Generate application number
    const lastApplication = await Application.findOne({}, {}, { sort: { 'applicationNumber': -1 } });
    let nextNumber = 1;
    if (lastApplication) {
      const lastNumber = parseInt(lastApplication.applicationNumber.slice(-6));
      nextNumber = lastNumber + 1;
    }
    const applicationNumber = `BPH${String(nextNumber).padStart(6, '0')}`;

    // Handle file uploads
    let photoPath = '';
    let signaturePath = '';
    
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      photoPath = `/uploads/photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.name.split('.').pop()}`;
      await photo.mv(`./uploads${photoPath}`);
    }
    
    if (req.files && req.files.signature) {
      const signature = req.files.signature;
      signaturePath = `/uploads/signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${signature.name.split('.').pop()}`;
      await signature.mv(`./uploads${signaturePath}`);
    }

    // Calculate fee
    const baseFee = courseType === 'bpharm' ? 1000 : 1500;
    const categoryDiscount = {
      'General': 0,
      'OBC': 0.1,
      'SC': 0.2,
      'ST': 0.2,
      'PH': 0.25
    };
    const discount = categoryDiscount[category] || 0;
    const fee = Math.round(baseFee * (1 - discount));

    const application = new Application({
      applicationNumber,
      userId,
      courseType,
      personalDetails: {
        fullName,
        fathersName,
        category,
        dateOfBirth: new Date(dateOfBirth)
      },
      documents: {
        photo: photoPath,
        signature: signaturePath
      },
      payment: {
        amount: fee,
        status: 'pending'
      },
      status: 'draft'
    });

    await application.save();
    
    const populatedApplication = await Application.findById(application._id)
      .populate('userId', 'email name');
    
    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application (admin)
router.put('/applications/:applicationId', isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { courseType, fullName, fathersName, category, dateOfBirth } = req.body;
    
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Handle file uploads
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      const photoPath = `/uploads/photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.name.split('.').pop()}`;
      await photo.mv(`./uploads${photoPath}`);
      application.documents.photo = photoPath;
    }
    
    if (req.files && req.files.signature) {
      const signature = req.files.signature;
      const signaturePath = `/uploads/signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${signature.name.split('.').pop()}`;
      await signature.mv(`./uploads${signaturePath}`);
      application.documents.signature = signaturePath;
    }

    // Update fields
    application.courseType = courseType;
    application.personalDetails = {
      fullName,
      fathersName,
      category,
      dateOfBirth: new Date(dateOfBirth)
    };

    await application.save();
    
    const populatedApplication = await Application.findById(application._id)
      .populate('userId', 'email name');
    
    res.json(populatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get admit card for application (admin)
router.get('/admit-card/:applicationId', isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log('Admin admit card request for application ID:', applicationId);
    console.log('Admin token:', req.headers['x-admin-token'] ? 'Present' : 'Missing');
    
    const application = await Application.findById(applicationId)
      .populate('userId', 'email name');
    
    console.log('Application found:', application ? 'Yes' : 'No');
    if (application) {
      console.log('Application details:', {
        id: application._id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        paymentStatus: application.payment?.status
      });
    }
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // For admin view, allow viewing admit card regardless of payment status
    // But add a note if payment is not completed
    const paymentStatus = application.payment.status;
    
    // Generate admit card data
    const admitCardData = {
      applicationNumber: application.applicationNumber,
      fullName: application.personalDetails.fullName,
      fathersName: application.personalDetails.fathersName,
      courseType: application.courseType === 'bpharm' ? 'B.Pharm' : 'D.Pharm',
      category: application.personalDetails.category,
      dateOfBirth: application.personalDetails.dateOfBirth,
      photo: application.documents.photo,
      signature: application.documents.signature,
      examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      examCenter: 'Main Campus, Selfky University',
      examTime: '10:00 AM - 1:00 PM',
      generatedAt: new Date(),
      isAdminView: true,
      paymentStatus: paymentStatus,
      paymentNote: paymentStatus !== 'completed' ? 'Payment pending - Admit card preview only' : null
    };
    
    console.log('Sending admit card data:', admitCardData);
    res.json(admitCardData);
  } catch (error) {
    console.error('Error generating admit card:', error);
    res.status(500).json({ error: 'Failed to generate admit card' });
  }
});

module.exports = router; 