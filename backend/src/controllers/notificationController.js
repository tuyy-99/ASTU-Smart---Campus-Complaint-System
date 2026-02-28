const NotificationService = require('../services/notificationService');
const { asyncHandler, AppError } = require('../utils/errorHandler');

exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await NotificationService.getUserNotifications(req.user._id);

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await NotificationService.markAsRead(req.params.id, req.user._id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await NotificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    data: { message: 'All notifications marked as read' }
  });
});
