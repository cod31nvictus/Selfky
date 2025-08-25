const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseType: { 
    type: String, 
    required: true, 
    enum: ['bpharm', 'mpharm'] 
  },
  personalDetails: {
    fullName: { type: String, required: true },
    fathersName: { type: String, required: true },
    category: { 
      type: String, 
      required: true, 
      enum: ['General', 'OBC', 'SC', 'ST', 'PH'] 
    },
    dateOfBirth: { type: Date, required: true }
  },
  documents: {
    photo: { type: String, required: true }, // File path/URL
    signature: { type: String, required: true } // File path/URL
  },
  payment: {
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    paymentDate: Date
  },
  admitCard: {
    examDate: { type: Date, default: () => new Date('2025-08-31') },
    examTime: { type: String, default: '11:00 am to 1:00 pm' },
    examCenter: { 
      type: String, 
      default: 'NLT Institute of Medical Sciences BHU' 
    },
    examCenterAddress: { 
      type: String, 
      default: 'BHU, Varanasi, Uttar Pradesh - 221005' 
    }
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'submitted', 'payment_pending', 'payment_completed', 'admit_card_generated'],
    default: 'draft'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Application', applicationSchema); 