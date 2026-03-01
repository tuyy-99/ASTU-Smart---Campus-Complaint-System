/**
 * DEMO ONLY: Inserts sample audit log entries for UI preview.
 * Does NOT delete existing logs. For real-world data only, do not run this script;
 * use clearAuditLogs.js to remove seeded data, then use the app normally.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const AuditLog = require('./src/models/AuditLog');
const User = require('./src/models/User');

async function seedAuditLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await AuditLog.countDocuments();
    if (existingCount > 0) {
      console.log(`Audit log already has ${existingCount} entries. Skipping seed to preserve real data.`);
      console.log('To start with demo data only, run: node clearAuditLogs.js first.');
      await mongoose.connection.close();
      return;
    }

    // Get an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Found admin: ${admin.name} (${admin.email})`);

    // Create sample audit logs (demo only)
    const sampleLogs = [
      {
        user: admin._id,
        action: 'LOGIN',
        resource: 'auth',
        details: 'Admin logged in successfully',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        user: admin._id,
        action: 'USER_CREATED',
        resource: 'user',
        details: 'Created staff account: John Doe (john@astu.edu.et)',
        metadata: { role: 'staff', department: 'IT Services' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        user: admin._id,
        action: 'REGISTRATION_APPROVED',
        resource: 'registration',
        details: 'Approved registration for Jane Smith (UGR/12345/16)',
        metadata: { studentId: 'UGR/12345/16', email: 'jane@student.astu.edu.et' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        user: admin._id,
        action: 'COMPLAINT_STATUS_UPDATE',
        resource: 'complaint',
        details: 'Changed complaint status from pending_review to in_progress',
        metadata: { oldStatus: 'pending_review', newStatus: 'in_progress' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        user: admin._id,
        action: 'PASSWORD_CHANGE',
        resource: 'auth',
        details: 'User changed password',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    ];

    // Insert sample logs (no delete - preserves any existing real data)
    const inserted = await AuditLog.insertMany(sampleLogs);
    console.log(`\nCreated ${inserted.length} sample audit logs:`);
    
    inserted.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} - ${log.details}`);
    });

    // Verify
    const count = await AuditLog.countDocuments();
    console.log(`\nTotal audit logs in database: ${count}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('✓ Audit logs seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedAuditLogs();
