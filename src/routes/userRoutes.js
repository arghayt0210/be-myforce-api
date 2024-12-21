import express from 'express';
import { completeOnboarding } from '@controllers/userController';
import { isAuthenticatedAndVerified } from '@middlewares/authMiddleware';
import validateRequest from '@middlewares/validationMiddleware';
import { onboardingSchema } from '@utils/validationSchemas';

const router = express.Router();

router.post(
  '/onboarding',
  isAuthenticatedAndVerified,
  validateRequest(onboardingSchema),
  completeOnboarding,
);

export default router;
