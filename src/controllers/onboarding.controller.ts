import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { ErrorHandler } from '@/helpers/error';
import { onboardingSchema } from '@/schemas/onboarding.schema';
import User from '@/models/user.model';
import { sendEmail } from '@/utils/email.util';
import { Types } from 'mongoose';

export const completeOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = onboardingSchema.safeParse(req.body);

    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path.join('.'),
          message: error.message,
        })
      );
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    // Update user with onboarding data
    user.interests = result.data.interests.map(id => new Types.ObjectId(id));
    user.bio = result.data.bio;
    user.is_onboarded = true;

    await user.save();

    // Send onboarding completion email
    await sendEmail({
      to: user.email,
      template: 'onboardingComplete',
      data: {
        userName: user.full_name,
        interests: user.interests.map(id => id.toString()),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        _id: user._id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image,
        interests: user.interests,
        bio: user.bio,
        is_email_verified: user.is_email_verified,
        is_onboarded: user.is_onboarded,
        user_type: user.user_type,
      },
    });
  } catch (error) {
    next(error);
  }
}; 