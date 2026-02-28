const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../utils/errorHandler');

// @desc    Get public system statistics
// @route   GET /api/public/stats
// @access  Public
router.get('/stats', asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getComplaintStats();

  // Return public-safe statistics
  res.status(200).json({
    success: true,
    data: {
      totalComplaints: stats.totalComplaints,
      resolutionRate: stats.resolutionRate,
      resolvedComplaints: stats.complaintsByStatus.resolved || 0,
      averageResolutionTime: stats.averageResolutionTime,
      activeComplaints: (stats.complaintsByStatus.open || 0) + (stats.complaintsByStatus.in_progress || 0)
    }
  });
}));

// @desc    Public configuration health
// @route   GET /api/public/health
// @access  Public
router.get('/health', asyncHandler(async (req, res, next) => {
  const smtpConfigured = Boolean(
    (process.env.SMTP_SERVICE || (process.env.SMTP_HOST && process.env.SMTP_PORT)) &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  res.status(200).json({
    success: true,
    data: {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      smtpConfigured
    }
  });
}));

module.exports = router;
