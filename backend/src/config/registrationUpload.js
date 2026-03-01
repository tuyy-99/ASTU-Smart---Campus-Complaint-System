const multer = require('multer');
const path = require('path');
const { createCloudinaryStorage } = require('./cloudinary');

// Use Cloudinary if configured, otherwise fall back to local storage
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

let storage;
if (useCloudinary) {
  storage = createCloudinaryStorage('registration-requests');
} else {
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'registration-requests');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPG, PNG, and WEBP are allowed.'), false);
  }
};

const registrationUpload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880
  },
  fileFilter
});

module.exports = registrationUpload;
