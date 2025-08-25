const bcrypt = require('bcryptjs');

const requireMasterAuth = async (req, res, next) => {
  try {
    const { masterPassword, targetEmail } = req.body;

    // Check if master password is provided
    if (!masterPassword) {
      return res.status(400).json({ error: 'Master password is required' });
    }

    // Verify master password against environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }

    // Compare master password with admin password
    const isMasterPasswordValid = await bcrypt.compare(masterPassword, adminPassword) || 
                                 masterPassword === adminPassword; // Fallback for plain text

    if (!isMasterPasswordValid) {
      return res.status(401).json({ error: 'Invalid master password' });
    }

    // If target email is provided, find that user
    if (targetEmail) {
      const User = require('../models/User');
      const targetUser = await User.findOne({ email: targetEmail });
      
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }

      // Add target user info to request
      req.masterUser = targetUser;
      req.isMasterAccess = true;
    }

    next();
  } catch (error) {
    console.error('Master auth error:', error);
    res.status(500).json({ error: 'Master authentication failed' });
  }
};

module.exports = { requireMasterAuth };
