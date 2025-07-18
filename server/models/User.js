const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date
}, {
  timestamps: true
});

// Database indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ resetToken: 1 });
userSchema.index({ resetTokenExpiry: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema); 