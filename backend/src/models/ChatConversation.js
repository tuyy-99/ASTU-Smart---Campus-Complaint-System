const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
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
  title: {
    type: String,
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
    default: 'New Chat'
  },
  lastMessage: {
    type: String,
    trim: true,
    maxlength: [4000, 'Last message cannot exceed 4000 characters']
  },
  lastMessageAt: {
    type: Date
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatConversationSchema.index({ user: 1, roleScope: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
