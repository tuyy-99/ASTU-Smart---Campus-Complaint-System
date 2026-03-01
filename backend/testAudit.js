const mongoose = require('mongoose');
require('dotenv').config();

const AuditLog = require('./src/models/AuditLog');

async function testAudit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if there are any audit logs
    const count = await AuditLog.countDocuments();
    console.log(`Total audit logs: ${count}`);

    // Get recent logs
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('\nRecent audit logs:');
    logs.forEach(log => {
      console.log(`- ${log.action} by ${log.user?.name || 'Unknown'} at ${log.createdAt}`);
    });

    // Create a test log
    const testLog = await AuditLog.create({
      user: null,
      action: 'TEST_ACTION',
      resource: 'test',
      details: 'Test audit log entry',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script'
    });

    console.log('\nTest log created:', testLog._id);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAudit();
