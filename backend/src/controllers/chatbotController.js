const chatbotService = require('../services/chatbotService');
const { asyncHandler } = require('../utils/errorHandler');

exports.handleChat = asyncHandler(async (req, res, next) => {
  const { message, complaintId, conversationId } = req.body;
  const response = await chatbotService.processMessage(message, req.user, complaintId, conversationId);

  res.status(200).json({
    success: true,
    data: response
  });
});

exports.createConversation = asyncHandler(async (req, res, next) => {
  const conversation = await chatbotService.createConversation(req.user._id, req.user.role);

  res.status(201).json({
    success: true,
    data: conversation
  });
});

exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await chatbotService.getConversations(req.user._id, req.user.role);

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
  const payload = await chatbotService.getMessages(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: payload
  });
});

exports.clearConversation = asyncHandler(async (req, res, next) => {
  await chatbotService.clearConversation(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { message: 'Conversation cleared' }
  });
});

exports.clearAllConversations = asyncHandler(async (req, res, next) => {
  await chatbotService.clearAllConversations(req.user);

  res.status(200).json({
    success: true,
    data: { message: 'All conversations cleared' }
  });
});
