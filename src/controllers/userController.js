import User from '@models/userModel';
import Interest from '@models/interestModel';
import { sendEmail } from '@utils/emailUtil';
import logger from '@config/logger';

export const completeOnboarding = async (req, res) => {
  try {
    const { bio, interests } = req.body;
    const userId = req.user._id;
    // Verify all interests exist
    const existingInterests = await Interest.find({ _id: { $in: interests } });
    if (existingInterests.length !== interests.length) {
      return res.status(400).json({
        error: 'One or more invalid interest IDs provided',
      });
    }
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        bio,
        interests,
        is_onboarded: true,
      },
      { new: true },
    ).populate('interests');
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }
    // Send onboarding completion email
    await sendEmail({
      to: user.email,
      template: 'onboardingComplete',
      data: {
        userName: user.full_name || user.username,
        interests: existingInterests.map((i) => i.name),
      },
    });
    res.json({
      message: 'Onboarding completed successfully',
      user,
    });
  } catch (error) {
    logger.error('Onboarding error:', error);
    res.status(500).json({
      error: 'Error completing onboarding',
    });
  }
};
