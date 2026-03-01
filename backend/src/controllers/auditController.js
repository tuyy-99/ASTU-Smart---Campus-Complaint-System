const AuditService = require('../services/auditService');
const { AppError } = require('../utils/errorHandler');

// @desc    Get audit logs (paginated, filterable)
// @route   GET /api/audit/logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, userId, action, resource, actorRole, status, startDate, endDate, search } = req.query;

    const result = await AuditService.getAuditLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      userId,
      action,
      resource,
      actorRole,
      status,
      startDate,
      endDate,
      search: search ? String(search).trim() : undefined
    });

    res.status(200).json({
      success: true,
      data: {
        logs: result.logs,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single audit log by ID (for detail modal)
// @route   GET /api/audit/logs/:id
// @access  Private/Admin
exports.getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditService.getAuditLogById(req.params.id);
    if (!log) {
      return next(new AppError('Audit log not found', 404));
    }
    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export audit logs as CSV
// @route   GET /api/audit/export
// @access  Private/Admin
exports.exportAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, actorRole, status, startDate, endDate, search } = req.query;

    const csv = await AuditService.exportAuditLogsCSV({
      action,
      resource,
      actorRole,
      status,
      startDate,
      endDate,
      search: search ? String(search).trim() : undefined
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private/Admin
exports.getAuditStats = async (req, res, next) => {
  try {
    const stats = await AuditService.getAuditStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
