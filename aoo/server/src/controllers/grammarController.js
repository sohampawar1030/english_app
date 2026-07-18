import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const checkGrammar = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = await aiService.correctGrammar(text);

    const id = generateId();
    await pool.execute(
      `INSERT INTO grammar_exercises (id, user_id, exercise_type, user_input, 
        corrected_text, mistakes, score, suggestions)
       VALUES (?, ?, 'general', ?, ?, ?, ?, ?)`,
      [id, req.userId, text, result.corrected,
       JSON.stringify(result.mistakes), result.score,
       JSON.stringify(result.suggestions)]
    );

    if (result.mistakes?.length > 0) {
      const mistakeTypes = result.mistakes.map(m => m.type);
      await memoryEngine.logActivity(req.userId, 'grammar_mistake', 'Grammar check completed', 10, 5,
        { mistakes: mistakeTypes, score: result.score });
    }

    const [profile] = await pool.execute(
      'SELECT grammar_score FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );

    const currentScore = profile[0]?.grammar_score || 0;
    const newScore = (currentScore + result.score) / 2;
    await pool.execute(
      'UPDATE user_profiles SET grammar_score = ? WHERE user_id = ?',
      [newScore, req.userId]
    );

    res.json({ id, ...result });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM grammar_exercises WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ exercises: rows });
  } catch (error) {
    next(error);
  }
};
