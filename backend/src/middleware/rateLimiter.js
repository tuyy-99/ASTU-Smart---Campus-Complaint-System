const rateLimit = require('express-rate-limit');

// Login rate limiter
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Complaint submission rate limiter
exports.complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 complaints per hour
  message: 'Too many complaints submitted, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Chatbot rate limiter
exports.chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many chatbot requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
