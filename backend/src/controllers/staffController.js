const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const EmailService = require('../services/emailService');
const crypto = require('crypto');

const generateAutoPassword = () => {
  // Generate a secure random password with uppercase, lowercase, numbers, and special chars
  const length = 8;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%&*!';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const ensureSameDepartment = (staff, student) => {
  if (!staff.department) {
    throw new AppError('Staff account has no department assigned', 400);
  }
  if (String(staff.department).trim() !== String(student.department || '').trim()) {
    throw new AppError('You can only manage students in your department', 403);
  }
};

exports.getDepartmentStudents = asyncHandler(async (req, res, next) => {
  if (!req.user.department) {
    return next(new AppError('Staff account has no department assigned', 400));
  }

  const students = await User.find({
    role: 'student',
    department: req.user.department
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: students.length,
    data: students
  });
});

exports.updateStudentDetails = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found', 404));
  }

  try {
    ensureSameDepartment(req.user, student);
  } catch (error) {
    return next(error);
  }

  const allowedFields = ['name', 'email'];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      student[field] = req.body[field];
    }
  }

  await student.save();

  res.status(200).json({
    success: true,
    data: student
  });
});

exports.suspendStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found', 404));
  }

  try {
    ensureSameDepartment(req.user, student);
  } catch (error) {
    return next(error);
  }

  if (student.accountStatus === 'Suspended') {
    return next(new AppError('Student account is already suspended', 400));
  }

  student.accountStatus = 'Suspended';
  student.isActive = false;
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student account suspended successfully',
    data: student
  });
});

exports.reactivateStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found', 404));
  }

  try {
    ensureSameDepartment(req.user, student);
  } catch (error) {
    return next(error);
  }

  student.accountStatus = 'Active';
  student.isActive = true;
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student account reactivated successfully',
    data: student
  });
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
  const request = await RegistrationRequest.findById(req.params.id);
  if (!request) {
    return next(new AppError('Registration request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new AppError('Registration request was already reviewed', 400));
  }

  const existingUserByEmail = await User.findOne({ email: request.email });
  if (existingUserByEmail) {
    return next(new AppError('A user with this email already exists', 400));
  }

  const existingUserByStudentId = await User.findOne({ studentId: request.studentId });
  if (existingUserByStudentId) {
    return next(new AppError('A user with this student ID already exists', 400));
  }

  const generatedPassword = generateAutoPassword();
  const student = await User.create({
    name: request.name,
    email: request.email,
    role: 'student',
    studentId: request.studentId,
    department: req.user.department,
    password: generatedPassword,
    accountStatus: 'Active'
  });

  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.createdUser = student._id;
  request.rejectionReason = undefined;
  await request.save();

  let emailSent = false;
  try {
    emailSent = await EmailService.sendRegistrationApprovedEmail(request, generatedPassword);
  } catch (error) {
    emailSent = false;
  }

  res.status(200).json({
    success: true,
    message: 'Registration request approved and student account created',
    generatedPassword,
    emailSent,
    data: request
  });
});

exports.rejectRegistrationRequest = asyncHandler(async (req, res, next) => {
  const request = await RegistrationRequest.findById(req.params.id);
  if (!request) {
    return next(new AppError('Registration request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new AppError('Registration request was already reviewed', 400));
  }

  const rejectionReason = String(req.body.rejectionReason || '').trim();

  if (!rejectionReason) {
    return next(new AppError('Rejection reason is required', 400));
  }

  if (rejectionReason.length < 10) {
    return next(new AppError('Rejection reason must be at least 10 characters', 400));
  }

  request.status = 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason;
  await request.save();

  let emailSent = false;
  try {
    emailSent = await EmailService.sendRegistrationRejectedEmail(request, rejectionReason);
  } catch (error) {
    emailSent = false;
  }

  res.status(200).json({
    success: true,
    message: 'Registration request rejected',
    emailSent,
    data: request
  });
});


exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found', 404));
  }

  try {
    ensureSameDepartment(req.user, student);
  } catch (error) {
    return next(error);
  }

  const reason = String(req.body.reason || '').trim();
  if (!reason) {
    return next(new AppError('Deletion reason is required', 400));
  }

  if (reason.length < 10) {
    return next(new AppError('Deletion reason must be at least 10 characters', 400));
  }

  const studentEmail = student.email;
  const studentName = student.name;

  await User.findByIdAndDelete(req.params.id);

  let emailSent = false;
  try {
    emailSent = await EmailService.sendAccountDeletionEmail(
      { email: studentEmail, name: studentName },
      reason
    );
  } catch (error) {
    emailSent = false;
  }

  res.status(200).json({
    success: true,
    message: 'Student account deleted successfully',
    emailSent
  });
});

exports.createStudent = asyncHandler(async (req, res, next) => {
  const { name, email, studentId } = req.body;

  if (!req.user.department) {
    return next(new AppError('Staff account has no department assigned', 400));
  }

  // Check if email already exists
  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return next(new AppError('A user with this email already exists', 400));
  }

  // Check if student ID already exists
  const normalizedStudentId = String(studentId).toUpperCase().trim();
  const existingUserByStudentId = await User.findOne({ studentId: normalizedStudentId });
  if (existingUserByStudentId) {
    return next(new AppError('A user with this student ID already exists', 400));
  }

  // Generate auto password
  const generatedPassword = generateAutoPassword();

  // Create student in staff's department
  const student = await User.create({
    name,
    email,
    role: 'student',
    studentId: normalizedStudentId,
    department: req.user.department,
    password: generatedPassword,
    accountStatus: 'Active',
    isActive: true
  });

  // Try to send email with credentials
  let emailSent = false;
  try {
    emailSent = await EmailService.sendStudentCredentialsEmail(student, generatedPassword);
  } catch (error) {
    emailSent = false;
  }

  res.status(201).json({
    success: true,
    message: 'Student account created successfully',
    generatedPassword,
    emailSent,
    data: student
  });
});
