require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@astu.edu.et' });
    const existingStaff = await User.findOne({ email: 'staff@astu.edu.et' });

    if (existingAdmin && existingStaff) {
      console.log('Admin and Staff users already exist!');
      console.log('\n=== LOGIN CREDENTIALS ===');
      console.log('\nADMIN:');
      console.log('Email: admin@astu.edu.et');
      console.log('Password: admin123');
      console.log('\nSTAFF:');
      console.log('Email: staff@astu.edu.et');
      console.log('Password: staff123');
      console.log('\n========================\n');
      process.exit(0);
    }

    // Create Admin user
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: 'admin@astu.edu.et',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created');
    }

    // Create Staff user
    if (!existingStaff) {
      await User.create({
        name: 'Staff User',
        email: 'staff@astu.edu.et',
        password: 'staff123',
        role: 'staff',
        department: 'Infrastructure & Maintenance'
      });
      console.log('✅ Staff user created');
    }

    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('\nADMIN:');
    console.log('Email: admin@astu.edu.et');
    console.log('Password: admin123');
    console.log('\nSTAFF:');
    console.log('Email: staff@astu.edu.et');
    console.log('Password: staff123');
    console.log('\nSTUDENT:');
    console.log('Register a new student account from the registration page');
    console.log('\n========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
