import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { analyzeSpeech, getSessions } from '../controllers/speakingController.js';

const router = Router();

router.post('/analyze', authenticate, analyzeSpeech);
router.get('/sessions', authenticate, getSessions);

export default router;
