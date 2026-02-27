const crypto = require('crypto');
const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendTokenResponse } = require('../utils/jwt');
const EmailService = require('../services/emailService');

// @desc    Public registration removed
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  return next(new AppError('Public registration is disabled. Please contact an administrator.', 403));
});

// @desc    Submit registration request
// @route   POST /api/auth/register-request
// @access  Public
exports.submitRegistrationRequest = asyncHandler(async (req, res, next) => {
  const { name, email, studentId } = req.body;

  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return next(new AppError('User already exists with this email', 400));
  }

  const normalizedStudentId = String(studentId || '').toUpperCase();
  const existingUserByStudentId = await User.findOne({ studentId: normalizedStudentId });
  if (existingUserByStudentId) {
    return next(new AppError('User already exists with this student ID', 400));
  }

  const existingPending = await RegistrationRequest.findOne({
    $or: [{ email }, { studentId: normalizedStudentId }],
    status: 'pending'
  });

  if (existingPending) {
    return next(new AppError('A pending registration request already exists for this student/email', 400));
  }

  if (!req.files || !req.files.idPhoto) {
    return next(new AppError('Student ID photo is required', 400));
  }

  const profilePhoto = req.files.profilePhoto?.[0];
  const idPhoto = req.files.idPhoto[0];

  const request = await RegistrationRequest.create({
    name,
    email,
    studentId: normalizedStudentId,
    profilePhotoPath: profilePhoto ? `uploads/registration-requests/${profilePhoto.filename}` : undefined,
    idPhotoPath: `uploads/registration-requests/${idPhoto.filename}`
  });

  const staffMembers = await User.find({ role: 'staff', isActive: true }).select('name email');
  const staffResults = await Promise.allSettled(
    staffMembers.map((staff) => EmailService.sendRegistrationRequestAlert(staff, request))
  );
  const staffAlertsSent = staffResults.filter((entry) => entry.status === 'fulfilled' && entry.value === true).length;
  const pendingEmailSent = await EmailService.sendRegistrationPendingEmail(request);

  res.status(201).json({
    success: true,
    message: 'Registration request submitted. Staff will review your student information and ID photo.',
    data: request,
    pendingEmailSent,
    staffAlertsSent
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, studentId } = req.body;
  
  let user;
  
  // If studentId is provided, login with student ID (for students)
  if (studentId) {
    const normalizedStudentId = String(studentId).toUpperCase().trim();
    user = await User.findOne({ studentId: normalizedStudentId }).select('+password');
  } 
  // Otherwise, login with email (for staff and admin)
  else if (email) {
    user = await User.findOne({ email }).select('+password');
  }

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 401));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.'
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${resetToken}`;

  try {
    await EmailService.sendPasswordResetEmail(user, resetUrl);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Unable to send reset email', 500));
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, a reset link has been sent.'
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires +password');

  if (!user) {
    return next(new AppError('Reset token is invalid or expired', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already in use', 400));
    }
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  // Optional profile photo upload
  if (req.file) {
    user.profilePhotoPath = `uploads/profile/${req.file.filename}`;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify current password
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Delete profile photo
// @route   DELETE /api/auth/profile-photo
// @access  Private
exports.deleteProfilePhoto = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Delete the file from filesystem if it exists
  if (user.profilePhotoPath) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../', user.profilePhotoPath);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting profile photo file:', error);
      }
    }
    
    user.profilePhotoPath = null;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Profile photo deleted successfully',
    data: user
  });
});
