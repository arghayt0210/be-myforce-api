import User from '@models/userModel';
import { sendEmail } from '@utils/emailUtil';
import logger from '@config/logger';
import crypto from 'crypto';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security reasons, don't reveal if email exists
      return res.json({
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    // Send reset email
    await sendEmail({
      to: user.email,
      template: 'resetPassword',
      data: {
        userName: user.full_name || user.username,
        resetToken: resetToken, // This is the unhashed token
      },
    });
    res.json({
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        error: 'Password reset token is invalid or has expired',
      });
    }
    // Set new password
    user.password = password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();
    // Send confirmation email
    await sendEmail({
      to: user.email,
      template: 'passwordChanged',
      data: {
        userName: user.full_name || user.username,
      },
    });
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
