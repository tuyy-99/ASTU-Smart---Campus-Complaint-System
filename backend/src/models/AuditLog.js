const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorRole: {
    type: String,
    enum: ['admin', 'staff', 'student'],
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGIN_FAILED',
      'LOGOUT',
      'UNAUTHORIZED_ACCESS',
      'COMPLAINT_CREATE',
      'COMPLAINT_CREATED',
      'COMPLAINT_UPDATE',
      'COMPLAINT_UPDATED',
      'COMPLAINT_DELETED',
      'COMPLAINT_STATUS_UPDATE',
      'COMPLAINT_STATUS_CHANGED',
      'COMPLAINT_RESOLUTION_CONFIRMED',
      'COMPLAINT_REOPENED',
      'COMPLAINT_REMARK_ADDED',
      'COMPLAINT_EXPORT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_DEACTIVATED',
      'USER_REACTIVATED',
      'STUDENT_CREATED',
      'STUDENT_SUSPENDED',
      'STUDENT_REACTIVATED',
      'REGISTRATION_REQUEST',
      'REGISTRATION_APPROVED',
      'REGISTRATION_REJECTED',
      'PROFILE_UPDATE',
      'PROFILE_UPDATED',
      'PASSWORD_CHANGE',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      'ROLE_CHANGED',
      'DEPARTMENT_CHANGED'
    ]
  },
  resource: {
    type: String,
    enum: ['complaint', 'user', 'registration', 'profile', 'auth'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetIdDisplay: {
    type: String,
    trim: true,
    maxlength: 32
  },
  details: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  },
  correlationId: {
    type: String,
    trim: true,
    maxlength: 64
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ actorRole: 1, createdAt: -1 });
auditLogSchema.index({ targetIdDisplay: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
