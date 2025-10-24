const express = require('express');
const router = express.Router();

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getGuestBookings,
  getPropertyBookings,
  getBookingsStats
} = require('../controllers/bookingsController');
const { authenticate, authorize } = require('../middleware/auth');


/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Private (Admin only)
 * @body    None
 */
router.get('/stats', authenticate, authorize('admin'), getBookingsStats);

/**
 * @route   GET /api/bookings/guest/:guest_id
 * @desc    Get bookings for a specific guest
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @query   page, limit, status
 * @body    None
 */
router.get('/guest/:guest_id', authenticate, getGuestBookings);

/**
 * @route   GET /api/bookings/property/:property_id
 * @desc    Get bookings for a specific property
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @query   page, limit, status
 * @body    None
 */
router.get('/property/:property_id', authenticate, getPropertyBookings);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { guest_id, property_id, check_in, check_out, nights, amount, deduction? }
 */
router.post('/', authenticate, createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @query   page, limit, status, guest_id, property_id, sortBy
 * @body    None
 */
router.get('/', authenticate, authorize('admin'), getAllBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking by ID
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.get('/:id', authenticate, getBookingById);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking (all fields optional, cannot change "checked out" to confirmed/cancelled)
 * @access  Private (Admin or Owner)
 * @headers Authorization: Bearer <token>
 * @body    { check_in?, check_out?, nights?, amount?, deduction?, status? }
 * @note    When status is changed to "checked out", a rental history record is automatically created
 */
router.put('/:id', authenticate, updateBooking);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete booking
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    None
 */
router.delete('/:id', authenticate, authorize('admin'), deleteBooking);

module.exports = router;
