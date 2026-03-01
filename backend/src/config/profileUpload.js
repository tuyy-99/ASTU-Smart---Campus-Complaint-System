const multer = require('multer');
const path = require('path');

// Use Cloudinary if configured, otherwise fall back to local storage
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

let storage;
if (useCloudinary) {
  const { createCloudinaryStorage } = require('./cloudinary');
  storage = createCloudinaryStorage('profile');
} else {
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'profile');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG images are allowed for profile photos.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_PROFILE_FILE_SIZE, 10) || 2 * 1024 * 1024 // 2MB
  },
  fileFilter
});

module.exports = upload;

