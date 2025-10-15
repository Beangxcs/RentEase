const User = require('../models/UsersModel');

/**
 * @desc    Get all users with basic info
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      fullName: 1,
      email: 1,
      userType: 1,
      isActive: 1,
      is_verified: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.userType,
      status: user.isActive ? 'Active' : 'Inactive',
      verified: user.is_verified,
      joinedAt: user.createdAt
    }));

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: formattedUsers,
        total: formattedUsers.length
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
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin only)
 */
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ is_verified: true });
    const adminUsers = await User.countDocuments({ userType: 'admin' });
    const staffUsers = await User.countDocuments({ userType: 'staff' });
    const rentorUsers = await User.countDocuments({ userType: 'rentor' });

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          byRole: {
            admin: adminUsers,
            staff: staffUsers,
            rentor: rentorUsers
          }
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
  getAllUsers,
  getUserStats
};