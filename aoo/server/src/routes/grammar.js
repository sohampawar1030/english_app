import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkGrammar, getHistory } from '../controllers/grammarController.js';

const router = Router();

router.post('/check', authenticate, checkGrammar);
router.get('/history', authenticate, getHistory);

export default router;
