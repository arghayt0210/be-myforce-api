export const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Check if session is expired
  const sessionAge = req.session.cookie.maxAge;
  if (sessionAge <= 0) {
    return res.status(440).json({ error: 'Session expired' });
  }
  next();
};

// New separate middleware for email verification
export const isEmailVerified = (req, res, next) => {
  // First ensure user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Check email verification
  if (!req.user.is_email_verified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email to access this resource',
      requiresVerification: true,
    });
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
  next();
};

// Combine both checks if needed
export const isAuthenticatedAndVerified = [isAuthenticated, isEmailVerified];
export const isAuthenticatedVerifiedAdmin = [isAuthenticated, isEmailVerified, isAdmin];
