import User from '@models/userModel';
import { sendEmail } from '@utils/emailUtil';
import logger from '@config/logger';

/**
 * /api/verification/send
 * Method: POST
 * Description: Send verification email to the user
 * **/
export const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.is_email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    // Generate OTP
    const otp = user.generateOTP();

    await user.save();
    // Send verification email
    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      data: {
        userName: user.full_name || user.username,
        otp: otp,
      },
    });
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    logger.error('Send verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

/**
 * /api/verification/resend
 * Method: POST
 * Description: Resend verification email to the user
 * **/
export const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.is_email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    // Check if previous OTP was sent within last minute (prevent spam)
    if (user.otp_expires && user.otp_expires > Date.now() - 60000) {
      return res.status(429).json({
        error: 'Please wait 1 minute before requesting another OTP',
      });
    }
    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    // Send verification email
    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      data: {
        userName: user.full_name || user.username,
        otp: otp,
      },
    });
    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    logger.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

/**
 * /api/verification/verify
 * Method: POST
 * Description: Verify email with OTP
 * **/
export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.is_email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    // Mark email as verified
    user.is_email_verified = true;
    user.otp = undefined;
    user.otp_expires = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};
