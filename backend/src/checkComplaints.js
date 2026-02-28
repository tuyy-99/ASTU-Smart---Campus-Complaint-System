require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

const checkComplaints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const complaints = await Complaint.find()
      .select('title department status createdAt')
      .sort({ createdAt: -1 });

    console.log(`Total Complaints: ${complaints.length}\n`);
    console.log('=== ALL COMPLAINTS ===');
    complaints.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`);
      console.log(`   Department: ${c.department}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Created: ${c.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Group by department
    const byDepartment = {};
    complaints.forEach(c => {
      if (!byDepartment[c.department]) {
        byDepartment[c.department] = 0;
      }
      byDepartment[c.department]++;
    });

    console.log('=== COMPLAINTS BY DEPARTMENT ===');
    Object.entries(byDepartment).forEach(([dept, count]) => {
      console.log(`${dept}: ${count} complaint(s)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkComplaints();
