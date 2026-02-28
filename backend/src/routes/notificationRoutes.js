const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { objectIdValidation, validate } = require('../middleware/validator');
const notificationController = require('../controllers/notificationController');

router.get('/', protect, notificationController.getMyNotifications);
router.patch('/:id/read', protect, objectIdValidation, validate, notificationController.markAsRead);
router.patch('/read-all', protect, notificationController.markAllAsRead);

module.exports = router;
