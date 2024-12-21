import express from 'express';
import passport from 'passport';
import { isAuthenticated } from '@middlewares/authMiddleware';
import { uploadMiddleware } from '@middlewares/uploadMiddleware';
import { registerSchema, loginSchema } from '@utils/validationSchemas';
import validateRequest from '@middlewares/validationMiddleware';

import {
  googleCallback,
  logout,
  getCurrentUser,
  handleAuthError,
  register,
  login,
} from '@controllers/authController';

const router = express.Router();

// Google OAuth routes
/** 
URL: /api/auth/google
**/
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);

// Google OAuth callback
/** 
URL: /api/auth/google/callback
**/
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: true,
  }),
  googleCallback,
);

// Register with credentials
/**
 * URL: /api/auth/register
 * Method: POST
 * */
router.post('/register', uploadMiddleware.single.image, validateRequest(registerSchema), register);

// Login with credentials
/**
 * URL: /api/auth/login
 * Method: POST
 * */
router.post('/login', validateRequest(loginSchema), login);

// Logout route
/**
 * URL: /api/auth/logout
 * **/
router.get('/logout', logout);

// Get current user
/**
 * URL: /api/auth/me
 * **/
router.get('/me', isAuthenticated, getCurrentUser);

// Error handler
router.use(handleAuthError);

export default router;
