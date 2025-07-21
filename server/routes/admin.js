const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFGenerator = require('../utils/pdfGenerator');
const fs = require('fs');
const DatabaseOptimizer = require('../utils/databaseOptimizer');
const S3Service = require('../utils/s3Service');
const logger = require('../utils/logger');

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

// Get all applicants (users) with optimization
router.get('/applicants', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    let query = User.find({}, '-password');
    
    // Add search functionality
    if (search) {
      query = query.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    // Add sorting and pagination
    query = DatabaseOptimizer.addSorting(query, 'createdAt', 'desc');
    query = DatabaseOptimizer.addPagination(query, parseInt(page), parseInt(limit));
    
    // Optimize query
    const applicants = await DatabaseOptimizer.optimizeQuery(query);
    
    // Get total count
    const total = await User.countDocuments(search ? {
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {});
    
    res.json({
      applicants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// Get all applications with optimization
router.get('/applications', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, courseType, category } = req.query;
    
    // Create optimized query with filters
    const filters = DatabaseOptimizer.createCompoundQuery({
      status,
      courseType,
      category
    });
    
    let query = Application.find(filters).populate('userId', 'email name');
    
    // Add sorting and pagination
    query = DatabaseOptimizer.addSorting(query, 'createdAt', 'desc');
    query = DatabaseOptimizer.addPagination(query, parseInt(page), parseInt(limit));
    
    // Optimize query
    const applications = await DatabaseOptimizer.optimizeQuery(query);
    
    // Get total count
    const total = await Application.countDocuments(filters);
    
    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
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

// Create application (admin)
router.post('/applications', isAdmin, async (req, res) => {
  try {
    const { 
      userId, 
      courseType, 
      fullName, 
      fathersName, 
      category, 
      dateOfBirth 
    } = req.body;

    // Validate required fields
    if (!userId || !courseType || !fullName || !fathersName || !category || !dateOfBirth) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an application
    const existingApplication = await Application.findOne({ userId });
    if (existingApplication) {
      return res.status(400).json({ error: 'User already has an application' });
    }

    // Generate application number
    const applicationNumber = courseType === 'bpharm' ? 'BPH' : 'BSC';
    const count = await Application.countDocuments({ courseType });
    const paddedCount = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear().toString().slice(-2);
    const finalApplicationNumber = `${applicationNumber}${year}${paddedCount}`;

    // Handle file uploads to S3
    let photoPath = '';
    let signaturePath = '';
    let categoryCertificatePath = '';
    let highSchoolCertificatePath = '';
    let intermediateCertificatePath = '';
    
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      const photoKey = `photos/photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(photo.data, photoKey, photo.mimetype);
      if (uploadResult.success) {
        photoPath = photoKey;
      } else {
        return res.status(500).json({ error: 'Failed to upload photo' });
      }
    }
    
    if (req.files && req.files.signature) {
      const signature = req.files.signature;
      const signatureKey = `signatures/signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${signature.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(signature.data, signatureKey, signature.mimetype);
      if (uploadResult.success) {
        signaturePath = signatureKey;
      } else {
        return res.status(500).json({ error: 'Failed to upload signature' });
      }
    }

    // Handle optional documents
    if (req.files && req.files.categoryCertificate) {
      const categoryCertificate = req.files.categoryCertificate;
      const certificateKey = `certificates/category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${categoryCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(categoryCertificate.data, certificateKey, categoryCertificate.mimetype);
      if (uploadResult.success) {
        categoryCertificatePath = certificateKey;
      }
    }
    
    if (req.files && req.files.highSchoolCertificate) {
      const highSchoolCertificate = req.files.highSchoolCertificate;
      const certificateKey = `certificates/highschool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${highSchoolCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(highSchoolCertificate.data, certificateKey, highSchoolCertificate.mimetype);
      if (uploadResult.success) {
        highSchoolCertificatePath = certificateKey;
      }
    }
    
    if (req.files && req.files.intermediateCertificate) {
      const intermediateCertificate = req.files.intermediateCertificate;
      const certificateKey = `certificates/intermediate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${intermediateCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(intermediateCertificate.data, certificateKey, intermediateCertificate.mimetype);
      if (uploadResult.success) {
        intermediateCertificatePath = certificateKey;
      }
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
      applicationNumber: finalApplicationNumber,
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
        signature: signaturePath,
        categoryCertificate: categoryCertificatePath || null,
        highSchoolCertificate: highSchoolCertificatePath || null,
        intermediateCertificate: intermediateCertificatePath || null
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

    // Handle file uploads to S3
    if (req.files && req.files.photo) {
      const photo = req.files.photo;
      const photoKey = `photos/photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(photo.data, photoKey, photo.mimetype);
      if (uploadResult.success) {
        application.documents.photo = photoKey;
      } else {
        return res.status(500).json({ error: 'Failed to upload photo' });
      }
    }

    if (req.files && req.files.signature) {
      const signature = req.files.signature;
      const signatureKey = `signatures/signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${signature.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(signature.data, signatureKey, signature.mimetype);
      if (uploadResult.success) {
        application.documents.signature = signatureKey;
      } else {
        return res.status(500).json({ error: 'Failed to upload signature' });
      }
    }

    // Handle optional documents
    if (req.files && req.files.categoryCertificate) {
      const categoryCertificate = req.files.categoryCertificate;
      const certificateKey = `certificates/category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${categoryCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(categoryCertificate.data, certificateKey, categoryCertificate.mimetype);
      if (uploadResult.success) {
        application.documents.categoryCertificate = certificateKey;
      }
    }
    
    if (req.files && req.files.highSchoolCertificate) {
      const highSchoolCertificate = req.files.highSchoolCertificate;
      const certificateKey = `certificates/highschool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${highSchoolCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(highSchoolCertificate.data, certificateKey, highSchoolCertificate.mimetype);
      if (uploadResult.success) {
        application.documents.highSchoolCertificate = certificateKey;
      }
    }
    
    if (req.files && req.files.intermediateCertificate) {
      const intermediateCertificate = req.files.intermediateCertificate;
      const certificateKey = `certificates/intermediate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${intermediateCertificate.name.split('.').pop()}`;
      const uploadResult = await S3Service.uploadFile(intermediateCertificate.data, certificateKey, intermediateCertificate.mimetype);
      if (uploadResult.success) {
        application.documents.intermediateCertificate = certificateKey;
      }
    }

    // Update other fields
    if (courseType) application.courseType = courseType;
    if (fullName) application.personalDetails.fullName = fullName;
    if (fathersName) application.personalDetails.fathersName = fathersName;
    if (category) application.personalDetails.category = category;
    if (dateOfBirth) application.personalDetails.dateOfBirth = new Date(dateOfBirth);

    await application.save();
    
    const updatedApplication = await Application.findById(applicationId)
      .populate('userId', 'email name');
    
    res.json(updatedApplication);
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

// Generate invigilator sheet PDF
router.get('/invigilator-sheet-pdf', isAdmin, async (req, res) => {
  try {
    // Get all applications with completed payments
    const applications = await Application.find({
      'payment.status': 'completed'
    }).populate('userId', 'name email');

    if (applications.length === 0) {
      return res.status(404).json({ error: 'No completed applications found' });
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfResult = await pdfGenerator.generateInvigilatorSheet(applications);

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
    console.error('Error generating invigilator sheet:', error);
    res.status(500).json({ error: 'Failed to generate invigilator sheet' });
  }
});

// Get dashboard analytics
router.get('/analytics', isAdmin, async (req, res) => {
  try {
    // Total applications
    const totalApplications = await Application.countDocuments();
    
    // Applications by status
    const applicationsByStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Applications by course type
    const applicationsByCourse = await Application.aggregate([
      {
        $group: {
          _id: '$courseType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Applications by category
    const applicationsByCategory = await Application.aggregate([
      {
        $group: {
          _id: '$personalDetails.category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment statistics
    const paymentStats = await Application.aggregate([
      {
        $group: {
          _id: '$payment.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$payment.amount' }
        }
      }
    ]);

    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Monthly applications
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyApplications = await Application.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    res.json({
      totalApplications,
      applicationsByStatus,
      applicationsByCourse,
      applicationsByCategory,
      paymentStats,
      recentApplications,
      monthlyApplications
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router; 