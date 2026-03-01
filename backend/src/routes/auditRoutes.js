const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

router.use(protect);
router.use(authorize('admin'));

router.get('/logs', auditController.getAuditLogs);
router.get('/logs/:id', auditController.getAuditLogById);
router.get('/export', auditController.exportAuditLogs);
router.get('/stats', auditController.getAuditStats);

module.exports = router;
