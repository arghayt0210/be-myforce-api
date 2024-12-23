import express from 'express';
import { register } from '@/controllers/auth.controller';
import { upload } from '@/middlewares/upload.middleware';

const router = express.Router();

router.post('/register', upload.single('profile_image'), register);

// Multiple files upload
// router.post('/media', uploadMultiple.array('files', 10), controller);

export default router;