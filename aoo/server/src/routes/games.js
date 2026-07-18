import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getProfile, getAchievements, getMissions, claimMission,
  spinWheel, openTreasure, submitGameScore, updateMissionProgress
} from '../controllers/gameController.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/achievements', authenticate, getAchievements);
router.get('/missions', authenticate, getMissions);

router.post('/missions/claim/:id', authenticate, claimMission);
router.post('/missions/progress', authenticate, updateMissionProgress);
router.post('/wheel/spin', authenticate, spinWheel);
router.post('/treasure/open', authenticate, openTreasure);
router.post('/score', authenticate, submitGameScore);

export default router;
