const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { protect, authorize } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const {
  complaintValidation,
  complaintUpdateValidation,
  validate,
  objectIdValidation,
  statusUpdateValidation,
  remarkValidation,
  complaintVerificationValidation
} = require('../middleware/validator');
const complaintController = require('../controllers/complaintController');

router.post(
  '/',
  protect,
  authorize('student'),
  complaintLimiter,
  upload.array('attachments', 5),
  complaintValidation,
  validate,
  complaintController.createComplaint
);

router.get('/', protect, complaintController.getComplaints);
router.get('/:id', protect, objectIdValidation, validate, complaintController.getComplaintById);
router.patch(
  '/:id',
  protect,
  objectIdValidation,
  complaintUpdateValidation,
  validate,
  complaintController.updateComplaint
);

router.patch(
  '/:id/status',
  protect,
  authorize('staff'),
  objectIdValidation,
  statusUpdateValidation,
  validate,
  complaintController.updateStatus
);

router.post(
  '/:id/remarks',
  protect,
  authorize('staff', 'admin'),
  objectIdValidation,
  remarkValidation,
  validate,
  complaintController.addRemark
);

router.patch(
  '/:id/verify',
  protect,
  authorize('student'),
  objectIdValidation,
  complaintVerificationValidation,
  validate,
  complaintController.verifyResolution
);

module.exports = router;
