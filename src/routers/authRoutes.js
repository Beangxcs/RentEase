const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const {
  register,
  login,
  logout
} = require('../controllers/authController');
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/profileController');
const {
  verifyEmail,
  resendVerification
} = require('../controllers/userVerificationController');
const { authenticate } = require('../middleware/auth');


const uploadPath = path.join(__dirname, '../uploads/ids');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only .jpg, .jpeg, .png, and .pdf files are allowed'));
    }
    cb(null, true);
  }
});



/**
 * @route   POST /api/auth/register
 * @desc    Register new user with valid ID upload
 * @access  Public
 * @form    form-data { fullName, email, password, userType, age, valid_id(file) }
 */
router.post('/register', upload.single('valid_id'), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (JWT-based)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

module.exports = router;
