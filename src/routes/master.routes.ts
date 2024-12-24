import express from 'express';
import { getInterests } from '@/controllers/master.controller';

const router = express.Router();

router.get('/interests', getInterests);

export default router;
