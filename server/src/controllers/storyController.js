import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId, paginate } from '../utils/helpers.js';

export const generateStory = async (req, res, next) => {
  try {
    const { wordIds, level } = req.body;

    let words;
    if (wordIds && wordIds.length > 0) {
      const placeholders = wordIds.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT word FROM words WHERE id IN (${placeholders})`,
        wordIds
      );
      words = rows.map(r => r.word);
    } else {
      const learned = await memoryEngine.getUserVocabularySummary(req.userId);
      const totalLearned = (learned?.mastered_count || 0) + (learned?.learning_count || 0);
      if (totalLearned < 5) {
        const [recentWords] = await pool.execute(
          `SELECT w.word FROM words w
           LEFT JOIN user_vocabulary uw ON w.id = uw.word_id AND uw.user_id = ?
           WHERE uw.user_id IS NULL OR uw.status IN ('mastered', 'long_term')
           ORDER BY RAND() LIMIT 10`,
          [req.userId]
        );
        words = recentWords.map(r => r.word);
      } else {
        const [recentWords] = await pool.execute(
          `SELECT w.word FROM user_vocabulary uw
           JOIN words w ON uw.word_id = w.id
           WHERE uw.user_id = ? AND uw.status IN ('mastered', 'long_term', 'revision')
           ORDER BY RAND() LIMIT 15`,
          [req.userId]
        );
        words = recentWords.map(r => r.word);
      }
    }

    if (words.length < 5) {
      const [extraWords] = await pool.execute(
        `SELECT word FROM words ORDER BY RAND() LIMIT ${10 - words.length}`
      );
      words.push(...extraWords.map(r => r.word));
    }

    const story = await aiService.generateStory(words, level || 'intermediate');

    const id = generateId();
    await pool.execute(
      `INSERT INTO stories (id, user_id, title, content, marathi_translation, hindi_translation,
        grammar_explanation, vocabulary_highlight, reading_time, difficulty_level, word_frequency, words_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, story.title, story.content, story.marathiTranslation,
       story.hindiTranslation, story.grammarExplanation,
       JSON.stringify(story.vocabularyHighlight), story.readingTime,
       story.difficultyLevel, words.length, JSON.stringify(words)]
    );

    await memoryEngine.logActivity(req.userId, 'story_generated', `Generated story: ${story.title}`, 50, 15);

    res.json({ id, ...story });
  } catch (error) {
    next(error);
  }
};

export const getStories = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM stories WHERE user_id = ?', [req.userId]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM stories WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.userId, limit, offset]
    );
    res.json({
      stories: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getStory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM stories WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Story not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE stories SET is_read = true WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    await memoryEngine.logActivity(req.userId, 'story_read', 'Read a story', 15, 5);
    res.json({ message: 'Story marked as read' });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const [story] = await pool.execute(
      'SELECT is_favorite FROM stories WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (story.length === 0) return res.status(404).json({ error: 'Story not found' });
    const newVal = !story[0].is_favorite;
    await pool.execute(
      'UPDATE stories SET is_favorite = ? WHERE id = ? AND user_id = ?',
      [newVal, req.params.id, req.userId]
    );
    res.json({ is_favorite: newVal });
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM stories WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
};
