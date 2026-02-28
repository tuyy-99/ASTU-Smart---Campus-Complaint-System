const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatConversation',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roleScope: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [4000, 'Message cannot exceed 4000 characters']
  },
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  contextComplaintIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }]
}, {
  timestamps: true
});

chatMessageSchema.index({ user: 1, roleScope: 1, conversation: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, roleScope: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, roleScope: 1, complaintId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
