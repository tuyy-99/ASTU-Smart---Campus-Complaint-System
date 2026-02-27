const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  roleUpdateValidation,
  createUserValidation,
  bulkStatusUpdateValidation,
  registrationDecisionValidation,
  validate,
  objectIdValidation
} = require('../middleware/validator');
const adminController = require('../controllers/adminController');

router.use(protect, authorize('admin'));

// Read-only admin views
router.get('/complaints', adminController.getAllComplaints);
router.get('/complaints/export', adminController.exportComplaints);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getAllUsers);
router.get('/registration-requests', adminController.getRegistrationRequests);

// Limited staff management (create staff, deactivate staff)
router.post('/users', createUserValidation, validate, adminController.createUser);
router.delete('/users/:id', objectIdValidation, validate, adminController.deleteUser);

module.exports = router;
