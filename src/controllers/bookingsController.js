const Bookings = require('../models/BookingsModel');
const RentalHistory = require('../models/RentalHistoryModel');

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
  try {
    const { property_id, check_in, check_out, nights, amount, deduction } = req.body;

    // Validate required fields
    if (!property_id || !check_in || !check_out || !nights || !amount) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: property_id, check_in, check_out, nights, amount'
      });
    }

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    const booking = await Bookings.create({
      guest_id: req.user._id, // Automatically get from authenticated user
      property_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      nights: parseInt(nights),
      amount: parseFloat(amount),
      deduction: deduction !== undefined ? parseFloat(deduction) : 0,
      status: 'pending'
    });

    const populatedBooking = await Bookings.findById(booking._id)
      .populate('property_id', 'item_name price location category')
      .populate('guest_id', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: populatedBooking }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all bookings
 * @route   GET /api/bookings
 * @access  Private (Admin)
 */
const getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      guest_id, 
      property_id,
      sortBy = '-created_at' 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (guest_id) filter.guest_id = guest_id;
    if (property_id) filter.property_id = property_id;

    const bookings = await Bookings.find(filter)
      .populate('property_id', 'item_name price location category')
      .populate('guest_id', 'fullName email')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bookings.countDocuments(filter);

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Bookings.findById(req.params.id)
      .populate('property_id', 'item_name price location category')
      .populate('guest_id', 'fullName email address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: { booking }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update booking
 * @route   PUT /api/bookings/:id
 * @access  Private (Admin or Owner)
 */
const updateBooking = async (req, res) => {
  try {
    const booking = await Bookings.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const { check_in, check_out, nights, amount, deduction, status } = req.body;
    const updateData = {};
    const oldStatus = booking.status;
    const userType = req.user.userType;

    // Check if user is rentor and restrict their permissions
    if (userType === 'rentor') {
      // Rentor can only update check_in, check_out, and set status to cancelled
      if (check_in !== undefined) updateData.check_in = new Date(check_in);
      if (check_out !== undefined) updateData.check_out = new Date(check_out);
      
      // Rentor can only change status to 'cancelled'
      if (status !== undefined) {
        if (status !== 'cancelled') {
          return res.status(403).json({
            success: false,
            message: 'Rentors can only cancel bookings. Status can only be set to "cancelled"'
          });
        }
        updateData.status = status;
      }

      // Rentor cannot update nights, amount, or deduction
      if (nights !== undefined || amount !== undefined || deduction !== undefined) {
        return res.status(403).json({
          success: false,
          message: 'Rentors can only update check_in, check_out, and cancel bookings'
        });
      }
    } else {
      // Admin and staff can update all fields
      if (check_in !== undefined) updateData.check_in = new Date(check_in);
      if (check_out !== undefined) updateData.check_out = new Date(check_out);
      if (nights !== undefined) updateData.nights = parseInt(nights);
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (deduction !== undefined) updateData.deduction = parseFloat(deduction);
      if (status !== undefined) updateData.status = status;
    }

    // Validate dates if both are being updated
    if (updateData.check_in && updateData.check_out) {
      if (updateData.check_out <= updateData.check_in) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }
    }

    const updatedBooking = await Bookings.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'property_id', select: 'item_name price location category' },
      { path: 'guest_id', select: 'fullName email' }
    ]);

    // If status changed to "approved", create rental history
    if (oldStatus !== 'approved' && updatedBooking.status === 'approved') {
      const gross = updatedBooking.amount;
      const net = updatedBooking.amount - updatedBooking.deduction;

      await RentalHistory.create({
        property_id: updatedBooking.property_id._id,
        guest_id: updatedBooking.guest_id._id,
        period: {
          check_in: updatedBooking.check_in,
          check_out: updatedBooking.check_out
        },
        nights: updatedBooking.nights,
        gross: gross,
        net: net
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: updatedBooking }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete booking
 * @route   DELETE /api/bookings/:id
 * @access  Private (Admin)
 */
const deleteBooking = async (req, res) => {
  try {
    const booking = await Bookings.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await Bookings.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { guest_id: req.user._id }; // Get from authenticated user
    if (status) filter.status = status;

    const bookings = await Bookings.find(filter)
      .populate('property_id', 'item_name price location category')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bookings.countDocuments(filter);

    res.json({
      success: true,
      message: 'Your bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get bookings for a specific property
 * @route   GET /api/bookings/property/:property_id
 * @access  Private
 */
const getPropertyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { property_id: req.params.property_id };
    if (status) filter.status = status;

    const bookings = await Bookings.find(filter)
      .populate('guest_id', 'fullName email')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bookings.countDocuments(filter);

    res.json({
      success: true,
      message: 'Property bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get booking statistics
 * @route   GET /api/bookings/stats
 * @access  Private (Admin)
 */
const getBookingsStats = async (req, res) => {
  try {
    const totalBookings = await Bookings.countDocuments();
    const pendingBookings = await Bookings.countDocuments({ status: 'pending' });
    const approvedBookings = await Bookings.countDocuments({ status: 'approved' });
    const rejectedBookings = await Bookings.countDocuments({ status: 'rejected' });
    const cancelledBookings = await Bookings.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Bookings.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDeductions = await Bookings.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$deduction' } } }
    ]);

    const totalNights = await Bookings.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$nights' } } }
    ]);

    res.json({
      success: true,
      message: 'Booking statistics retrieved successfully',
      data: {
        stats: {
          totalBookings,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          cancelledBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalDeductions: totalDeductions[0]?.total || 0,
          netRevenue: (totalRevenue[0]?.total || 0) - (totalDeductions[0]?.total || 0),
          totalNights: totalNights[0]?.total || 0
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getMyBookings,
  getPropertyBookings,
  getBookingsStats
};
