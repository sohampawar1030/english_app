import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const analyzeSpeech = async (req, res, next) => {
  try {
    const { transcript, expectedText } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

    const result = await aiService.analyzeSpeaking(transcript, expectedText);

    const id = generateId();
    await pool.execute(
      `INSERT INTO speaking_sessions (id, user_id, session_type, transcript,
        fluency_score, confidence_score, speed_analysis, pause_analysis,
        accent_analysis, suggestions)
       VALUES (?, ?, 'practice', ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, transcript, result.fluencyScore, result.confidenceScore,
       JSON.stringify(result.speedAnalysis), JSON.stringify(result.pauseAnalysis),
       JSON.stringify(result.accentAnalysis), JSON.stringify(result.suggestions)]
    );

    const avgScore = (result.fluencyScore + result.confidenceScore) / 2;
    const [profile] = await pool.execute(
      'SELECT speaking_score FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );
    const currentScore = profile[0]?.speaking_score || 0;
    const newScore = (currentScore + avgScore) / 2;
    await pool.execute(
      'UPDATE user_profiles SET speaking_score = ? WHERE user_id = ?',
      [newScore, req.userId]
    );

    await memoryEngine.logActivity(req.userId, 'speaking_practice', 'Completed speaking practice', 30, 10);

    res.json({ id, ...result });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM speaking_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ sessions: rows });
  } catch (error) {
    next(error);
  }
};
