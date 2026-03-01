const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const PREFIX = { complaint: 'CMP', user: 'USR', registration: 'REG', profile: 'USR', auth: 'AUTH' };

function toTargetIdDisplay(resource, resourceId) {
  if (!resourceId) return null;
  const id = String(resourceId);
  const prefix = PREFIX[resource] || 'RES';
  const year = new Date().getFullYear();
  const suffix = id.length >= 6 ? id.slice(-6) : id;
  return `${prefix}-${year}-${suffix}`;
}

class AuditService {
  static async log({
    userId,
    actorRole,
    action,
    resource,
    resourceId,
    targetIdDisplay,
    details,
    metadata,
    status = 'Success',
    correlationId,
    req
  }) {
    try {
      const ipAddress = req?.ip || req?.connection?.remoteAddress;
      const userAgent = req?.get ? req.get('user-agent') : (req?.headers && req.headers['user-agent']);

      await AuditLog.create({
        user: userId || undefined,
        actorRole: actorRole || undefined,
        action,
        resource,
        resourceId: resourceId || undefined,
        targetIdDisplay: targetIdDisplay || toTargetIdDisplay(resource, resourceId),
        details,
        metadata,
        status: status === 'Failed' ? 'Failed' : 'Success',
        correlationId: correlationId || undefined,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  static async getAuditLogs({
    page = 1,
    limit = 50,
    userId,
    action,
    resource,
    actorRole,
    status,
    startDate,
    endDate,
    search
  }) {
    const query = {};

    if (userId) query.user = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (actorRole) query.actorRole = actorRole;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search && String(search).trim()) {
      const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(term, 'i');
      const matchUserIds = await User.find({
        $or: [
          { email: regex },
          { name: regex },
          { studentId: regex }
        ]
      })
        .select('_id')
        .lean();
      const ids = matchUserIds.map((u) => u._id);
      query.$or = [
        { targetIdDisplay: regex },
        ...(ids.length ? [{ user: { $in: ids } }] : [])
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getAuditLogById(id) {
    const log = await AuditLog.findById(id)
      .populate('user', 'name email role studentId department')
      .lean();
    return log;
  }

  static async exportAuditLogsCSV({
    action,
    resource,
    actorRole,
    status,
    startDate,
    endDate,
    search,
    limit = 10000
  }) {
    const query = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (actorRole) query.actorRole = actorRole;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search && String(search).trim()) {
      const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(term, 'i');
      const matchUserIds = await User.find({
        $or: [{ email: regex }, { name: regex }, { studentId: regex }]
      })
        .select('_id')
        .lean();
      const ids = matchUserIds.map((u) => u._id);
      query.$or = [
        { targetIdDisplay: regex },
        ...(ids.length ? [{ user: { $in: ids } }] : [])
      ];
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role studentId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const header = [
      'Audit ID',
      'Timestamp (UTC)',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Action',
      'Target Entity',
      'Target ID',
      'Description',
      'Status',
      'IP Address',
      'Correlation ID'
    ];
    const rows = logs.map((log) => [
      log._id,
      log.createdAt ? new Date(log.createdAt).toISOString() : '',
      (log.user && log.user.name) || '',
      (log.user && log.user.email) || '',
      log.actorRole || (log.user && log.user.role) || '',
      log.action || '',
      log.resource || '',
      log.targetIdDisplay || '',
      (log.details || '').replace(/"/g, '""'),
      log.status || 'Success',
      log.ipAddress || '',
      log.correlationId || ''
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.map((c) => `"${String(c)}"`).join(','))].join('\n');
    return csv;
  }

  static async getAuditStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, actionStats, resourceStats] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      totalLogs,
      todayLogs,
      actionStats,
      resourceStats
    };
  }
}

module.exports = AuditService;
