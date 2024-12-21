/** 
URL: /api/auth/google/callback
**/
export const googleCallback = (req, res) => {
  res.redirect(process.env.FRONTEND_URL + '/dashboard');
};

/** 
URL: /api/auth/logout
**/
export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error destroying session' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
};

/** 
URL: /api/auth/me
**/
export const getCurrentUser = (req, res) => {
  res.json(req.user);
};

export const handleAuthError = (err, req, res, next) => {
  res.status(401).json({
    error: 'Authentication failed',
    message: err.message,
  });
};
