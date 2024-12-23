import express from 'express';
import logger from '@/utils/logger.util';
export const healthCheck = async (_req: express.Request, res: express.Response) => {
  logger.info('Server is starting');
  res.send('Server is working');
};
