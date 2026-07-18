import pool from '../config/database.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const searchTerm = `%${q}%`;
    const results = {};

    if (!type || type === 'words') {
      const [words] = await pool.execute(
        `SELECT w.*, uw.status, uw.memory_score
         FROM words w
         LEFT JOIN user_vocabulary uw ON w.id = uw.word_id AND uw.user_id = ?
         WHERE w.word LIKE ? OR w.english_meaning LIKE ? OR w.marathi_meaning LIKE ? OR w.hindi_meaning LIKE ?
         LIMIT 20`,
        [req.userId, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      results.words = words;
    }

    if (!type || type === 'stories') {
      const [stories] = await pool.execute(
        `SELECT id, title, difficulty_level, reading_time, is_read, is_favorite, created_at
         FROM stories WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
         LIMIT 10`,
        [req.userId, searchTerm, searchTerm]
      );
      results.stories = stories;
    }

    if (!type || type === 'notes') {
      const [notes] = await pool.execute(
        `SELECT id, title, category, sub_category, is_favorite, updated_at
         FROM knowledge_notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
         LIMIT 10`,
        [req.userId, searchTerm, searchTerm]
      );
      results.notes = notes;
    }

    if (!type || type === 'grammar') {
      const [grammar] = await pool.execute(
        `SELECT id, exercise_type, score, created_at
         FROM grammar_exercises WHERE user_id = ? AND (user_input LIKE ? OR corrected_text LIKE ?)
         LIMIT 10`,
        [req.userId, searchTerm, searchTerm]
      );
      results.grammar = grammar;
    }

    if (!type || type === 'writing') {
      const [writings] = await pool.execute(
        `SELECT id, writing_type, title, score, word_count, created_at
         FROM writing_sessions WHERE user_id = ? AND (content LIKE ? OR title LIKE ?)
         LIMIT 10`,
        [req.userId, searchTerm, searchTerm]
      );
      results.writings = writings;
    }

    if (!type || type === 'reading') {
      const [readings] = await pool.execute(
        `SELECT id, reading_type, title, is_completed, created_at
         FROM reading_sessions WHERE user_id = ? AND (content LIKE ? OR title LIKE ?)
         LIMIT 10`,
        [req.userId, searchTerm, searchTerm]
      );
      results.readings = readings;
    }

    if (!type || type === 'chat') {
      const [chats] = await pool.execute(
        `SELECT id, role, LEFT(content, 200) as preview, message_type, created_at
         FROM chat_history WHERE user_id = ? AND content LIKE ?
         ORDER BY created_at DESC LIMIT 20`,
        [req.userId, searchTerm]
      );
      results.chatMessages = chats;
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const [words] = await pool.execute(
      `SELECT word FROM words WHERE word LIKE ? LIMIT 5`,
      [`${q}%`]
    );

    const [notes] = await pool.execute(
      `SELECT title FROM knowledge_notes WHERE user_id = ? AND title LIKE ? LIMIT 3`,
      [req.userId, `%${q}%`]
    );

    const [stories] = await pool.execute(
      `SELECT title FROM stories WHERE user_id = ? AND title LIKE ? LIMIT 3`,
      [req.userId, `%${q}%`]
    );

    res.json({
      suggestions: [
        ...words.map(w => ({ text: w.word, type: 'word' })),
        ...notes.map(n => ({ text: n.title, type: 'note' })),
        ...stories.map(s => ({ text: s.title, type: 'story' }))
      ]
    });
  } catch (error) {
    next(error);
  }
};
