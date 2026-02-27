const express = require('express');
const router = express.Router();
const registrationUpload = require('../config/registrationUpload');
const profileUpload = require('../config/profileUpload');
const { login, getMe, forgotPassword, resetPassword, submitRegistrationRequest, updateProfile, changePassword, deleteProfilePhoto } = require('../controllers/authController');
const { loginValidation, forgotPasswordValidation, resetPasswordValidation, registrationRequestValidation, validate } = require('../middleware/validator');
const { loginLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');

router.post(
  '/register-request',
  registrationUpload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idPhoto', maxCount: 1 }
  ]),
  registrationRequestValidation,
  validate,
  submitRegistrationRequest
);
router.post('/login', loginLimiter, loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, validate, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileUpload.single('profilePhoto'), updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/profile-photo', protect, deleteProfilePhoto);

module.exports = router;
