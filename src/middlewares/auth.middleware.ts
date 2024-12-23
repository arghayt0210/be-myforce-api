import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.util';
import User from '@/models/user.model';
import { ErrorHandler } from '@/helpers/error';
import { Types } from 'mongoose';
import { findUserById } from '@/utils/user.util';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    user_type: string;
  };
}

export const isAuthenticated = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new ErrorHandler(401, 'Please login to access this resource');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded._id).select('_id user_type');

    if (!user) {
      throw new ErrorHandler(401, 'User not found');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const isAdmin = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await findUserById(req.user?._id as Types.ObjectId);
    if (user?.user_type !== 'admin') {
      throw new ErrorHandler(403, 'Access denied. Admin only resource');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const isEmailVerified = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await findUserById(req.user?._id as Types.ObjectId);
    if (!user?.is_email_verified) {
      throw new ErrorHandler(403, 'Please verify your email first');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const isOnboarded = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await findUserById(req.user?._id as Types.ObjectId);
    if (!user?.is_onboarded) {
      throw new ErrorHandler(403, 'Please complete onboarding first');
    }
    next();
  } catch (error) {
    next(error);
  }
};
