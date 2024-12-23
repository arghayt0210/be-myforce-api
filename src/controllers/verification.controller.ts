import { Request, Response, NextFunction } from 'express';
import User from '@/models/user.model';
import { sendEmail } from '@/utils/email.util';
import { ErrorHandler } from '@/helpers/error';
import { verifyOtpSchema, resendOtpSchema } from '@/schemas/verification.schema';

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = verifyOtpSchema.safeParse(req.body);

    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path[0],
          message: error.message,
        }),
      );
    }

    const { email, otp } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    if (user.is_email_verified) {
      return next(new ErrorHandler(400, 'Email already verified'));
    }

    if (!user.verifyOTP(otp)) {
      return next(new ErrorHandler(400, 'Invalid or expired OTP'));
    }

    user.is_email_verified = true;
    user.otp = undefined;
    user.otp_expires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = resendOtpSchema.safeParse(req.body);

    if (!result.success) {
      const error = result.error.errors[0];
      return next(
        new ErrorHandler(400, 'Validation failed', {
          field: error.path[0],
          message: error.message,
        }),
      );
    }

    const { email } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    if (user.is_email_verified) {
      return next(new ErrorHandler(400, 'Email already verified'));
    }

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

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
