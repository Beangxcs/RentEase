
const jwt = require('jsonwebtoken');
const User = require('../models/UsersModel');


const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format. Please log in first.'
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please log in first.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please check your email and verify your account.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    try {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token); 
        if (decoded && decoded.userId) {
          const user = await User.findById(decoded.userId);
          if (user && user.isActive) {
            user.isActive = false;
            await user.save();
          }
        }
      }
    } catch (updateError) {
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  }
};


const authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in first.'
      });
    }
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This feature requires ${userTypes.join(' or ')} privileges.`
      });
    }
    next();
  };
};


module.exports = { authenticate, authorize };