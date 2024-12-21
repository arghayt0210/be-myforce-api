import Interest from '@models/interestModel';
import logger from '@config/logger';

export const getInterests = async (req, res) => {
  try {
    // Fetch all interests, sorted alphabetically by name
    const interests = await Interest.find().sort({ name: 1 });
    // Return the interests list
    res.json({
      message: 'Interests fetched successfully',
      count: interests.length,
      interests,
    });
  } catch (error) {
    logger.error('Error fetching interests:', error);
    res.status(500).json({
      error: 'Failed to fetch interests',
      message: error.message,
    });
  }
};
