import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '@/models/user.model';
import { createAsset } from '@/services/asset.service';
import { sendEmail } from '@/utils/email.util';
import { generateToken } from '@/utils/jwt.util';
import { ErrorHandler } from '@/helpers/error';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/schemas/auth.schema';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (
  req: Request & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      const error = result.error.errors[0];
      const fieldPath = error.path.join('.');

      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: fieldPath,
          message:
            error.code === 'invalid_type' && error.received === 'undefined'
              ? `${fieldPath} is required`
              : error.message,
        }),
      );
    }

    const validatedData = result.data;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }, { username: validatedData.username }],
    });

    if (existingUser) {
      return next(
        new ErrorHandler(400, 'Email or username already exists', {
          field: existingUser.email === validatedData.email ? 'email' : 'username',
          value:
            existingUser.email === validatedData.email
              ? validatedData.email
              : validatedData.username,
        }),
      );
    }

    // Create user without profile image first
    const user = await User.create({
      full_name: validatedData.full_name,
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
    });

    // Handle profile image upload if provided
    if (req.file) {
      const asset = await createAsset({
        file: {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
        },
        userId: user._id as Types.ObjectId,
        relatedModel: 'User',
        relatedId: user._id as Types.ObjectId,
        folder: 'profile-images',
      });

      // Update user with profile image details
      user.profile_image = asset.url;
      user.profile_image_asset = asset._id as Types.ObjectId;
      await user.save();
    }

    // Generate OTP and send verification email
    const otp = user.generateOTP();
    await user.save();

    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      data: {
        userName: user.full_name,
        otp,
      },
    });

    // Generate JWT token
    const token = generateToken({
      _id: user._id as Types.ObjectId,
      user_type: user.user_type,
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'none',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    // Return user data without sensitive information
    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: {
        _id: user._id as Types.ObjectId,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image,
        is_email_verified: user.is_email_verified,
        user_type: user.user_type,
        is_onboarded: user.is_onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Expire immediately
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'none',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path[0],
          message: error.message,
        }),
      );
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorHandler(401, 'Invalid email or password'));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler(401, 'Invalid email or password'));
    }

    const token = generateToken({
      _id: user._id as Types.ObjectId,
      user_type: user.user_type,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'none',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image,
        is_email_verified: user.is_email_verified,
        user_type: user.user_type,
        is_onboarded: user.is_onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path[0],
          message: error.message,
        }),
      );
    }

    const user = await User.findOne({ email: result.data.email });
    if (!user) {
      return next(new ErrorHandler(404, 'User not found with this email'));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.reset_password_expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.save();

    // Send reset password email
    await sendEmail({
      to: user.email,
      template: 'resetPassword',
      data: {
        userName: user.full_name,
        resetToken,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path[0],
          message: error.message,
        }),
      );
    }

    const { token, password } = result.data;

    // Hash token to compare with stored hash
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      reset_password_token: resetPasswordToken,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler(400, 'Invalid or expired reset token'));
    }

    user.password = password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    // Send password changed confirmation email
    await sendEmail({
      to: user.email,
      template: 'passwordChanged',
      data: {
        userName: user.full_name,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { credential } = req.body;
    console.log('342: ', credential);

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new ErrorHandler(400, 'Invalid Google token');
    }

    const { email, name, sub: googleId, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      const username = `user_${crypto.randomBytes(4).toString('hex')}`;
      user = await User.create({
        email,
        full_name: name,
        username,
        google_id: googleId,
        profile_image: picture,
        is_email_verified: true, // Google emails are pre-verified
      });
    } else if (!user.google_id) {
      // Link Google account to existing email user
      user.google_id = googleId;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      _id: user._id as Types.ObjectId,
      user_type: user.user_type,
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'none',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image,
        is_email_verified: user.is_email_verified,
        user_type: user.user_type,
        is_onboarded: user.is_onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};
