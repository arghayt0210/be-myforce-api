import express from 'express';
import { verifyEmail, resendVerification } from '@/controllers/verification.controller';
import { isAuthenticated } from '@/middlewares/auth.middleware';

const router = express.Router();

router.post('/verify-email', isAuthenticated, verifyEmail);
router.post('/resend-verify-email', isAuthenticated, resendVerification);

export default router;
