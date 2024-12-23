import express from 'express';
import { register, login, logout, getCurrentUser, forgotPassword, resetPassword } from '@/controllers/auth.controller';
import { upload } from '@/middlewares/upload.middleware';
import { isAuthenticated } from '@/middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.post('/register', upload.single('profile_image'), register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, getCurrentUser);

// Multiple files upload
// router.post('/media', uploadMultiple.array('files', 10), controller);

export default router;
