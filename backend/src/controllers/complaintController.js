const Complaint = require('../models/Complaint');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const NotificationService = require('../services/notificationService');
const { extractFileText } = require('../utils/fileContentExtractor');
const { moderateComplaintCategory } = require('../utils/categoryModeration');

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const canAccessComplaint = (user, complaint) => {
  if (user.role === 'admin') return true;
  
  // Handle both populated and non-populated createdBy
  const createdById = complaint.createdBy?._id || complaint.createdBy;
  if (user.role === 'student') return createdById.toString() === user._id.toString();
  
  if (user.role === 'staff') {
    // Staff are strictly limited to their own department.
    return normalizeText(complaint.department) === normalizeText(user.department);
  }
  return false;
};

const validateStatusTransition = (current, next) => {
  const transitions = {
    pending_review: ['open', 'rejected'],
    open: ['in_progress', 'rejected'],
    in_progress: ['resolved', 'rejected'],
    resolved: [],
    rejected: []
  };
  return transitions[current] && transitions[current].includes(next);
};

exports.createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, department, priority, isAnonymous } = req.body;
  const moderation = moderateComplaintCategory({
    title,
    description,
    selectedCategory: category
  });

  // Students cannot submit complaints unless their account is active.
  if (req.user.role === 'student' && req.user.accountStatus !== 'Active') {
    return next(new AppError('Only active student accounts can submit complaints', 403));
  }

  const complaintData = {
    title,
    description,
    category: moderation.finalCategory,
    department,
    priority,
    createdBy: req.user._id,
    isAnonymous: isAnonymous === 'true' || isAnonymous === true
  };

  if (req.files && req.files.length > 0) {
    const attachments = await Promise.all(req.files.map(async (file) => {
      const extractedText = await extractFileText(file);
      return {
        filename: file.filename || file.originalname,
        path: file.path || `uploads/complaints/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        extractedText
      };
    }));

    complaintData.attachments = attachments;
  }

  const complaint = await Complaint.create(complaintData);
  await NotificationService.notifyComplaintCreated(complaint);

  res.status(201).json({
    success: true,
    data: complaint,
    moderation
  });
});

exports.updateComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  // In the strict workflow, students cannot edit complaints after submission.
  if (req.user.role === 'student') {
    return next(new AppError('Students cannot edit complaints after submission', 403));
  }

  return next(new AppError('Complaint editing is not allowed in the current workflow', 403));
});

exports.getComplaints = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.user.role === 'student') {
    query.createdBy = req.user._id;
  } else if (req.user.role === 'staff') {
    const normalizedDepartment = String(req.user.department || '').trim().replace(/\s+/g, ' ');
    if (!normalizedDepartment) {
      return next(new AppError('Staff account has no department assigned', 400));
    }

    const safeDepartment = escapeRegex(normalizedDepartment).replace(/\s+/g, '\\s+');
    query.department = new RegExp(`^\\s*${safeDepartment}\\s*$`, 'i');
  }

  const complaints = await Complaint.find(query)
    .populate('createdBy', 'name email role department')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    data: complaints
  });
});

exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('createdBy', 'name email role department')
    .populate('remarks.addedBy', 'name role');

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError('Not authorized to access this complaint', 403));
  }

  res.status(200).json({
    success: true,
    data: complaint
  });
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError('Not authorized to update this complaint', 403));
  }

  const { status, rejectionReason } = req.body;

  if (complaint.status === status) {
    return next(new AppError('Complaint already has this status', 400));
  }

  if (!validateStatusTransition(complaint.status, status)) {
    return next(new AppError('Invalid status transition', 400));
  }

  const oldStatus = complaint.status;

  // Only staff are allowed to change complaint status.
  if (req.user.role !== 'staff') {
    return next(new AppError('Only staff can change complaint status', 403));
  }

  if (status === 'rejected') {
    const reason = String(rejectionReason || '').trim();
    if (!reason) {
      return next(new AppError('Rejection reason is required when rejecting a complaint', 400));
    }
    complaint.rejectionReason = reason;
  }

  complaint.status = status;
  if (status === 'resolved') {
    complaint.resolutionVerification = {
      status: 'pending',
      comment: undefined,
      verifiedBy: undefined,
      verifiedAt: undefined
    };
  }
  await complaint.save();

  await NotificationService.notifyStatusUpdate(complaint, oldStatus, status);

  res.status(200).json({
    success: true,
    data: complaint
  });
});

exports.verifyResolution = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to verify this complaint', 403));
  }

  if (complaint.status !== 'resolved') {
    return next(new AppError('Only resolved complaints can be verified', 400));
  }

  const action = String(req.body.action || '').trim();
  const comment = String(req.body.comment || '').trim();

  if (action === 'confirm') {
    complaint.resolutionVerification = {
      status: 'confirmed',
      comment: comment || undefined,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    await complaint.save();
    await NotificationService.notifyResolutionConfirmed(complaint, req.user, comment);

    return res.status(200).json({
      success: true,
      data: complaint
    });
  }

  if (action === 'reopen') {
    complaint.status = 'in_progress';
    complaint.resolutionVerification = {
      status: 'reopened',
      comment: comment || undefined,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    await complaint.save();
    await NotificationService.notifyComplaintReopened(complaint, req.user, comment);

    return res.status(200).json({
      success: true,
      data: complaint
    });
  }

  return next(new AppError('Invalid verification action', 400));
});

exports.addRemark = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError('Not authorized to update this complaint', 403));
  }

  const remark = {
    comment: req.body.comment,
    addedBy: req.user._id
  };

  complaint.remarks.push(remark);
  await complaint.save();

  await NotificationService.notifyRemarkAdded(complaint, remark);

  res.status(200).json({
    success: true,
    data: complaint
  });
});
