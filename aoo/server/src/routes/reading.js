import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateReading, saveReading, getReadings, getReading, markComplete, saveWord
} from '../controllers/readingController.js';

const router = Router();

router.post('/generate', authenticate, generateReading);
router.post('/save', authenticate, saveReading);
router.post('/save-word', authenticate, saveWord);
router.get('/', authenticate, getReadings);
router.get('/:id', authenticate, getReading);
router.patch('/:id/complete', authenticate, markComplete);

export default router;
