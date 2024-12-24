import { Types } from 'mongoose';
import User from '@/models/user.model';

export const findUserById = async (userId: Types.ObjectId, select = '-password') => {
  return User.findById(userId).select(select);
};
