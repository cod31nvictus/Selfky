const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  admitCardReleased: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema); 