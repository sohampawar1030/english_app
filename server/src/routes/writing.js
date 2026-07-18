import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createWriting, getWritingHistory, getWriting } from '../controllers/writingController.js';

const router = Router();

router.post('/', authenticate, createWriting);
router.get('/', authenticate, getWritingHistory);
router.get('/:id', authenticate, getWriting);

export default router;
