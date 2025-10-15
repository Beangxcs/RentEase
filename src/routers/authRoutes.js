const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout
} = require('../controllers/authController');
const {
  getProfile,
  updateProfile
} = require('../controllers/profileController');
const {
  verifyEmail,
  resendVerification
} = require('../controllers/userVerificationController');
const { authenticate } = require('../middleware/auth');


/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { fullName, email, password, userType, age, valid_id }
 */
router.post('/register', register); //localhost:8000/api/auth/register

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (JWT-based)
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email address
 * @access  Public
 * @query   token=<verification_token>
 * @body    None
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { fullName?, email? }
 */
router.put('/profile', authenticate, updateProfile);

module.exports = router;