const Complaint = require('../models/Complaint');
const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const Notification = require('../models/Notification');
const analyticsService = require('../services/analyticsService');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const { AppError, asyncHandler } = require('../utils/errorHandler');

const generateAutoPassword = () => {
  const digits = Math.floor(10000 + Math.random() * 90000);
  const year = Math.floor(Math.random() * 100);
  return `UGR/${digits}/${String(year).padStart(2, '0')}`;
};

exports.getAllComplaints = asyncHandler(async (req, res, next) => {
  const complaints = await Complaint.find()
    .populate('createdBy', 'name email role department')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    data: complaints
  });
});

exports.exportComplaints = asyncHandler(async (req, res, next) => {
  const format = String(req.query.format || 'csv').toLowerCase();
  const complaints = await Complaint.find()
    .populate('createdBy', 'name email studentId')
    .sort({ createdAt: -1 });

  const rows = [
    ['ID', 'Title', 'Category', 'Department', 'Status', 'Priority', 'Student Name', 'Student Email', 'Student ID', 'Created At', 'Updated At']
  ];

  complaints.forEach((item) => {
    rows.push([
      String(item._id),
      item.title || '',
      item.category || '',
      item.department || '',
      item.status || '',
      item.priority || '',
      item.createdBy?.name || '',
      item.createdBy?.email || '',
      item.createdBy?.studentId || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    ]);
  });

  const delimiter = format === 'excel' ? '\t' : ',';
  const content = rows
    .map((row) =>
      row
        .map((field) => `"${String(field || '').replace(/"/g, '""')}"`)
        .join(delimiter)
    )
    .join('\n');

  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="complaints-export.xls"');
  } else {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="complaints-export.csv"');
  }

  return res.status(200).send(content);
});

// Admin is read-only for complaint workflow in the strict hierarchy; bulk status updates are not allowed.
exports.bulkUpdateComplaintStatus = asyncHandler(async (req, res, next) => {
  return next(new AppError('Admin is not allowed to bulk update complaint status', 403));
});

exports.getAnalytics = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getComplaintStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, department } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Admin can only create staff accounts and must assign a department.
  const normalizedDepartment = String(department || '').trim();
  if (!normalizedDepartment) {
    return next(new AppError('Department is required when creating staff accounts', 400));
  }

  const generatedPassword = generateAutoPassword();
  const payload = {
    name,
    email,
    role: 'staff',
    department: normalizedDepartment,
    password: generatedPassword,
    accountStatus: 'Active'
  };

  const user = await User.create(payload);

  let emailSent = false;
  try {
    emailSent = await EmailService.sendAccountCreationEmail(user, generatedPassword);
  } catch (error) {
    emailSent = false;
  }

  res.status(201).json({
    success: true,
    data: user,
    generatedPassword,
    emailSent
  });
});

exports.updateUserRole = asyncHandler(async (req, res, next) => {
  // Changing roles is no longer allowed for admin in the strict hierarchy.
  return next(new AppError('Admin is not allowed to change user roles', 403));
});

exports.getRegistrationRequests = asyncHandler(async (req, res, next) => {
  const requests = await RegistrationRequest.find()
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

exports.approveRegistrationRequest = asyncHandler(async (req, res, next) => {
  // Registration approvals are handled by staff, not admin.
  return next(new AppError('Admin is not allowed to approve registration requests', 403));
});

exports.rejectRegistrationRequest = asyncHandler(async (req, res, next) => {
  // Registration rejections are handled by staff, not admin.
  return next(new AppError('Admin is not allowed to reject registration requests', 403));
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('User not found', 404));
  }

  if (String(targetUser._id) === String(req.user._id)) {
    return next(new AppError('You cannot delete your own admin account', 400));
  }

  // Admin can only deactivate staff accounts; students are managed by staff.
  if (targetUser.role !== 'staff') {
    return next(new AppError('Admin can only deactivate staff accounts', 403));
  }

  const reason = String(req.body.reason || '').trim();
  if (!reason) {
    return next(new AppError('Reason for deactivation is required', 400));
  }

  let emailSent = false;
  try {
    emailSent = await EmailService.sendUserRemovalEmail(targetUser, reason);
  } catch (error) {
    console.error('Failed to send user deactivation email:', error);
  }

  targetUser.isActive = false;
  targetUser.accountStatus = 'Suspended';
  await targetUser.save();

  await Notification.deleteMany({ recipient: targetUser._id });
  await RegistrationRequest.deleteMany({
    $or: [{ email: targetUser.email }, { createdUser: targetUser._id }]
  });

  res.status(200).json({
    success: true,
    message: 'Staff account deactivated successfully',
    emailSent
  });
});

exports.deleteComplaint = asyncHandler(async (req, res, next) => {
  // Admin is not allowed to delete complaints in the strict workflow.
  return next(new AppError('Admin is not allowed to delete complaints', 403));
});

exports.deleteRegistrationRequest = asyncHandler(async (req, res, next) => {
  const request = await RegistrationRequest.findById(req.params.id);
  if (!request) {
    return next(new AppError('Registration request not found', 404));
  }

  if (request.status === 'pending') {
    return next(new AppError('Cannot delete pending registration requests. Please approve or reject first.', 400));
  }

  await RegistrationRequest.deleteOne({ _id: request._id });

  res.status(200).json({
    success: true,
    message: 'Registration request deleted successfully'
  });
});
