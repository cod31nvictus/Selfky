const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');
const { requireMasterAuth } = require('../middleware/masterAuth');

// Helper for password validation
function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return '';
}

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ error: pwdError });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, name, password: passwordHash });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile with application data
router.get('/profile-with-application', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the user's application
    const application = await Application.findOne({ userId: user._id })
      .sort({ createdAt: -1 }); // Get the most recent application

    // Create a response that matches the old schema structure
    const userWithApplication = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      application: application ? {
        _id: application._id,
        applicationNumber: application.applicationNumber,
        courseType: application.courseType,
        status: application.status,
        photo: application.documents?.photo,
        signature: application.documents?.signature,
        personalDetails: application.personalDetails,
        payment: application.payment,
        admitCard: application.admitCard,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt
      } : null
    };

    res.json({
      user: userWithApplication
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user profile (legacy endpoint - kept for backward compatibility)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = emailService.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      email, 
      resetToken, 
      user.name
    );

    if (emailResult.success) {
      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    } else {
      console.error('Failed to send password reset email:', emailResult.error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear reset token
    user.password = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Error in verify reset token:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Master Login - Admin access to any user account
router.post('/master-login', requireMasterAuth, async (req, res) => {
  try {
    const { targetEmail } = req.body;
    
    if (!targetEmail) {
      return res.status(400).json({ error: 'Target email is required' });
    }

    // Find the target user
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Generate a special master token with user info
    const masterToken = jwt.sign(
      { 
        userId: targetUser._id,
        isMasterAccess: true,
        adminAccess: true,
        originalUser: targetUser.email
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } // Shorter expiry for security
    );

    res.json({
      message: 'Master access granted',
      masterToken,
      targetUser: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone
      },
      accessType: 'master',
      expiresIn: '1 hour'
    });

  } catch (error) {
    console.error('Master login error:', error);
    res.status(500).json({ error: 'Master login failed' });
  }
});

module.exports = router; 