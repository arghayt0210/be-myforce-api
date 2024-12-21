import express from 'express';
import { forgotPassword, resetPassword } from '@controllers/passwordController';
import validateRequest from '@middlewares/validationMiddleware';
import { forgotPasswordSchema, resetPasswordSchema } from '@utils/validationSchemas';

const router = express.Router();
// Forgot password - request reset link
router.post('/forgot', validateRequest(forgotPasswordSchema), forgotPassword);
// Reset password with token
router.post('/reset', validateRequest(resetPasswordSchema), resetPassword);

export default router;
