const User = require('../models/UsersModel');

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user
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
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.user._id;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    const updateData = {};
    if (typeof fullName !== 'undefined') updateData.fullName = fullName;
    if (typeof email !== 'undefined') updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide old password, new password, and confirm password'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from old password'
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isPasswordValid = await user.matchPassword(oldPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType
        }
      }
    });

  } catch (error) {
    console.error('Error changing password:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};