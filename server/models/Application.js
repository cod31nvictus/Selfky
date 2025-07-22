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
    aadharNumber: { type: String },
    dateOfBirth: { type: Date, required: true },
    sex: { type: String },
    nationality: { type: String, default: 'Indian' },
    category: { 
      type: String, 
      required: true, 
      enum: ['General', 'OBC', 'EWS', 'SC', 'ST', 'PWD'] 
    },
    // Contact Details
    correspondenceAddress: { type: String },
    permanentAddress: { type: String },
    correspondencePhone: { type: String },
    // Qualifying Examination
    qualifyingExamRollNo: { type: String },
    qualifyingExamStatus: { type: String, default: 'passed' },
    qualifyingBoard: { type: String },
    qualifyingYear: { type: String },
    qualifyingSubjects: { type: String },
    qualifyingMarksObtained: { type: String },
    qualifyingMaxMarks: { type: String },
    qualifyingPercentage: { type: String },
    // High School Details
    highSchoolRollNo: { type: String },
    highSchoolBoard: { type: String },
    highSchoolYear: { type: String },
    highSchoolSubjects: { type: String },
    highSchoolMarksObtained: { type: String },
    highSchoolMaxMarks: { type: String },
    highSchoolPercentage: { type: String },
    // Intermediate/Equivalent Exam Details
    intermediateBoard: { type: String },
    intermediateYear: { type: String },
    intermediateSubjects: { 
      type: Map, 
      of: {
        marksObtained: { type: String },
        maxMarks: { type: String },
        percentage: { type: String }
      }
    },
    intermediateMarksObtained: { type: String },
    intermediateMaxMarks: { type: String },
    intermediatePercentage: { type: String },
    // BPharm Year Details (for MPharm applications)
    bpharmYear1MarksObtained: { type: String },
    bpharmYear1MaxMarks: { type: String },
    bpharmYear1Percentage: { type: String },
    bpharmYear2MarksObtained: { type: String },
    bpharmYear2MaxMarks: { type: String },
    bpharmYear2Percentage: { type: String },
    bpharmYear3MarksObtained: { type: String },
    bpharmYear3MaxMarks: { type: String },
    bpharmYear3Percentage: { type: String },
    bpharmYear4MarksObtained: { type: String },
    bpharmYear4MaxMarks: { type: String },
    bpharmYear4Percentage: { type: String },
    placeOfApplication: { type: String }
  },
  documents: {
    photo: { type: String, required: true }, // File path/URL
    signature: { type: String, required: true }, // File path/URL
    categoryCertificate: { type: String }, // Optional - Category Certificate
    highSchoolCertificate: { type: String }, // Optional - High School Certificate
    intermediateCertificate: { type: String }, // Optional - 10+2 Certificate
    // BPharm Year Marksheets (for MPharm applications)
    bpharmYear1Marksheet: { type: String }, // Mandatory for MPharm
    bpharmYear2Marksheet: { type: String }, // Mandatory for MPharm
    bpharmYear3Marksheet: { type: String }, // Mandatory for MPharm
    bpharmYear4Marksheet: { type: String } // Mandatory for MPharm
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
    rollNumber: String,
    examDate: { type: Date, default: () => new Date('2025-03-15') },
    examTime: { type: String, default: '10:00 AM - 01:00 PM' },
    examCenter: { 
      type: String, 
      default: 'Banaras Hindu University, Varanasi' 
    },
    examCenterAddress: { 
      type: String, 
      default: 'Banaras Hindu University, Varanasi, Uttar Pradesh - 221005' 
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

// Database indexes for better query performance
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ courseType: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ 'payment.status': 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ updatedAt: -1 });
applicationSchema.index({ 'personalDetails.category': 1 });
applicationSchema.index({ 'admitCard.rollNumber': 1 });

// Compound indexes for common query patterns
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ courseType: 1, status: 1 });
applicationSchema.index({ 'payment.status': 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema); 