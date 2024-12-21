import logger from '@config/logger';

export const isAuthenticated = (req, res, next) => {
  logger.info('isAuthenticated middleware', req.user);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Additional security checks
  if (!req.user.is_email_verified) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  // Check if session is expired
  const sessionAge = req.session.cookie.maxAge;
  if (sessionAge <= 0) {
    return res.status(440).json({ error: 'Session expired' });
  }
  next();
};
