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

module.exports = mongoose.model('User', userSchema); 