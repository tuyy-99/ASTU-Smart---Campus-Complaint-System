const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chatbotLimiter } = require('../middleware/rateLimiter');
const { chatbotValidation, validate, objectIdValidation } = require('../middleware/validator');
const chatbotController = require('../controllers/chatbotController');

router.get('/conversations', protect, chatbotController.getConversations);
router.post('/conversations', protect, chatbotController.createConversation);
router.get('/conversations/:id/messages', protect, objectIdValidation, validate, chatbotController.getMessages);
router.delete('/conversations/:id', protect, objectIdValidation, validate, chatbotController.clearConversation);
router.delete('/conversations', protect, chatbotController.clearAllConversations);
router.post('/', protect, chatbotLimiter, chatbotValidation, validate, chatbotController.handleChat);

module.exports = router;
