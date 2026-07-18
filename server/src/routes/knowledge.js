import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createNote, getNotes, getNote, updateNote, deleteNote, getCategories
} from '../controllers/knowledgeController.js';

const router = Router();

router.post('/', authenticate, createNote);
router.get('/', authenticate, getNotes);
router.get('/categories', authenticate, getCategories);
router.get('/:id', authenticate, getNote);
router.patch('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

export default router;
