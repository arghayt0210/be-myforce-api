import Interest from '@models/interestModel';
import logger from '@config/logger';
import slugify from 'slugify';
import { interests } from '@utils/data';

export const seedInterests = async () => {
  try {
    // Get existing interests
    const existingInterests = await Interest.find();
    if (existingInterests.length >= interests.length) {
      logger.info('Interests already seeded:', {
        existingCount: existingInterests.length,
        defaultCount: interests.length,
      });
      return existingInterests;
    }
    const existingNames = new Set(existingInterests.map((i) => i.name.toLowerCase()));

    // Filter out new interests
    const newInterests = interests.filter((interest) => !existingNames.has(interest.toLowerCase()));
    if (newInterests.length > 0) {
      // Create new interest documents
      const newInterestDocs = newInterests.map((name) => ({
        name,
        slug: slugify(name, { lower: true }),
      }));
      // Insert new interests
      const insertedInterests = await Interest.insertMany(newInterestDocs);

      logger.info('New interests seeded:', {
        count: insertedInterests.length,
        interests: newInterests,
      });
    }
    // Log final status
    const finalCount = await Interest.countDocuments();
    logger.info('Interest seeding complete:', {
      totalInterests: finalCount,
      existingInterests: existingInterests.length,
      newInterestsAdded: newInterests.length,
    });
    // Return all interests for reference
    return await Interest.find().sort({ name: 1 });
  } catch (error) {
    logger.error('Error seeding interests:', error);
    throw error;
  }
};
