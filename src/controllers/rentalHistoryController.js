const RentalHistory = require('../models/RentalHistoryModel');

/**
 * @desc    Create new rental history
 * @route   POST /api/rental-history
 * @access  Private
 */
const createRentalHistory = async (req, res) => {
  try {
    const { property_id, guest_id, check_in, check_out, nights, gross, net } = req.body;

    // Validate required fields
    if (!property_id || !guest_id || !check_in || !check_out || !nights || !gross || !net) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: property_id, guest_id, check_in, check_out, nights, gross, net'
      });
    }

    const rentalHistory = await RentalHistory.create({
      property_id,
      guest_id,
      period: {
        check_in: new Date(check_in),
        check_out: new Date(check_out)
      },
      nights: parseInt(nights),
      gross: parseFloat(gross),
      net: parseFloat(net)
    });

    const populatedHistory = await rentalHistory.populate([
      { path: 'property_id', select: 'item_name price location' },
      { path: 'guest_id', select: 'fullName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Rental history created successfully',
      data: { rentalHistory: populatedHistory }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all rental history
 * @route   GET /api/rental-history
 * @access  Private (Admin)
 */
const getAllRentalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, property_id, guest_id, sortBy = '-created_at' } = req.query;

    const filter = {};
    if (property_id) filter.property_id = property_id;
    if (guest_id) filter.guest_id = guest_id;

    const rentalHistories = await RentalHistory.find(filter)
      .populate('property_id', 'item_name price location')
      .populate('guest_id', 'fullName email')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalHistory.countDocuments(filter);

    res.json({
      success: true,
      message: 'Rental history retrieved successfully',
      data: {
        rentalHistories,
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
 * @desc    Get single rental history
 * @route   GET /api/rental-history/:id
 * @access  Private
 */
const getRentalHistoryById = async (req, res) => {
  try {
    const rentalHistory = await RentalHistory.findById(req.params.id)
      .populate('property_id', 'item_name price location category')
      .populate('guest_id', 'fullName email address');

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found'
      });
    }

    res.json({
      success: true,
      message: 'Rental history retrieved successfully',
      data: { rentalHistory }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update rental history
 * @route   PUT /api/rental-history/:id
 * @access  Private (Admin)
 */
const updateRentalHistory = async (req, res) => {
  try {
    const rentalHistory = await RentalHistory.findById(req.params.id);

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found'
      });
    }

    const { nights, gross, net } = req.body;
    const updateData = {};

    if (nights !== undefined) updateData.nights = parseInt(nights);
    if (gross !== undefined) updateData.gross = parseFloat(gross);
    if (net !== undefined) updateData.net = parseFloat(net);

    const updatedRentalHistory = await RentalHistory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'property_id', select: 'item_name price location' },
      { path: 'guest_id', select: 'fullName email' }
    ]);

    res.json({
      success: true,
      message: 'Rental history updated successfully',
      data: { rentalHistory: updatedRentalHistory }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete rental history
 * @route   DELETE /api/rental-history/:id
 * @access  Private (Admin)
 */
const deleteRentalHistory = async (req, res) => {
  try {
    const rentalHistory = await RentalHistory.findById(req.params.id);

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found'
      });
    }

    await RentalHistory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Rental history deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get rental history for a specific guest
 * @route   GET /api/rental-history/guest/:guest_id
 * @access  Private
 */
const getGuestRentalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const rentalHistories = await RentalHistory.find({ guest_id: req.params.guest_id })
      .populate('property_id', 'item_name price location')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalHistory.countDocuments({ guest_id: req.params.guest_id });

    res.json({
      success: true,
      message: 'Guest rental history retrieved successfully',
      data: {
        rentalHistories,
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
 * @desc    Get rental history for a specific property
 * @route   GET /api/rental-history/property/:property_id
 * @access  Private
 */
const getPropertyRentalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const rentalHistories = await RentalHistory.find({ property_id: req.params.property_id })
      .populate('guest_id', 'fullName email')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalHistory.countDocuments({ property_id: req.params.property_id });

    res.json({
      success: true,
      message: 'Property rental history retrieved successfully',
      data: {
        rentalHistories,
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
 * @desc    Get rental history statistics
 * @route   GET /api/rental-history/stats
 * @access  Private (Admin)
 */
const getRentalHistoryStats = async (req, res) => {
  try {
    const totalRentals = await RentalHistory.countDocuments();
    
    const totalGrossRevenue = await RentalHistory.aggregate([
      { $group: { _id: null, total: { $sum: '$gross' } } }
    ]);

    const totalNetRevenue = await RentalHistory.aggregate([
      { $group: { _id: null, total: { $sum: '$net' } } }
    ]);

    const totalNights = await RentalHistory.aggregate([
      { $group: { _id: null, total: { $sum: '$nights' } } }
    ]);

    const uniqueGuests = await RentalHistory.aggregate([
      { $group: { _id: '$guest_id' } },
      { $count: 'total' }
    ]);

    const uniqueProperties = await RentalHistory.aggregate([
      { $group: { _id: '$property_id' } },
      { $count: 'total' }
    ]);

    res.json({
      success: true,
      message: 'Rental history statistics retrieved successfully',
      data: {
        stats: {
          totalRentals,
          totalGrossRevenue: totalGrossRevenue[0]?.total || 0,
          totalNetRevenue: totalNetRevenue[0]?.total || 0,
          totalNights: totalNights[0]?.total || 0,
          uniqueGuests: uniqueGuests[0]?.total || 0,
          uniqueProperties: uniqueProperties[0]?.total || 0
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
  createRentalHistory,
  getAllRentalHistory,
  getRentalHistoryById,
  updateRentalHistory,
  deleteRentalHistory,
  getGuestRentalHistory,
  getPropertyRentalHistory,
  getRentalHistoryStats
};
