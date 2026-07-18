import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getDashboard, getVocabularyGrowth, getSkillScores, getWeakWords,
  getWeeklyReport, getMonthlyReport, getAllTimeStats
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard', authenticate, getDashboard);
router.get('/vocabulary-growth', authenticate, getVocabularyGrowth);
router.get('/skills', authenticate, getSkillScores);
router.get('/weak-words', authenticate, getWeakWords);
router.get('/weekly', authenticate, getWeeklyReport);
router.get('/monthly', authenticate, getMonthlyReport);
router.get('/all-time', authenticate, getAllTimeStats);

export default router;
