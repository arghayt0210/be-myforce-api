import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '@/models/user.model';
import { createAsset } from '@/services/asset.service';
import { sendEmail } from '@/utils/email.util';
import { generateToken } from '@/utils/jwt.util';
import { ErrorHandler } from '@/helpers/error';

interface RegistrationBody {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegistrationBody> & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction
) => {
  try {
    const { full_name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ErrorHandler(
        400, 
        'Email or username already exists'
      );
    }

    // Create user without profile image first
    const user = await User.create({
      full_name,
      username,
      email,
      password,
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
      sameSite: 'strict',
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
      },
    });
  } catch (error) {
    next(error);
  }
};