const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('./emailService');
const socketService = require('./socketService');

class NotificationService {
  async createNotification(recipient, complaint, type, message, metadata = {}) {
    try {
      const notification = await Notification.create({
        recipient,
        complaint,
        type,
        message,
        metadata
      });
      
      // Send real-time notification via WebSocket
      socketService.notifyUser(recipient, 'notification', {
        id: notification._id,
        type,
        message,
        complaint,
        createdAt: notification.createdAt
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyComplaintCreated(complaint) {
    // Notify admins about new complaint
    const admins = await User.find({ role: 'admin', isActive: true });
    
    const notifications = admins.map(admin => 
      this.createNotification(
        admin._id,
        complaint._id,
        'complaint_created',
        `New complaint created: ${complaint.title}`
      )
    );

    await Promise.all(notifications);
    
    // Real-time notification to all admins
    socketService.notifyAdmins('new_complaint', {
      id: complaint._id,
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
      isAnonymous: complaint.isAnonymous
    });
  }

  async notifyStatusUpdate(complaint, oldStatus, newStatus) {
    const student = await User.findById(complaint.createdBy);
    await this.createNotification(
      complaint.createdBy,
      complaint._id,
      'status_updated',
      `Your complaint status changed from ${oldStatus} to ${newStatus}`,
      { oldStatus, newStatus }
    );

    if (student) {
      await EmailService.sendStatusUpdateEmail(student, complaint, oldStatus, newStatus);
    }
    
    // Real-time notification
    socketService.notifyUser(complaint.createdBy, 'status_update', {
      complaintId: complaint._id,
      oldStatus,
      newStatus,
      title: complaint.title
    });
  }

  async notifyRemarkAdded(complaint, remark) {
    // Notify complaint creator
    await this.createNotification(
      complaint.createdBy,
      complaint._id,
      'remark_added',
      `New remark added to your complaint: ${complaint.title}`
    );
  }

  async getUserNotifications(userId, limit = 20) {
    return await Notification.find({ recipient: userId })
      .populate('complaint', 'title status')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  async getAdminRecipients(excludeUserId) {
    const recipients = await User.find({
      isActive: true,
      role: 'admin'
    }).select('_id');

    const excluded = String(excludeUserId || '');
    const unique = new Set();
    recipients.forEach((item) => {
      const id = String(item._id);
      if (id !== excluded) unique.add(id);
    });

    return Array.from(unique);
  }

  async notifyResolutionConfirmed(complaint, studentUser, comment = '') {
    const recipientIds = await this.getAdminRecipients(studentUser?._id);
    if (!recipientIds.length) return;
    const recipients = await User.find({ _id: { $in: recipientIds } }).select('email name');

    const message = comment
      ? `Complaint verified by student: ${complaint.title}`
      : `Student confirmed complaint is fixed: ${complaint.title}`;

    await Promise.all(
      recipients.map((recipient) =>
        this.createNotification(
          recipient._id,
          complaint._id,
          'complaint_verified',
          message,
          { action: 'confirm', comment }
        )
      )
    );

    await Promise.all(
      recipients.map((recipient) =>
        EmailService.sendVerificationEmail(recipient, complaint, 'confirm', comment)
      )
    );
  }

  async notifyComplaintReopened(complaint, studentUser, comment = '') {
    const recipientIds = await this.getAdminRecipients(studentUser?._id);
    if (!recipientIds.length) return;
    const recipients = await User.find({ _id: { $in: recipientIds } }).select('email name');

    const message = comment
      ? `Complaint reopened by student: ${complaint.title}`
      : `Student reopened complaint after resolution: ${complaint.title}`;

    await Promise.all(
      recipients.map((recipient) =>
        this.createNotification(
          recipient._id,
          complaint._id,
          'complaint_reopened',
          message,
          { action: 'reopen', comment }
        )
      )
    );

    await Promise.all(
      recipients.map((recipient) =>
        EmailService.sendVerificationEmail(recipient, complaint, 'reopen', comment)
      )
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

module.exports = new NotificationService();
