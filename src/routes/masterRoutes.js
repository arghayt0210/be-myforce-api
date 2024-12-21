import express from 'express';
import { getInterests } from '@controllers/masterController';

const router = express.Router();

router.get('/interests', getInterests);

export default router;
