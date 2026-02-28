const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../utils/errorHandler');
const Complaint = require('../models/Complaint');
const ChatMessage = require('../models/ChatMessage');
const ChatConversation = require('../models/ChatConversation');

const DEFAULT_HISTORY_LIMIT = 12;
const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const hasAllDepartmentsAccess = (department) => {
  const value = normalizeText(department);
  return value === 'all departments' || value === 'all' || value === '*';
};

class ChatbotService {
  generateConversationTitle(seedText = '') {
    if (!seedText || !seedText.trim()) {
      return 'New Chat';
    }

    const cleanText = seedText.trim();
    const questionEnd = cleanText.indexOf('?');
    const sentenceEnd = cleanText.indexOf('.');
    const questionLimit = questionEnd > 0 ? questionEnd + 1 : cleanText.length;
    const sentenceLimit = sentenceEnd > 0 ? sentenceEnd + 1 : cleanText.length;
    const endIndex = Math.min(cleanText.length, 50, questionLimit, sentenceLimit);

    let title = cleanText.slice(0, endIndex);
    if (cleanText.length > endIndex) {
      title += '...';
    }

    return title || 'New Chat';
  }

  async processMessage(message, user, complaintId, conversationId) {
    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('Gemini API key not configured', 500);
    }

    const conversation = await this.resolveConversation(user, conversationId, message);
    const complaints = await this.getScopedComplaints(user, complaintId);
    const history = await this.getConversationHistory(user, conversation._id);
    const responseText = await this.callGeminiAPI(message, user, complaints, history);

    await this.saveConversation(message, responseText, user, complaintId, complaints, conversation);

    return {
      conversationId: conversation._id,
      message: responseText,
      timestamp: new Date()
    };
  }

  async resolveConversation(user, conversationId, firstMessageText = '') {
    if (conversationId) {
      const existing = await ChatConversation.findOne({ _id: conversationId, user: user._id, roleScope: user.role });
      if (!existing) {
        throw new AppError('Conversation not found', 404);
      }
      return existing;
    }

    return await this.createConversation(user._id, user.role, firstMessageText);
  }

  async createConversation(userId, roleScope, seedText = '') {
    const title = this.generateConversationTitle(seedText);

    return await ChatConversation.create({
      user: userId,
      roleScope,
      title
    });
  }

  async getConversations(userId, roleScope) {
    return await ChatConversation.find({ user: userId, roleScope })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .select('title lastMessage lastMessageAt messageCount createdAt updatedAt');
  }

  async getMessages(user, conversationId) {
    const conversation = await ChatConversation.findOne({ _id: conversationId, user: user._id, roleScope: user.role });
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const messages = await ChatMessage.find({ user: user._id, roleScope: user.role, conversation: conversationId })
      .sort({ createdAt: 1 })
      .select('role message createdAt');

    return {
      conversation,
      messages
    };
  }

  async clearConversation(user, conversationId) {
    const conversation = await ChatConversation.findOne({ _id: conversationId, user: user._id, roleScope: user.role });
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    await ChatMessage.deleteMany({ user: user._id, roleScope: user.role, conversation: conversationId });
    await ChatConversation.deleteOne({ _id: conversationId, user: user._id, roleScope: user.role });
  }

  async clearAllConversations(user) {
    await ChatMessage.deleteMany({ user: user._id, roleScope: user.role });
    await ChatConversation.deleteMany({ user: user._id, roleScope: user.role });
  }

  async getScopedComplaints(user, complaintId) {
    const query = {};

    if (complaintId) {
      query._id = complaintId;
    }

    if (user.role === 'student') {
      query.createdBy = user._id;
    } else if (user.role === 'staff') {
      if (!hasAllDepartmentsAccess(user.department)) {
        query.department = user.department;
      }
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .limit(complaintId ? 1 : 20)
      .select('title description category department priority status remarks attachments createdAt updatedAt resolvedAt');

    if (complaintId && complaints.length === 0) {
      throw new AppError('Complaint not found or not accessible', 404);
    }

    return complaints.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      description: item.description,
      category: item.category,
      department: item.department,
      priority: item.priority,
      status: item.status,
      remarks: item.remarks.map((r) => ({
        comment: r.comment,
        addedAt: r.addedAt
      })),
      attachments: item.attachments.map((file) => ({
        filename: file.filename,
        mimetype: file.mimetype,
        extractedText: file.extractedText || null,
        uploadedAt: file.uploadedAt
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      resolvedAt: item.resolvedAt || null
    }));
  }

  async getConversationHistory(user, conversationId) {
    const historyLimit = Number.parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || DEFAULT_HISTORY_LIMIT;
    const query = { user: user._id, roleScope: user.role, conversation: conversationId };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(historyLimit)
      .select('role message createdAt');

    return messages.reverse().map((entry) => ({
      role: entry.role,
      message: entry.message,
      createdAt: entry.createdAt
    }));
  }

  async saveConversation(userMessage, assistantMessage, user, complaintId, complaints, conversation) {
    const contextComplaintIds = complaints.map((item) => item.id);

    await ChatMessage.create({
      conversation: conversation._id,
      user: user._id,
      roleScope: user.role,
      role: 'user',
      message: userMessage,
      complaintId: complaintId || undefined,
      contextComplaintIds
    });

    await ChatMessage.create({
      conversation: conversation._id,
      user: user._id,
      roleScope: user.role,
      role: 'assistant',
      message: assistantMessage,
      complaintId: complaintId || undefined,
      contextComplaintIds
    });

    const updates = {
      lastMessage: assistantMessage,
      lastMessageAt: new Date()
    };

    // If this conversation was created from the "New Chat" button, promote
    // the first real user message into a meaningful conversation title.
    if (!conversation.messageCount && conversation.title === 'New Chat') {
      updates.title = this.generateConversationTitle(userMessage);
    }

    await ChatConversation.updateOne(
      { _id: conversation._id, user: user._id, roleScope: user.role },
      {
        $set: updates,
        $inc: { messageCount: 2 }
      }
    );
  }

  async callGeminiAPI(message, user, complaints, history) {
    const restrictedReply = this.getRoleGuardrailReply(message, user.role);
    if (restrictedReply) {
      return restrictedReply;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    const rolePolicy = this.getRolePolicy(user);

    const prompt = `
You are the ASTU Smart Complaint System Assistant - a specialized AI helper ONLY for the ASTU (Adama Science and Technology University) Smart Complaint & Issue Tracking System.

STRICT SCOPE - You can ONLY help with:
1. How to use the ASTU complaint system (submitting complaints, tracking status, categories, etc.)
2. Explaining complaint workflows and processes
3. Answering questions about specific complaints the user has access to
4. Guiding users through the complaint management features
5. Explaining complaint categories: academic, infrastructure, hostel, library, cafeteria, transport, other
6. Explaining complaint statuses: open, in_progress, resolved
7. How to check complaint history and notifications
8. Department-specific complaint information

FORMATTING RULES:
- Use **bold** for important terms (e.g., **Submission**, **In Progress**)
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Keep responses clear and concise
- Use line breaks between sections for readability

IMPORTANT RESTRICTIONS:
- DO NOT answer questions about assignments, homework, or academic subjects
- DO NOT provide information about Bitcoin, cryptocurrency, or any unrelated topics
- DO NOT help with general knowledge questions outside the complaint system
- DO NOT provide study help or tutoring
- If asked about anything outside the complaint system scope, politely respond: "I'm the ASTU Smart Complaint System Assistant. I can only help with questions about submitting, tracking, and managing campus complaints. Please ask me about the complaint system features."

ROLE PERMISSIONS (MUST FOLLOW STRICTLY):
${rolePolicy}

User role: ${user.role}
User message: ${message}

Conversation history:
${JSON.stringify(history)}

User's complaint data (if available):
${JSON.stringify(complaints)}

Remember: Stay focused ONLY on the ASTU complaint system. Politely redirect any off-topic questions.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  getRolePolicy(user) {
    if (user.role === 'admin') {
      return `- You may discuss system-wide complaint insights and cross-department workflows.
- You may explain analytics and user-role administration features.
- You may summarize trends from available complaint context.
- Do not claim actions were executed unless explicitly confirmed.`;
    }

    if (user.role === 'staff') {
      return `- You may discuss ONLY department-level complaint workflows relevant to staff.
- You may guide status updates and remark usage for staff duties.
- You MUST NOT provide system-wide analytics or cross-department details not in accessible context.
- If asked for admin-only capabilities, refuse and redirect to staff-available actions.`;
    }

    return `- You may discuss ONLY the student's own complaint submission, tracking, and status understanding.
- You MUST NOT provide department queues, other users' complaints, staff/admin workflows, or user-role management guidance as executable tasks.
- If asked for restricted data or admin/staff capabilities, refuse and explain that access is role-limited.`;
  }

  getRoleGuardrailReply(message, role) {
    const text = (message || '').trim().toLowerCase();

    if (/^(hi|hello|hey|good morning|good afternoon|good evening|selam)([!. ]*)$/.test(text)) {
      if (role === 'admin') {
        return "Hello. I can help with **admin** tasks in this project like complaint analytics, cross-department monitoring, and role-management guidance.";
      }
      if (role === 'staff') {
        return "Hello. I can help with **staff** workflow in this project: department complaints, status updates, and remarks.";
      }
      return "Hello. I can help with **student** tasks in this project: submitting complaints, tracking status, and understanding updates.";
    }

    if (role === 'student') {
      const blocked = /(all complaints|department complaints|other students|staff complaints|analytics|user roles|assign complaint|department performance)/i;
      if (blocked.test(text)) {
        return "I can only help with your own complaint submission and tracking as a **student**. I can't provide department-wide, other users', or admin/staff-level complaint data.";
      }
    }

    if (role === 'staff') {
      const blocked = /(all departments|system-wide analytics|global analytics|manage user roles|promote user|demote user)/i;
      if (blocked.test(text)) {
        return "Your current access is **staff-level**. I can help with department complaint workflow, status updates, and remarks, but not admin-only analytics or role management.";
      }
    }

    return null;
  }
}

module.exports = new ChatbotService();
