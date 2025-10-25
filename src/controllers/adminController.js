const User = require('../models/UsersModel');
const RentalHistory = require('../models/RentalHistoryModel');
const Property = require('../models/PropertiesModel');


/**
 * @desc    List users with optional filters
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 * @query   unverifiedEmail=true|false, unverifiedId=true|false
 */
const listUsers = async (req, res) => {
  try {
    const { unverifiedEmail, unverifiedId } = req.query;

    const filter = {};
    if (typeof unverifiedEmail !== 'undefined') {
      filter.is_verified = String(unverifiedEmail).toLowerCase() === 'true' ? false : undefined;
    }
    if (typeof unverifiedId !== 'undefined') {
      filter.is_id_verified = String(unverifiedId).toLowerCase() === 'true' ? false : undefined;
    }

    Object.keys(filter).forEach((key) => filter[key] === undefined && delete filter[key]);

    const users = await User.find(filter)
      .select('_id fullName email userType is_verified is_id_verified isActive createdAt age');

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users, total: users.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get specific user by ID
 * @route   GET /api/admin/users/:id 
 * @access  Private (Admin only)        
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('_id fullName email userType is_verified is_id_verified isActive createdAt age valid_id');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User retrieved successfully', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify a user's ID (approve their submitted valid_id)
 * @route   PATCH /api/admin/users/:id/verify-id
 * @access  Private (Admin only)
 */
const verifyUserId = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.is_id_verified = true;
    await user.save();

    res.json({
      success: true,
      message: 'User ID verified successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          is_verified: user.is_verified,
          is_id_verified: user.is_id_verified
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get revenue by property (for pie chart)
 * @route   GET /api/admin/my-revenue
 * @access  Private (Admin only)
 */
const myRevenue = async (req, res) => {
  try {
    // Aggregate revenue from rental history grouped by property
    const revenueData = await RentalHistory.aggregate([
      {
        $group: {
          _id: '$property_id',
          totalRevenue: { $sum: '$net' }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      {
        $unwind: '$property'
      },
      {
        $project: {
          _id: 0,
          propertyId: '$_id',
          propertyName: '$property.item_name',
          propertyRevenue: '$totalRevenue'
        }
      },
      {
        $sort: { propertyRevenue: -1 }
      }
    ]);

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.propertyRevenue, 0);

    res.json({
      success: true,
      message: 'Property revenue retrieved successfully',
      data: {
        properties: revenueData,
        totalRevenue: totalRevenue,
        propertyCount: revenueData.length
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
  listUsers,
  getUserById,
  verifyUserId,
  myRevenue
};


