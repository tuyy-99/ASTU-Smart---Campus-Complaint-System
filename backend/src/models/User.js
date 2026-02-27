const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const studentIdPattern = /^UGR\/\d{5}\/\d{2}$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student'
  },
  profilePhotoPath: {
    type: String,
    trim: true
  },
  accountStatus: {
    type: String,
    enum: ['PendingApproval', 'Active', 'Suspended', 'Rejected'],
    default: function() {
      // For existing non-student accounts we treat them as active by default.
      // Student accounts are typically created only after approval of a registration request.
      return this.role === 'student' ? 'Active' : 'Active';
    }
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'staff';
    },
    trim: true
  },
  studentId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    trim: true,
    uppercase: true,
    match: [studentIdPattern, 'Student ID must follow format UGR/00000/16'],
    sparse: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
