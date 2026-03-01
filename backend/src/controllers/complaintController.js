const Complaint = require('../models/Complaint');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const NotificationService = require('../services/notificationService');
const AuditService = require("../services/auditService");
const { extractFileText } = require('../utils/fileContentExtractor');
const { moderateComplaintCategory } = require('../utils/categoryModeration');
const { maskAnonymousCreator } = require("../utils/maskAnonymous");

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const canAccessComplaint = (user, complaint) => {
  if (!user || !user.role) return false;

  const role = String(user.role).toLowerCase();
  if (role === "admin" || role === "staff") return true;

  if (role === "student") {
    const createdById = complaint.createdBy?._id ?? complaint.createdBy;
    const userId = user._id ?? user.id;
    if (!createdById || !userId) return false;
    return String(createdById) === String(userId);
  }

  return false;
};

const validateStatusTransition = (current, next) => {
  // Staff can change status in any direction except from resolved/rejected back to pending_review
  const validStatuses = ['pending_review', 'open', 'in_progress', 'resolved', 'rejected'];
  
  if (!validStatuses.includes(next)) {
    return false;
  }
  
  // Can't go back to pending_review from resolved or rejected
  if (next === 'pending_review' && (current === 'resolved' || current === 'rejected')) {
    return false;
  }
  
  return true;
};

exports.createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, department, priority } = req.body;
  const isAnonymousRaw = req.body.isAnonymous;
  const isAnonymous =
    isAnonymousRaw === "true" ||
    isAnonymousRaw === true ||
    isAnonymousRaw === "1" ||
    isAnonymousRaw === 1;
  const moderation = moderateComplaintCategory({
    title,
    description,
    selectedCategory: category,
  });

  // Students cannot submit complaints unless their account is active.
  if (req.user.role === "student" && req.user.accountStatus !== "Active") {
    return next(
      new AppError("Only active student accounts can submit complaints", 403),
    );
  }

  const complaintData = {
    title,
    description,
    category: moderation.finalCategory,
    department,
    priority,
    createdBy: req.user._id,
    isAnonymous: isAnonymous === "true" || isAnonymous === true,
  };

  if (req.files && req.files.length > 0) {
    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const extractedText = await extractFileText(file);
        return {
          filename: file.filename || file.originalname,
          path: file.path || `uploads/complaints/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size,
          extractedText,
        };
      }),
    );

    complaintData.attachments = attachments;
  }

  const complaint = await Complaint.create(complaintData);
  await NotificationService.notifyComplaintCreated(complaint);

  // Log complaint creation
  await AuditService.log({
    userId: req.user._id,
    actorRole: req.user.role,
    action: 'COMPLAINT_CREATE',
    resource: 'complaint',
    resourceId: complaint._id,
    details: `Complaint submitted: ${complaint.title}`,
    metadata: { category: complaint.category, department: complaint.department },
    req
  });

  const populated = await Complaint.findById(complaint._id).populate(
    "createdBy",
    "name email role department studentId",
  );
  res.status(201).json({
    success: true,
    data: maskAnonymousCreator(populated),
    moderation,
  });
});

exports.updateComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError("Complaint not found", 404));
  }

  // Check if user has permission to edit
  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError("Not authorized to edit this complaint", 403));
  }

  // Students can only edit their own complaints
  if (
    req.user.role === "student" &&
    complaint.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new AppError("You can only edit your own complaints", 403));
  }

  const { title, description, category, department, priority } = req.body;

  if (title) complaint.title = title;
  if (description) complaint.description = description;
  if (category) complaint.category = category;
  if (department) complaint.department = department;
  if (priority) complaint.priority = priority;

  await complaint.save();

  // Log complaint update
  await AuditService.log({
    userId: req.user._id,
    actorRole: req.user.role,
    action: 'COMPLAINT_UPDATE',
    resource: 'complaint',
    resourceId: complaint._id,
    details: `Updated complaint: ${complaint.title}`,
    req
  });

  const updated = await Complaint.findById(complaint._id).populate(
    "createdBy",
    "name email role department studentId",
  );
  res.status(200).json({
    success: true,
    data: maskAnonymousCreator(updated),
  });
});

exports.getComplaints = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.user.role === "student") {
    query.createdBy = req.user._id;
  }
  // Staff and Admin can see all complaints

  const complaints = await Complaint.find(query)
    .populate("createdBy", "name email role department studentId")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    data: complaints.map(maskAnonymousCreator),
  });
});

exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("createdBy", "name email role department studentId")
    .populate("remarks.addedBy", "name role");

  if (!complaint) {
    return next(new AppError("Complaint not found", 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    await AuditService.log({
      userId: req.user._id,
      actorRole: req.user.role,
      action: 'UNAUTHORIZED_ACCESS',
      resource: 'complaint',
      resourceId: complaint._id,
      details: `Unauthorized access attempt to complaint`,
      status: 'Failed',
      req
    });
    return next(new AppError('Not authorized to access this complaint', 403));
  }

  res.status(200).json({
    success: true,
    data: maskAnonymousCreator(complaint),
  });
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError("Complaint not found", 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError("Not authorized to update this complaint", 403));
  }

  const { status, rejectionReason } = req.body;

  if (complaint.status === status) {
    return next(new AppError("Complaint already has this status", 400));
  }

  if (!validateStatusTransition(complaint.status, status)) {
    return next(new AppError("Invalid status transition", 400));
  }

  const oldStatus = complaint.status;

  // Only staff are allowed to change complaint status.
  if (req.user.role !== "staff") {
    return next(new AppError("Only staff can change complaint status", 403));
  }

  if (status === "rejected") {
    const reason = String(rejectionReason || "").trim();
    if (!reason) {
      return next(
        new AppError(
          "Rejection reason is required when rejecting a complaint",
          400,
        ),
      );
    }
    complaint.rejectionReason = reason;
  }

  complaint.status = status;
  if (status === "resolved") {
    complaint.resolutionVerification = {
      status: "pending",
      comment: undefined,
      verifiedBy: undefined,
      verifiedAt: undefined,
    };
  }
  await complaint.save();

  await NotificationService.notifyStatusUpdate(complaint, oldStatus, status);

  // Log status update
  await AuditService.log({
    userId: req.user._id,
    actorRole: req.user.role,
    action: 'COMPLAINT_STATUS_UPDATE',
    resource: 'complaint',
    resourceId: complaint._id,
    details: `Changed complaint status from ${oldStatus} to ${status}`,
    metadata: { oldStatus, newStatus: status },
    req
  });

  const updated = await Complaint.findById(complaint._id).populate(
    "createdBy",
    "name email role department studentId",
  );
  res.status(200).json({
    success: true,
    data: maskAnonymousCreator(updated),
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

  if (action === "confirm") {
    complaint.resolutionVerification = {
      status: "confirmed",
      comment: comment || undefined,
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    };

    await complaint.save();
    await NotificationService.notifyResolutionConfirmed(
      complaint,
      req.user,
      comment,
    );

    // Log resolution confirmation
    await AuditService.log({
      userId: req.user._id,
      action: "COMPLAINT_RESOLUTION_CONFIRMED",
      resource: "complaint",
      resourceId: complaint._id,
      details: `Confirmed resolution of complaint`,
      req,
    });

    const populated = await Complaint.findById(complaint._id).populate(
      "createdBy",
      "name email role department studentId",
    );
    return res.status(200).json({
      success: true,
      data: maskAnonymousCreator(populated),
    });
  }

  if (action === "reopen") {
    complaint.status = "in_progress";
    complaint.resolutionVerification = {
      status: "reopened",
      comment: comment || undefined,
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    };

    await complaint.save();
    await NotificationService.notifyComplaintReopened(
      complaint,
      req.user,
      comment,
    );

    // Log complaint reopening
    await AuditService.log({
      userId: req.user._id,
      action: "COMPLAINT_REOPENED",
      resource: "complaint",
      resourceId: complaint._id,
      details: `Reopened complaint`,
      req,
    });

    const populatedReopen = await Complaint.findById(complaint._id).populate(
      "createdBy",
      "name email role department studentId",
    );
    return res.status(200).json({
      success: true,
      data: maskAnonymousCreator(populatedReopen),
    });
  }

  return next(new AppError('Invalid verification action', 400));
});

exports.addRemark = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new AppError("Complaint not found", 404));
  }

  if (!canAccessComplaint(req.user, complaint)) {
    return next(new AppError("Not authorized to update this complaint", 403));
  }

  const remark = {
    comment: req.body.comment,
    addedBy: req.user._id,
  };

  complaint.remarks.push(remark);
  await complaint.save();

  await NotificationService.notifyRemarkAdded(complaint, remark);

  // Log remark addition
  await AuditService.log({
    userId: req.user._id,
    action: "COMPLAINT_REMARK_ADDED",
    resource: "complaint",
    resourceId: complaint._id,
    details: `Added remark to complaint`,
    req,
  });

  const withCreator = await Complaint.findById(complaint._id)
    .populate("createdBy", "name email role department studentId")
    .populate("remarks.addedBy", "name role");
  res.status(200).json({
    success: true,
    data: maskAnonymousCreator(withCreator),
  });
});

