import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getWords, getWord, createWord, addToLearning, getNewWords,
  getLearningWords, reviewWord, getWordStats, getVocabularySummary,
  getAutoSuggest, bulkAddWords, getRevisionWords, analyzeWord,
  getMyVocabulary, removeFromVocabulary, lookupWord, generateSentences
} from '../controllers/wordController.js';

const router = Router();

router.get('/', authenticate, getWords);
router.get('/new', authenticate, getNewWords);
router.get('/learning', authenticate, getLearningWords);
router.get('/revision', authenticate, getRevisionWords);
router.get('/summary', authenticate, getVocabularySummary);
router.get('/suggest', authenticate, getAutoSuggest);
router.get('/my-vocabulary', authenticate, getMyVocabulary);
router.delete('/my-vocabulary/:wordId', authenticate, removeFromVocabulary);
router.get('/lookup', authenticate, lookupWord);
router.get('/:id', authenticate, getWord);
router.get('/:id/stats', authenticate, getWordStats);

router.post('/', authenticate, createWord);

router.post('/generate-sentences', authenticate, generateSentences);
router.post('/analyze', authenticate, analyzeWord);
router.post('/bulk', authenticate, bulkAddWords);
router.post('/:id/learn', authenticate, addToLearning);

router.post('/:id/review', authenticate, reviewWord);

export default router;
