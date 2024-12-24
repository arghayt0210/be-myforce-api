import { Request, Response, NextFunction } from 'express';
import Interest from '@/models/interest.model';

export const getInterests = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const interests = await Interest.find().select('_id name slug');

    res.status(200).json({
      success: true,
      interests: interests.map((interest) => ({
        _id: interest._id,
        name: interest.name,
        slug: interest.slug,
      })),
    });
  } catch (error) {
    next(error);
  }
};
