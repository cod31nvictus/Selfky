const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const Setting = require('../models/Setting');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const emailService = require('../utils/emailService');
const PDFGenerator = require('../utils/pdfGenerator');
const { processUploadedImage } = require('../utils/imageProcessor');
const S3Service = require('../utils/s3Service');
const logger = require('../utils/logger');

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
  
  // Find the last application number for this course type with optimized query
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

// Get all applications for a user with optimization
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = Application.find({ userId: req.user.id });
    
    // Add sorting
    query = query.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    
    // Add pagination
    query = query.skip((page - 1) * limit).limit(limit);
    
    // Execute query
    const applications = await query;
    
    // Get total count for pagination
    const total = await Application.countDocuments({ userId: req.user.id });
    
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
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get a specific application with optimization
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
  console.log('Application creation started');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
  
  try {
    const { 
      courseType, 
      fullName, 
      fathersName, 
      aadharNumber,
      dateOfBirth,
      sex,
      nationality,
      category,
      correspondenceAddress,
      permanentAddress,
      correspondencePhone,
      qualifyingExamRollNo,
      qualifyingExamStatus,
      qualifyingBoard,
      qualifyingYear,
      qualifyingSubjects,
      qualifyingMarksObtained,
      qualifyingMaxMarks,
      qualifyingPercentage,
      highSchoolRollNo,
      highSchoolBoard,
      highSchoolYear,
      highSchoolSubjects,
      highSchoolMarksObtained,
      highSchoolMaxMarks,
      highSchoolPercentage,
      intermediateBoard,
      intermediateYear,
      intermediateSubjects,
      intermediateMarksObtained,
      intermediateMaxMarks,
      intermediatePercentage,
      // BPharm Year Details
      bpharmYear1MarksObtained,
      bpharmYear1MaxMarks,
      bpharmYear1Percentage,
      bpharmYear2MarksObtained,
      bpharmYear2MaxMarks,
      bpharmYear2Percentage,
      bpharmYear3MarksObtained,
      bpharmYear3MaxMarks,
      bpharmYear3Percentage,
      bpharmYear4MarksObtained,
      bpharmYear4MaxMarks,
      bpharmYear4Percentage,
      placeOfApplication
    } = req.body;

    // Validate required fields
    console.log('Validating required fields...');
    if (!courseType || !fullName || !fathersName || !category || !dateOfBirth) {
      console.log('Missing required fields:', { courseType, fullName, fathersName, category, dateOfBirth });
      return res.status(400).json({ error: 'All required fields are required' });
    }

    // Validate course type
    if (!['bpharm', 'mpharm'].includes(courseType)) {
      return res.status(400).json({ error: 'Invalid course type. Must be bpharm or mpharm' });
    }

    // Validate category
    const validCategories = ['General', 'OBC', 'EWS', 'SC', 'ST', 'PWD'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be one of: General, OBC, EWS, SC, ST, PWD' });
    }

    // Check if required files were uploaded
    console.log('Checking required files...');
    if (!req.files || !req.files.photo || !req.files.signature) {
      console.log('Missing required files:', { 
        hasFiles: !!req.files, 
        hasPhoto: !!(req.files && req.files.photo), 
        hasSignature: !!(req.files && req.files.signature) 
      });
      return res.status(400).json({ error: 'Photo and signature are required' });
    }

    // Validate required file types
    const photo = req.files.photo;
    const signature = req.files.signature;

    if (!photo.mimetype.startsWith('image/') || !signature.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Photo and signature must be image files' });
    }

    // Handle optional documents
    const categoryCertificate = req.files.categoryCertificate;
    const highSchoolCertificate = req.files.highSchoolCertificate;
    const intermediateCertificate = req.files.intermediateCertificate;

    // Validate optional file types if they exist
    if (categoryCertificate && !categoryCertificate.mimetype.startsWith('image/') && categoryCertificate.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Category certificate must be an image or PDF file' });
    }
    if (highSchoolCertificate && !highSchoolCertificate.mimetype.startsWith('image/') && highSchoolCertificate.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'High school certificate must be an image or PDF file' });
    }
    if (intermediateCertificate && !intermediateCertificate.mimetype.startsWith('image/') && intermediateCertificate.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: '10+2 certificate must be an image or PDF file' });
    }

    // Process and resize images first
    const photoResult = await processUploadedImage(photo, null, 'photo.jpg');
    const signatureResult = await processUploadedImage(signature, null, 'signature.jpg');

    // Log processing results
    if (photoResult.success) {
      console.log(`Photo processed: ${photoResult.compressionRatio} compression, ${photoResult.newSize} bytes`);
    } else {
      console.log(`Photo processing failed: ${photoResult.error}`);
    }

    if (signatureResult.success) {
      console.log(`Signature processed: ${signatureResult.compressionRatio} compression, ${signatureResult.newSize} bytes`);
    } else {
      console.log(`Signature processing failed: ${signatureResult.error}`);
    }

    // Upload processed images to S3
    const photoUpload = await S3Service.uploadFile({
      data: photoResult.processedBuffer,
      name: `photo-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
      mimetype: 'image/jpeg'
    }, 'photos');

    const signatureUpload = await S3Service.uploadFile({
      data: signatureResult.processedBuffer,
      name: `signature-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
      mimetype: 'image/jpeg'
    }, 'signatures');

    if (!photoUpload.success || !signatureUpload.success) {
      return res.status(500).json({ error: 'Failed to upload required files to S3' });
    }

    // Process and upload optional documents
    let categoryCertificateUpload = null;
    let highSchoolCertificateUpload = null;
    let intermediateCertificateUpload = null;

    if (categoryCertificate) {
      if (categoryCertificate.mimetype.startsWith('image/')) {
        const categoryResult = await processUploadedImage(categoryCertificate, null, 'category.jpg');
        if (categoryResult.success) {
          categoryCertificateUpload = await S3Service.uploadFile({
            data: categoryResult.processedBuffer,
            name: `category-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        // Handle PDF directly
        categoryCertificateUpload = await S3Service.uploadFile({
          data: categoryCertificate.data,
          name: `category-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }
    }

    if (highSchoolCertificate) {
      if (highSchoolCertificate.mimetype.startsWith('image/')) {
        const highSchoolResult = await processUploadedImage(highSchoolCertificate, null, 'highschool.jpg');
        if (highSchoolResult.success) {
          highSchoolCertificateUpload = await S3Service.uploadFile({
            data: highSchoolResult.processedBuffer,
            name: `highschool-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        // Handle PDF directly
        highSchoolCertificateUpload = await S3Service.uploadFile({
          data: highSchoolCertificate.data,
          name: `highschool-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }
    }

    if (intermediateCertificate) {
      if (intermediateCertificate.mimetype.startsWith('image/')) {
        const intermediateResult = await processUploadedImage(intermediateCertificate, null, 'intermediate.jpg');
        if (intermediateResult.success) {
          intermediateCertificateUpload = await S3Service.uploadFile({
            data: intermediateResult.processedBuffer,
            name: `intermediate-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        // Handle PDF directly
        intermediateCertificateUpload = await S3Service.uploadFile({
          data: intermediateCertificate.data,
          name: `intermediate-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }
    }

    // Process BPharm documents for MPharm applications
    let bpharmYear1MarksheetUpload = null;
    let bpharmYear2MarksheetUpload = null;
    let bpharmYear3MarksheetUpload = null;
    let bpharmYear4MarksheetUpload = null;
    let bpharmDegreeUpload = null;

    if (courseType === 'mpharm') {
      // Check for required BPharm documents
      const bpharmYear1Marksheet = req.files.bpharmYear1Marksheet;
      const bpharmYear2Marksheet = req.files.bpharmYear2Marksheet;
      const bpharmYear3Marksheet = req.files.bpharmYear3Marksheet;
      const bpharmYear4Marksheet = req.files.bpharmYear4Marksheet;
      const bpharmDegree = req.files.bpharmDegree;

      // Validate required BPharm documents for MPharm
      if (!bpharmYear1Marksheet || !bpharmYear2Marksheet || !bpharmYear3Marksheet || !bpharmYear4Marksheet || !bpharmDegree) {
        return res.status(400).json({ 
          error: 'All BPharm documents are required for MPharm applications: Year 1-4 Marksheets and BPharm Degree' 
        });
      }

      // Process BPharm Year 1 Marksheet
      if (bpharmYear1Marksheet.mimetype.startsWith('image/')) {
        const bpharmYear1Result = await processUploadedImage(bpharmYear1Marksheet, null, 'bpharm-year1.jpg');
        if (bpharmYear1Result.success) {
          bpharmYear1MarksheetUpload = await S3Service.uploadFile({
            data: bpharmYear1Result.processedBuffer,
            name: `bpharm-year1-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        bpharmYear1MarksheetUpload = await S3Service.uploadFile({
          data: bpharmYear1Marksheet.data,
          name: `bpharm-year1-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }

      // Process BPharm Year 2 Marksheet
      if (bpharmYear2Marksheet.mimetype.startsWith('image/')) {
        const bpharmYear2Result = await processUploadedImage(bpharmYear2Marksheet, null, 'bpharm-year2.jpg');
        if (bpharmYear2Result.success) {
          bpharmYear2MarksheetUpload = await S3Service.uploadFile({
            data: bpharmYear2Result.processedBuffer,
            name: `bpharm-year2-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        bpharmYear2MarksheetUpload = await S3Service.uploadFile({
          data: bpharmYear2Marksheet.data,
          name: `bpharm-year2-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }

      // Process BPharm Year 3 Marksheet
      if (bpharmYear3Marksheet.mimetype.startsWith('image/')) {
        const bpharmYear3Result = await processUploadedImage(bpharmYear3Marksheet, null, 'bpharm-year3.jpg');
        if (bpharmYear3Result.success) {
          bpharmYear3MarksheetUpload = await S3Service.uploadFile({
            data: bpharmYear3Result.processedBuffer,
            name: `bpharm-year3-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        bpharmYear3MarksheetUpload = await S3Service.uploadFile({
          data: bpharmYear3Marksheet.data,
          name: `bpharm-year3-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }

      // Process BPharm Year 4 Marksheet
      if (bpharmYear4Marksheet.mimetype.startsWith('image/')) {
        const bpharmYear4Result = await processUploadedImage(bpharmYear4Marksheet, null, 'bpharm-year4.jpg');
        if (bpharmYear4Result.success) {
          bpharmYear4MarksheetUpload = await S3Service.uploadFile({
            data: bpharmYear4Result.processedBuffer,
            name: `bpharm-year4-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        bpharmYear4MarksheetUpload = await S3Service.uploadFile({
          data: bpharmYear4Marksheet.data,
          name: `bpharm-year4-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }

      // Process BPharm Degree
      if (bpharmDegree.mimetype.startsWith('image/')) {
        const bpharmDegreeResult = await processUploadedImage(bpharmDegree, null, 'bpharm-degree.jpg');
        if (bpharmDegreeResult.success) {
          bpharmDegreeUpload = await S3Service.uploadFile({
            data: bpharmDegreeResult.processedBuffer,
            name: `bpharm-degree-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
            mimetype: 'image/jpeg'
          }, 'certificates');
        }
      } else {
        bpharmDegreeUpload = await S3Service.uploadFile({
          data: bpharmDegree.data,
          name: `bpharm-degree-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`,
          mimetype: 'application/pdf'
        }, 'certificates');
      }
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
        aadharNumber,
        dateOfBirth: new Date(dateOfBirth),
        sex,
        nationality,
        category,
        correspondenceAddress,
        permanentAddress,
        correspondencePhone,
        qualifyingExamRollNo,
        qualifyingExamStatus,
        qualifyingBoard,
        qualifyingYear,
        qualifyingSubjects,
        qualifyingMarksObtained,
        qualifyingMaxMarks,
        qualifyingPercentage,
        highSchoolRollNo,
        highSchoolBoard,
        highSchoolYear,
        highSchoolSubjects,
        highSchoolMarksObtained,
        highSchoolMaxMarks,
        highSchoolPercentage,
        intermediateBoard,
        intermediateYear,
        intermediateSubjects: intermediateSubjects ? new Map(Object.entries(JSON.parse(intermediateSubjects))) : new Map(),
        intermediateMarksObtained,
        intermediateMaxMarks,
        intermediatePercentage,
        // BPharm Year Details
        bpharmYear1MarksObtained,
        bpharmYear1MaxMarks,
        bpharmYear1Percentage,
        bpharmYear2MarksObtained,
        bpharmYear2MaxMarks,
        bpharmYear2Percentage,
        bpharmYear3MarksObtained,
        bpharmYear3MaxMarks,
        bpharmYear3Percentage,
        bpharmYear4MarksObtained,
        bpharmYear4MaxMarks,
        bpharmYear4Percentage,
        placeOfApplication
      },
      documents: {
        photo: photoUpload.key,
        signature: signatureUpload.key,
        categoryCertificate: categoryCertificateUpload?.key || null,
        highSchoolCertificate: highSchoolCertificateUpload?.key || null,
        intermediateCertificate: intermediateCertificateUpload?.key || null,
        // BPharm documents for MPharm applications
        bpharmYear1Marksheet: bpharmYear1MarksheetUpload?.key || null,
        bpharmYear2Marksheet: bpharmYear2MarksheetUpload?.key || null,
        bpharmYear3Marksheet: bpharmYear3MarksheetUpload?.key || null,
        bpharmYear4Marksheet: bpharmYear4MarksheetUpload?.key || null,
        bpharmDegree: bpharmDegreeUpload?.key || null
      },
      payment: {
        amount: (() => {
          // New fee structure based on category and course type
          let calculatedFee = 0;
          
          // Normalize category to handle edge cases
          const normalizedCategory = category ? category.trim() : '';
          
          console.log(`Fee calculation input: courseType=${courseType}, category="${category}", normalizedCategory="${normalizedCategory}"`);
          
          if (courseType === 'bpharm') {
            // BPharm fees
            if (['General', 'OBC', 'EWS'].includes(normalizedCategory)) {
              calculatedFee = 1200;
            } else if (['SC', 'ST', 'PWD'].includes(normalizedCategory)) {
              calculatedFee = 900;
            } else {
              // Fallback for unknown categories
              console.warn(`Unknown category "${normalizedCategory}" for BPharm, using default fee`);
              calculatedFee = 1200;
            }
          } else if (courseType === 'mpharm') {
            // MPharm fees
            if (['General', 'OBC', 'EWS'].includes(normalizedCategory)) {
              calculatedFee = 1500;
            } else if (['SC', 'ST', 'PWD'].includes(normalizedCategory)) {
              calculatedFee = 1000;
            } else {
              // Fallback for unknown categories
              console.warn(`Unknown category "${normalizedCategory}" for MPharm, using default fee`);
              calculatedFee = 1500;
            }
          } else {
            // Fallback for unknown course type
            console.warn(`Unknown course type "${courseType}", using default fee`);
            calculatedFee = 1500;
          }
          
          // Final safety check
          if (calculatedFee === 0) {
            console.error(`Fee calculation resulted in 0 for ${courseType}/${normalizedCategory}, using fallback`);
            calculatedFee = courseType === 'bpharm' ? 1200 : 1500;
          }
          
          console.log(`Fee calculation result for ${courseType}/${normalizedCategory}: ₹${calculatedFee}`);
          return calculatedFee;
        })(),
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
    logger.error('Application creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create application',
      details: error.message 
    });
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

    // Check if admit cards are released (from settings)
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({ admitCardReleased: false });
      await settings.save();
    }

    if (!settings.admitCardReleased) {
      return res.status(400).json({ error: 'Admit cards are not yet released' });
    }

    // Check if current date is after the release date (22-08-2025)
    const releaseDate = new Date('2025-08-22');
    const currentDate = new Date();
    
    if (currentDate < releaseDate) {
      return res.status(400).json({ 
        error: 'Admit cards will be available from 22-08-2025. Current date is before the release date.' 
      });
    }

    // Generate roll number if not already generated
    if (!application.admitCard.rollNumber) {
      const year = '25';
      const coursePrefix = application.courseType === 'bpharm' ? 'BPH' : 'MPH';
      const rollNumber = `${coursePrefix}${year}${application.applicationNumber.slice(-4)}`;
      application.admitCard.rollNumber = rollNumber;
      application.status = 'admit_card_generated';
      await application.save();

      // Send admit card ready email
      try {
        const user = await User.findById(application.userId);
        if (user) {
          await emailService.sendAdmitCardReadyEmail(
            user.email,
            application.applicationNumber,
            application.courseType,
            user.name || user.email
          );
        }
      } catch (emailError) {
        console.error('Error sending admit card ready email:', emailError);
        // Don't fail the admit card generation if email fails
      }
    }

    res.json(application);
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

    // Check if admit cards are released (from settings)
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({ admitCardReleased: false });
      await settings.save();
    }

    if (!settings.admitCardReleased) {
      return res.status(400).json({ error: 'Admit cards are not yet released' });
    }

    // Check if current date is after the release date (22-08-2025)
    const releaseDate = new Date('2025-08-22');
    const currentDate = new Date();
    
    if (currentDate < releaseDate) {
      return res.status(400).json({ 
        error: 'Admit cards will be available from 22-08-2025. Current date is before the release date.' 
      });
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

// Public endpoint to check admit card release status
router.get('/admit-card-status', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Setting({
        admitCardReleased: false
      });
      await settings.save();
    }

    // Check if current date is after the release date (22-08-2025)
    const releaseDate = new Date('2025-08-22');
    const currentDate = new Date();
    const isAfterReleaseDate = currentDate >= releaseDate;
    
    res.json({ 
      success: true, 
      admitCardReleased: settings.admitCardReleased && isAfterReleaseDate,
      releaseDate: '2025-08-22',
      currentDate: currentDate.toISOString().split('T')[0],
      isAfterReleaseDate: isAfterReleaseDate
    });
  } catch (error) {
    console.error('Error fetching admit card status:', error);
    res.status(500).json({ error: 'Failed to fetch admit card status' });
  }
});

module.exports = router; 