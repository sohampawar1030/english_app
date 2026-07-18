import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chatController.js';

const router = Router();

router.post('/message', authenticate, sendMessage);
router.get('/history', authenticate, getChatHistory);
router.delete('/history', authenticate, clearChatHistory);

export default router;
