import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateStory, getStories, getStory, markAsRead, toggleFavorite, deleteStory
} from '../controllers/storyController.js';

const router = Router();

router.post('/generate', authenticate, generateStory);
router.get('/', authenticate, getStories);
router.get('/:id', authenticate, getStory);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/:id/favorite', authenticate, toggleFavorite);
router.delete('/:id', authenticate, deleteStory);

export default router;
