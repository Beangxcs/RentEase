const User = require('../models/UsersModel');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('./userVerificationController');
const path = require('path');

/**
 * GENERATE JWT TOKEN
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Register new user (with uploaded valid ID image)
 * @route   POST /api/auth/register
 * @access  Public
 * @form-data
 *          fullName, email, password, userType, age, valid_id (file)
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, userType, age, address } = req.body;

    // 🧩 Handle uploaded file (valid ID)
    let valid_id = req.file ? req.file.filename : null;

    if (!valid_id) {
      return res.status(400).json({
        success: false,
        message: 'Valid ID image is required (upload an image file)'
      });
    }

    // Basic validation
    if (!fullName || !email || !password || !userType || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please fill out all required fields'
      });
    }

    if (typeof age === 'undefined' || Number.isNaN(Number(age))) {
      return res.status(400).json({
        success: false,
        message: 'Age is required and must be a number'
      });
    }

    if (Number(age) < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // ✅ Create user
    const user = await User.create({
      fullName,
      email,
      password,
      userType,
      is_verified: false,
      valid_id,
      is_id_verified: false,
      age: Number(age),
      address
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(user);

    // Generate file URL (optional)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/ids/${valid_id}`;

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'User registered successfully. Please check your email for verification link.'
        : 'User registered successfully, but verification email could not be sent.',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          age: user.age,
          address: user.address,
          valid_id: fileUrl,
          is_verified: user.is_verified,
          is_id_verified: user.is_id_verified
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

    if (!user.is_id_verified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending ID verification by admin.'
      });
    }

    const token = generateToken(user._id);
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          is_verified: user.is_verified,
          is_id_verified: user.is_id_verified,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isActive = false;
      await user.updateLastActivity();
    }

    res.json({
      success: true,
      message: 'Logged out successfully. Please remove token from client.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, logout };
