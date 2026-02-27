const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, objectIdValidation, registrationDecisionValidation } = require('../middleware/validator');
const staffController = require('../controllers/staffController');

router.use(protect, authorize('staff'));

// Student management within staff member's department
router.get('/students', staffController.getDepartmentStudents);
router.post('/students', staffController.createStudent);
router.patch('/students/:id', objectIdValidation, validate, staffController.updateStudentDetails);
router.patch('/students/:id/suspend', objectIdValidation, validate, staffController.suspendStudent);
router.patch('/students/:id/reactivate', objectIdValidation, validate, staffController.reactivateStudent);
router.delete('/students/:id', objectIdValidation, validate, staffController.deleteStudent);

// Registration request workflow (handled by staff)
router.get('/registration-requests', staffController.getRegistrationRequests);
router.patch(
  '/registration-requests/:id/approve',
  objectIdValidation,
  validate,
  staffController.approveRegistrationRequest
);
router.patch(
  '/registration-requests/:id/reject',
  objectIdValidation,
  registrationDecisionValidation,
  validate,
  staffController.rejectRegistrationRequest
);

module.exports = router;

