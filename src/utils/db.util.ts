import mongoose from 'mongoose';
import { mongoConfig } from '@/config/mongodb.config';
import logger from '@/utils/logger.util';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});