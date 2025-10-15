const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserStats
} = require('../controllers/userManagementController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * User Management Routes
 * Handle user listing and statistics (Admin only)
 */

/**
 * @route   GET /api/users
 * @desc    Get all users with basic info
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 */
router.get('/', authenticate, authorize('admin'), getAllUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 */
router.get('/stats', authenticate, authorize('admin'), getUserStats);

module.exports = router;