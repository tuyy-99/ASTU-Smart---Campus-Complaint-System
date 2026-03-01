const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./src/models/User');
const RegistrationRequest = require('./src/models/RegistrationRequest');
const Complaint = require('./src/models/Complaint');
const { cloudinary } = require('./src/config/cloudinary');

async function uploadToCloudinary(localPath, folder) {
  try {
    const fullPath = path.join(__dirname, localPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      return null;
    }

    console.log(`Uploading ${localPath} to Cloudinary...`);
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: folder,
      resource_type: 'auto'
    });

    console.log(`✓ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading ${localPath}:`, error.message);
    return null;
  }
}

async function migrateUsers() {
  console.log('\n=== Migrating User Profile Photos ===');
  const users = await User.find({ profilePhotoPath: { $exists: true, $ne: null } });
  
  let migrated = 0;
  for (const user of users) {
    // Skip if already a Cloudinary URL
    if (user.profilePhotoPath.includes('cloudinary.com')) {
      console.log(`Skipping ${user.name} - already on Cloudinary`);
      continue;
    }

    const cloudinaryUrl = await uploadToCloudinary(user.profilePhotoPath, 'astu-complaints/profile');
    if (cloudinaryUrl) {
      user.profilePhotoPath = cloudinaryUrl;
      await user.save();
      migrated++;
      console.log(`✓ Updated user: ${user.name}`);
    }
  }
  
  console.log(`\nMigrated ${migrated} user profile photos`);
}

async function migrateRegistrationRequests() {
  console.log('\n=== Migrating Registration Request Photos ===');
  const requests = await RegistrationRequest.find({
    $or: [
      { profilePhotoPath: { $exists: true, $ne: null } },
      { idPhotoPath: { $exists: true, $ne: null } }
    ]
  });
  
  let migrated = 0;
  for (const request of requests) {
    let updated = false;

    // Migrate profile photo
    if (request.profilePhotoPath && !request.profilePhotoPath.includes('cloudinary.com')) {
      const cloudinaryUrl = await uploadToCloudinary(request.profilePhotoPath, 'astu-complaints/registration-requests');
      if (cloudinaryUrl) {
        request.profilePhotoPath = cloudinaryUrl;
        updated = true;
      }
    }

    // Migrate ID photo
    if (request.idPhotoPath && !request.idPhotoPath.includes('cloudinary.com')) {
      const cloudinaryUrl = await uploadToCloudinary(request.idPhotoPath, 'astu-complaints/registration-requests');
      if (cloudinaryUrl) {
        request.idPhotoPath = cloudinaryUrl;
        updated = true;
      }
    }

    if (updated) {
      await request.save();
      migrated++;
      console.log(`✓ Updated registration request: ${request.name}`);
    }
  }
  
  console.log(`\nMigrated ${migrated} registration requests`);
}

async function migrateComplaints() {
  console.log('\n=== Migrating Complaint Attachments ===');
  const complaints = await Complaint.find({ 'attachments.0': { $exists: true } });
  
  let migrated = 0;
  for (const complaint of complaints) {
    let updated = false;

    for (let i = 0; i < complaint.attachments.length; i++) {
      const attachment = complaint.attachments[i];
      
      // Skip if already a Cloudinary URL
      if (attachment.path && attachment.path.includes('cloudinary.com')) {
        continue;
      }

      const cloudinaryUrl = await uploadToCloudinary(attachment.path, 'astu-complaints/complaints');
      if (cloudinaryUrl) {
        complaint.attachments[i].path = cloudinaryUrl;
        updated = true;
      }
    }

    if (updated) {
      await complaint.save();
      migrated++;
      console.log(`✓ Updated complaint: ${complaint.title}`);
    }
  }
  
  console.log(`\nMigrated ${migrated} complaints`);
}

async function migrate() {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('ERROR: Cloudinary credentials not found in .env file');
      console.error('Please add:');
      console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.error('  CLOUDINARY_API_KEY=your_api_key');
      console.error('  CLOUDINARY_API_SECRET=your_api_secret');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\nStarting migration to Cloudinary...');
    console.log('This will upload all local files to Cloudinary and update database records.\n');

    await migrateUsers();
    await migrateRegistrationRequests();
    await migrateComplaints();

    console.log('\n=== Migration Complete ===');
    console.log('All files have been uploaded to Cloudinary!');
    console.log('Future uploads will automatically use Cloudinary.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
