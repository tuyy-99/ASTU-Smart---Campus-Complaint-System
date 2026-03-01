require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateStaffDepartment = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update the staff user's department
    const result = await User.updateOne(
      { email: 'staff@astu.edu.et', role: 'staff' },
      { $set: { department: 'Infrastructure & Maintenance' } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Staff user department updated to "Infrastructure & Maintenance"');
    } else {
      console.log('ℹ️  No staff user found or department already correct');
    }

    // Show the updated user
    const staff = await User.findOne({ email: 'staff@astu.edu.et' });
    if (staff) {
      console.log('\nUpdated Staff User:');
      console.log('Name:', staff.name);
      console.log('Email:', staff.email);
      console.log('Department:', staff.department);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating staff department:', error);
    process.exit(1);
  }
};

updateStaffDepartment();
