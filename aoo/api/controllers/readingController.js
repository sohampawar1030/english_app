import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const generateReading = async (req, res, next) => {
  try {
    const { readingType, level, interests } = req.body;
    const result = await aiService.generateReadingContent(
      readingType || 'article', level || 'intermediate', interests || []
    );

    const id = generateId();
    await pool.execute(
      `INSERT INTO reading_sessions (id, user_id, reading_type, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.userId, readingType || 'article', result.title, result.content]
    );

    await memoryEngine.logActivity(req.userId, 'reading', 'Generated reading content', 20, 5);

    res.json({ id, ...result });
  } catch (error) {
    next(error);
  }
};

export const saveReading = async (req, res, next) => {
  try {
    const { title, content, readingType, sourceUrl } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = generateId();
    await pool.execute(
      `INSERT INTO reading_sessions (id, user_id, reading_type, title, content, source_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.userId, readingType || 'article', title, content, sourceUrl || null]
    );

    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
};

export const getReadings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM reading_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ readings: rows });
  } catch (error) {
    next(error);
  }
};

export const getReading = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM reading_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reading not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const markComplete = async (req, res, next) => {
  try {
    const { readingTimeSeconds, wordsHighlighted, wordsSaved } = req.body;
    await pool.execute(
      `UPDATE reading_sessions 
       SET is_completed = true, reading_time_seconds = ?,
           words_highlighted = ?, words_saved = ?
       WHERE id = ? AND user_id = ?`,
      [readingTimeSeconds || 0,
       JSON.stringify(wordsHighlighted || []),
       JSON.stringify(wordsSaved || []),
       req.params.id, req.userId]
    );

    await memoryEngine.logActivity(req.userId, 'reading_complete', 'Completed reading', 20, 5);
    res.json({ message: 'Reading marked as complete' });
  } catch (error) {
    next(error);
  }
};

export const saveWord = async (req, res, next) => {
  try {
    const { word, meaning } = req.body;
    if (!word) return res.status(400).json({ error: 'Word is required' });

    const [existing] = await pool.execute('SELECT id FROM words WHERE word = ?', [word]);
    let wordId;
    if (existing.length > 0) {
      wordId = existing[0].id;
    } else {
      wordId = generateId();
      await pool.execute(
        `INSERT INTO words (id, word, english_meaning)
         VALUES (?, ?, ?)`,
        [wordId, word, meaning || null]
      );
    }

    await memoryEngine.addWordToLearning(req.userId, wordId);
    res.json({ wordId, word, added: true });
  } catch (error) {
    next(error);
  }
};
