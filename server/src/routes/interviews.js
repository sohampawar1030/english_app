import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { startInterview, submitAnswer, getSessions, getSession } from '../controllers/interviewController.js';

const router = Router();

router.post('/start', authenticate, startInterview);
router.post('/answer', authenticate, submitAnswer);
router.get('/', authenticate, getSessions);
router.get('/:id', authenticate, getSession);

export default router;
