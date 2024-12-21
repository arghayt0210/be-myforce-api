import express from 'express';
import { isAuthenticated } from '@middlewares/authMiddleware';
import {
  sendVerificationEmail,
  resendVerificationEmail,
  verifyEmail,
} from '@controllers/verificationController';
import validateRequest from '@middlewares/validationMiddleware';
import { verifyEmailSchema } from '@utils/validationSchemas';

const router = express.Router();
// All routes are protected
router.use(isAuthenticated);
// Send verification email (automatically called after registration)
router.post('/send', sendVerificationEmail);
// Resend verification email
router.post('/resend', resendVerificationEmail);
// Verify email with OTP
router.post('/verify', validateRequest(verifyEmailSchema), verifyEmail);
export default router;
