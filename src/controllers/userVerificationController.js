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
    
  const frontendVerifyBase = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendVerifyBase = process.env.BACKEND_URL || process.env.SERVER_URL || 'http://localhost:5000';

  // Frontend route where a SPA could read the token and call the backend
  const verificationUrlFrontend = `${frontendVerifyBase}/verify-email?token=${encodeURIComponent(verificationToken)}`;
  // Direct backend verification route - clicking this will immediately invoke verification
  const verificationUrlBackend = `${backendVerifyBase.replace(/\/$/, '')}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    
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
            <!-- Primary button links directly to backend verification so a click verifies immediately -->
            <a href="${verificationUrlBackend}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">Direct verification (works immediately): ${verificationUrlBackend}</p>
          <p style="word-break: break-all; color: #007bff;">Or use the frontend flow: ${verificationUrlFrontend}</p>
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
    console.log('🔗 Email verification link clicked!');
    console.log('📧 Token received:', token ? token.substring(0, 20) + '...' : 'MISSING');

    if (!token) {
      console.error('❌ No token provided');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log('👤 User ID from token:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error('❌ User not found with ID:', decoded.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User found:', user.email);

    if (decoded.email !== user.email) {
      console.error('❌ Email mismatch. Token email:', decoded.email, 'User email:', user.email);
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if already verified
    if (user.is_verified) {
      console.log('⚠️ User already verified:', user.email);
      // If the client accepts HTML (a browser click), return a friendly page
      if (req.accepts && req.accepts('html')) {
        return res.status(200).send(`
          <html>
            <head><title>Email Verified</title></head>
            <body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
              <h2>Your email is already verified</h2>
              <p>You can now <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">log in</a>.</p>
            </body>
          </html>
        `);
      }

      return res.status(200).json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Update user verification status
    console.log('🔄 Marking user as verified:', user.email);
    user.is_verified = true;
    await user.save();
    console.log('✅ User verification status saved to database');

    // If the request is from a browser, render a simple HTML confirmation page
    if (req.accepts && req.accepts('html')) {
      console.log('📱 Rendering HTML success page for browser');
      return res.status(200).send(`
        <html>
          <head><title>Verification Successful</title></head>
          <body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
            <h2>✅ Email Verified Successfully!</h2>
            <p style="font-size: 16px; color: #28a745;">Your email has been verified. You can now log in to your account.</p>
            <p style="margin-top: 30px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a></p>
          </body>
        </html>
      `);
    }

    console.log('✅ Verification complete for user:', user.email);
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
    console.error('❌ Error during email verification:', error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('❌ Invalid or malformed token');
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