import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMissions, claimMission, updateMissionProgress } from '../controllers/gameController.js';

const router = Router();

router.get('/', authenticate, getMissions);
router.post('/claim/:id', authenticate, claimMission);
router.post('/progress', authenticate, updateMissionProgress);

export default router;
