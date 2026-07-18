import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { globalSearch, searchSuggestions } from '../controllers/searchController.js';

const router = Router();

router.get('/', authenticate, globalSearch);
router.get('/suggestions', authenticate, searchSuggestions);

export default router;
