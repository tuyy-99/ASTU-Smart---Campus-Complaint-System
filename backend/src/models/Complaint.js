const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['academic', 'infrastructure', 'hostel', 'library', 'cafeteria', 'transport', 'other']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending_review', 'open', 'in_progress', 'resolved', 'rejected'],
    default: 'pending_review'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  sla: {
    dueDate: Date,
    isOverdue: {
      type: Boolean,
      default: false
    },
    hoursRemaining: Number
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    },
    address: String,
    buildingName: String
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    extractedText: {
      type: String,
      maxlength: [12000, 'Extracted text cannot exceed 12000 characters']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: [{
    comment: {
      type: String,
      required: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  resolutionVerification: {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'reopened']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification comment cannot exceed 500 characters']
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  },
  resolvedAt: Date,
  resolutionTime: Number // in hours
}, {
  timestamps: true
});

// Index for efficient queries
complaintSchema.index({ createdBy: 1, status: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index

// Calculate resolution time when status changes to resolved
// Set SLA due date on creation
complaintSchema.pre('save', function(next) {
  // Set SLA due date for new complaints
  if (this.isNew && !this.sla.dueDate) {
    const SLA_HOURS = {
      high: 24,    // 24 hours for high priority
      medium: 72,  // 72 hours for medium priority
      low: 168     // 168 hours (7 days) for low priority
    };
    
    const hoursToAdd = SLA_HOURS[this.priority] || SLA_HOURS.medium;
    this.sla.dueDate = new Date(this.createdAt.getTime() + hoursToAdd * 60 * 60 * 1000);
  }
  
  // Update SLA status
  if (this.sla.dueDate && this.status !== 'resolved') {
    const now = new Date();
    const hoursRemaining = (this.sla.dueDate - now) / (1000 * 60 * 60);
    this.sla.hoursRemaining = Math.round(hoursRemaining * 10) / 10;
    this.sla.isOverdue = hoursRemaining < 0;
  }
  
  // Calculate resolution time when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.resolutionTime = (this.resolvedAt - this.createdAt) / (1000 * 60 * 60); // hours
  }
  
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
