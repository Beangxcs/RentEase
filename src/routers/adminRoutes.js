const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listUsers,
  getUserById,
  verifyUserId,
  myRevenue
} = require('../controllers/adminController');

/**
 * Admin Routes
 * Simple, clear endpoints for admin user management.
 */

/**
 * @route   GET /api/admin/users
 * @desc    List users with optional filters
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @query   unverifiedEmail=true|false, unverifiedId=true|false
 * @body    None
 */
router.get('/users', authenticate, authorize('admin'), listUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get specific user details by ID
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.get('/users/:id', authenticate, authorize('admin'), getUserById);

/**
 * @route   PATCH /api/admin/users/:id/verify-id
 * @desc    Mark a user's ID as verified (approved)
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.patch('/users/:id/verify-id', authenticate, authorize('admin'), verifyUserId);

/**
 * @route   GET /api/admin/my-revenue
 * @desc    Get revenue statistics by property for pie chart
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.get('/my-revenue', authenticate, authorize('admin'), myRevenue);

module.exports = router;


