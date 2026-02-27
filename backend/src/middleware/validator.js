const { body, param, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

exports.loginValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('studentId')
    .optional()
    .trim()
    .customSanitizer((value) => value ? value.toUpperCase() : value)
    .matches(/^UGR\/\d{5}\/\d{2}$/)
    .withMessage('Student ID must follow format UGR/00000/16'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  body()
    .custom((value) => {
      if (!value.email && !value.studentId) {
        throw new Error('Either email or student ID is required');
      }
      return true;
    })
];

exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

exports.resetPasswordValidation = [
  param('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.createUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['student', 'staff', 'admin']).withMessage('Invalid role'),
  body('studentId')
    .if(body('role').equals('student'))
    .trim()
    .notEmpty().withMessage('Student ID is required for students')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^UGR\/\d{5}\/\d{2}$/)
    .withMessage('Student ID must follow format UGR/00000/16'),
  body('department')
    .if(body('role').equals('staff'))
    .trim()
    .notEmpty().withMessage('Department is required for staff')
];

exports.registrationRequestValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('studentId')
    .trim()
    .notEmpty().withMessage('Student ID is required')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^UGR\/\d{5}\/\d{2}$/)
    .withMessage('Student ID must follow format UGR/00000/16')
];

exports.registrationDecisionValidation = [
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason cannot exceed 500 characters')
];

exports.complaintValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['academic', 'infrastructure', 'hostel', 'library', 'cafeteria', 'transport', 'other'])
    .withMessage('Invalid category'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
];

exports.complaintUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['academic', 'infrastructure', 'hostel', 'library', 'cafeteria', 'transport', 'other'])
    .withMessage('Invalid category'),
  body('department')
    .optional()
    .trim()
    .notEmpty().withMessage('Department cannot be empty'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body()
    .custom((value) => {
      const fields = ['title', 'description', 'category', 'department', 'priority'];
      const hasAtLeastOne = fields.some((field) => value && Object.prototype.hasOwnProperty.call(value, field));
      if (!hasAtLeastOne) {
        throw new Error('At least one field is required for update');
      }
      return true;
    })
];

exports.statusUpdateValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending_review', 'open', 'in_progress', 'resolved', 'rejected']).withMessage('Invalid status')
];

exports.bulkStatusUpdateValidation = [
  body('complaintIds')
    .isArray({ min: 1 }).withMessage('complaintIds must be a non-empty array'),
  body('complaintIds.*')
    .isMongoId().withMessage('Each complaint ID must be a valid Mongo ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending_review', 'open', 'in_progress', 'resolved', 'rejected']).withMessage('Invalid status')
];

exports.remarkValidation = [
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
];

exports.complaintVerificationValidation = [
  body('action')
    .trim()
    .notEmpty().withMessage('Action is required')
    .isIn(['confirm', 'reopen']).withMessage('Action must be confirm or reopen'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

exports.objectIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

exports.chatbotValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 500 }).withMessage('Message cannot be over 500 characters'),
  body('complaintId')
    .optional()
    .isMongoId().withMessage('complaintId must be a valid Mongo ID'),
  body('conversationId')
    .optional()
    .isMongoId().withMessage('conversationId must be a valid Mongo ID')
];

exports.roleUpdateValidation = [
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['student', 'staff', 'admin']).withMessage('Invalid role'),
  body('department')
    .if(body('role').equals('staff'))
    .notEmpty().withMessage('Department is required for staff')
];
