import express from 'express';
import { completeOnboarding } from '@/controllers/onboarding.controller';
import { isAuthenticated, isEmailVerified } from '@/middlewares/auth.middleware';

const router = express.Router();

router.post('/complete', isAuthenticated, isEmailVerified, completeOnboarding);

export default router; 