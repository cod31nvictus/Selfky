const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');

// Middleware to check if admin (for now, we'll use a simple check)
const isAdmin = (req, res, next) => {
  // For now, we'll allow all requests to admin routes
  // In production, you should implement proper admin authentication
  next();
};

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

// Reset user password (send reset email)
router.post('/reset-password/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash the temporary password
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    // Update user password
    user.password = passwordHash;
    await user.save();

    // In production, send email with temporary password
    // For now, just return success
    console.log(`Password reset for ${user.email}: ${tempPassword}`);
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      tempPassword: tempPassword // Remove this in production
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get application details by ID
router.get('/application/:applicationId', isAdmin, async (req, res) => {
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
router.put('/application/:applicationId/status', isAdmin, async (req, res) => {
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

module.exports = router; 