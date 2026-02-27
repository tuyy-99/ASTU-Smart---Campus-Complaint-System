const mongoose = require('mongoose');

const registrationRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true,
    uppercase: true,
    match: [/^UGR\/\d{5}\/\d{2}$/, 'Student ID must follow format UGR/00000/16']
  },
  profilePhotoPath: {
    type: String
  },
  idPhotoPath: {
    type: String,
    required: [true, 'ID photo is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  createdUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

registrationRequestSchema.index({ email: 1, status: 1 });
registrationRequestSchema.index({ studentId: 1, status: 1 });
registrationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RegistrationRequest', registrationRequestSchema);
