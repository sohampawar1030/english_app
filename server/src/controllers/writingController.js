import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const createWriting = async (req, res, next) => {
  try {
    const { content, writingType, title } = req.body;
    if (!content || !writingType) {
      return res.status(400).json({ error: 'Content and writing type are required' });
    }

    const improvement = await aiService.improveWriting(content, writingType);

    const id = generateId();
    await pool.execute(
      `INSERT INTO writing_sessions (id, user_id, writing_type, title, content,
        corrected_content, grammar_check, vocabulary_suggestions, ai_improvements,
        score, word_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, writingType, title || null, content,
       improvement.improved, JSON.stringify(improvement.grammarCheck),
       JSON.stringify(improvement.vocabularySuggestions),
       JSON.stringify(improvement.suggestions),
       improvement.score, content.split(/\s+/).length]
    );

    const [profile] = await pool.execute(
      'SELECT writing_score FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );
    const currentScore = profile[0]?.writing_score || 0;
    const newScore = (currentScore + improvement.score) / 2;
    await pool.execute(
      'UPDATE user_profiles SET writing_score = ? WHERE user_id = ?',
      [newScore, req.userId]
    );

    await memoryEngine.logActivity(req.userId, 'writing', 'Completed writing exercise', 25, 8);

    res.json({ id, ...improvement });
  } catch (error) {
    next(error);
  }
};

export const getWritingHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM writing_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ writings: rows });
  } catch (error) {
    next(error);
  }
};

export const getWriting = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM writing_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Writing not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};
