import { createAsset } from '@services/assetService';
import User from '@models/userModel';
import logger from '@config/logger';
import { sendEmail } from '@utils/emailUtil';
/** 
URL: /api/auth/google/callback
Method: GET
**/
export const googleCallback = async (req, res) => {
  // Send welcome email if this is a new user
  if (req.user.createdAt === req.user.updatedAt) {
    await sendEmail({
      to: req.user.email,
      template: 'welcome',
      data: req.user.full_name || req.user.username,
    });
  }
  res.redirect(process.env.FRONTEND_URL + '/onboarding');
};

/** 
URL: /api/auth/register
Method: POST
**/
export const register = async (req, res, next) => {
  try {
    const { email, full_name, username, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email or username',
      });
    }
    // Create user without image first
    const user = new User({
      email: email.toLowerCase(),
      full_name,
      username: username.toLowerCase(),
      password,
      is_onboarded: false,
      is_email_verified: false,
    });
    // Handle image upload if provided
    if (req.file) {
      try {
        logger.info('Uploading profile image for user');
        const asset = await createAsset(req.file, user._id, 'User', user._id, 'profile-images');
        user.profile_image = asset.url;
        user.profile_image_asset = asset._id;
      } catch (uploadError) {
        logger.error('Profile image upload error:', uploadError);
        // Continue registration even if image upload fails
      }
    }
    await user.save();
    // After successful registration and before sending response
    await sendEmail({
      to: user.email,
      template: 'welcome',
      data: user.full_name || user.username,
    });

    // Send verification email
    const otp = user.generateOTP();
    await user.save();
    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      data: {
        userName: user.full_name || user.username,
        otp: otp,
      },
    });

    // Log the user in by starting a session
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      // Remove sensitive information before sending response
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
      });
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * URL: /api/auth/login
 * Method: POST
 * **/
export const login = async (req, res, next) => {
  try {
    const { login, password } = req.body; // login can be email or username
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }
    // Update last login
    user.last_login = new Date();
    await user.save();
    // Start session
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        // Remove sensitive information
        const userResponse = user.toObject();
        delete userResponse.password;
        return res.json({
          message: 'Logged in successfully',
          user: userResponse,
        });
      });
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/** 
URL: /api/auth/logout
Method: GET
**/
export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error destroying session' });
      }
      // Clear cookie based on environment
      if (process.env.NODE_ENV === 'production') {
        res.clearCookie('connect.sid', {
          domain: 'onrender.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'none',
        });
      } else {
        res.clearCookie('connect.sid');
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
};

/** 
URL: /api/auth/me
Method: GET
**/
export const getCurrentUser = (req, res) => {
  res.json(req.user);
};

export const handleAuthError = (err, req, res, next) => {
  res.status(401).json({
    error: 'Authentication failed',
    message: err.message,
  });
};
