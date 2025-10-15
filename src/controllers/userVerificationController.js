const User = require('../models/UsersModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


const createEmailTransporter = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS in your environment.');
  }

  return nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: EMAIL_USER, 
      pass: EMAIL_PASS  
    }
  });
};


const sendVerificationEmail = async (user) => {
  try {
    const transporter = createEmailTransporter();
    
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } 
    );
    
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    
    const mailOptions = {
  from: `Support <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Email Verification - Please Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to RentEase!</h2>
          <p>Hi ${user.fullName},</p>
          <p>Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">If you didn't create an account with us, please ignore this email.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (decoded.email !== user.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Update user verification status
    user.is_verified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          is_verified: user.is_verified
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Verification token expired. Please request a new verification email.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const emailSent = await sendVerificationEmail(user);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  verifyEmail,
  resendVerification,
  sendVerificationEmail 
};