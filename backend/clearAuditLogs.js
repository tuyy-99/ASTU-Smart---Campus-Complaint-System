/**
 * Clears all audit log entries. Use this when you want the Audit Log page
 * to show only real-world data from actual user actions (logins, complaints,
 * registration approvals, etc.). After running, new activity in the app
 * will create real audit entries.
 *
 * Run from backend folder: node clearAuditLogs.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const AuditLog = require('./src/models/AuditLog');

async function clearAuditLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const deleted = await AuditLog.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} audit log entries.`);
    console.log('From now on, only real actions in the app will be recorded in Audit Logs.');

    await mongoose.connection.close();
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearAuditLogs();
