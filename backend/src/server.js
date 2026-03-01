const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const app = require('./app');
const EmailService = require('./services/emailService');
const socketService = require('./services/socketService');

dotenv.config();

mongoose.set('sanitizeFilter', true);

const PORT = process.env.PORT || 5000;

const printStartupDiagnostics = async () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[startup] GEMINI_API_KEY is missing. Chatbot responses will fail.');
  } else {
    console.log('[startup] Gemini API key detected.');
  }

  const smtpConfigured =
    ((process.env.SMTP_SERVICE || (process.env.SMTP_HOST && process.env.SMTP_PORT)) &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS);

  if (!smtpConfigured) {
    console.warn('[startup] SMTP settings are incomplete. Email notifications are disabled.');
  } else {
    const verify = await EmailService.verifyConnection();
    if (verify.ok) {
      console.log('[startup] SMTP configuration detected and verified.');
    } else {
      console.warn(`[startup] SMTP configured but verification failed: ${verify.reason}`);
    }
  }
};

const startServer = async () => {
  await connectDB();
  await printStartupDiagnostics();
  
  const server = http.createServer(app);
  socketService.initialize(server);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
  });
};

startServer();
