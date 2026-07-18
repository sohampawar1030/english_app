import pool from '../config/database.js';
import memoryEngine from '../services/memoryEngine.js';
import aiService from '../services/aiService.js';
import { generateId, paginate } from '../utils/helpers.js';

export const getWords = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { difficulty, category, search } = req.query;

    let query = 'SELECT * FROM words WHERE 1=1';
    const params = [];

    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND word LIKE ?'; params.push(`%${search}%`); }

    const [countResult] = await pool.execute(
      query.replace('SELECT *', 'SELECT COUNT(*) as total'), params
    );
    const total = countResult[0].total;

    query += ' ORDER BY frequency DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    res.json({ words: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getWord = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM words WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Word not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createWord = async (req, res, next) => {
  try {
    const {
      word, ipa_pronunciation, marathi_meaning, hindi_meaning, english_meaning,
      synonyms, antonyms, root_word, word_family, difficulty, part_of_speech,
      category, technical_category, examples
    } = req.body;

    if (!word) return res.status(400).json({ error: 'Word is required' });

    const [existing] = await pool.execute('SELECT id FROM words WHERE word = ?', [word]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Word already exists', id: existing[0].id });
    }

    const id = generateId();
    await pool.execute(
      `INSERT INTO words (id, word, ipa_pronunciation, marathi_meaning, hindi_meaning, 
        english_meaning, synonyms, antonyms, root_word, word_family, difficulty, 
        part_of_speech, category, technical_category, examples)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, word, ipa_pronunciation, marathi_meaning, hindi_meaning, english_meaning,
       synonyms ? JSON.stringify(synonyms) : null, antonyms ? JSON.stringify(antonyms) : null,
       root_word, word_family ? JSON.stringify(word_family) : null,
       difficulty || 'intermediate', part_of_speech, category, technical_category,
       examples ? JSON.stringify(examples) : null]
    );

    res.status(201).json({ id, word });
  } catch (error) {
    next(error);
  }
};

export const addToLearning = async (req, res, next) => {
  try {
    const result = await memoryEngine.addWordToLearning(req.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getNewWords = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const words = await memoryEngine.getNewWords(req.userId, limit);
    res.json({ words });
  } catch (error) {
    next(error);
  }
};

export const getLearningWords = async (req, res, next) => {
  try {
    const words = await memoryEngine.getWordsForRevision(req.userId);
    res.json({ words });
  } catch (error) {
    next(error);
  }
};

export const reviewWord = async (req, res, next) => {
  try {
    const { correct, responseTimeMs, confidence } = req.body;
    const result = await memoryEngine.processRevision(
      req.userId, req.params.id, correct, responseTimeMs || 3000, confidence || 0.5
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getWordStats = async (req, res, next) => {
  try {
    const stats = await memoryEngine.getWordStats(req.userId, req.params.id);
    if (!stats) return res.status(404).json({ error: 'Word not found in your vocabulary' });
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getVocabularySummary = async (req, res, next) => {
  try {
    const summary = await memoryEngine.getUserVocabularySummary(req.userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getAutoSuggest = async (req, res, next) => {
  try {
    const { word } = req.query;
    if (!word) return res.status(400).json({ error: 'Word parameter required' });

    const explanation = await aiService.generateWordExplanation(word);
    res.json(explanation);
  } catch (error) {
    next(error);
  }
};

export const bulkAddWords = async (req, res, next) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required' });
    }

    const results = [];
    for (const w of words) {
      const [existing] = await pool.execute('SELECT id FROM words WHERE word = ?', [w.word]);
      if (existing.length > 0) {
        results.push({ word: w.word, id: existing[0].id, status: 'exists' });
      } else {
        const id = generateId();
        await pool.execute(
          `INSERT INTO words (id, word, ipa_pronunciation, marathi_meaning, hindi_meaning,
            english_meaning, difficulty, part_of_speech, category, technical_category)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, w.word, w.ipa || null, w.marathi || null, w.hindi || null,
           w.english || null, w.difficulty || 'intermediate', w.pos || null,
           w.category || null, w.techCategory || null]
        );
        results.push({ word: w.word, id, status: 'created' });
      }
    }
    res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getMyVocabulary = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    let query = `SELECT uw.*, w.word, w.ipa_pronunciation, w.audio_url,
      w.english_meaning, w.marathi_meaning, w.hindi_meaning,
      w.synonyms, w.antonyms, w.part_of_speech, w.difficulty, w.category, w.examples
      FROM user_vocabulary uw
      JOIN words w ON uw.word_id = w.id
      WHERE uw.user_id = ?`;
    const params = [req.userId];

    if (status && status !== 'all') {
      query += ' AND uw.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (w.word LIKE ? OR w.english_meaning LIKE ? OR w.marathi_meaning LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const sortMap = {
      name: 'w.word ASC',
      score: 'uw.memory_score DESC',
      nextRevision: 'uw.next_revision ASC',
      recent: 'uw.created_at DESC',
    };
    query += ' ORDER BY ' + (sortMap[sort] || 'uw.created_at DESC');

    const [rows] = await pool.execute(query, params);
    res.json({ words: rows });
  } catch (error) {
    next(error);
  }
};

export const removeFromVocabulary = async (req, res, next) => {
  try {
    const { wordId } = req.params;
    await pool.execute(
      'DELETE FROM user_vocabulary WHERE user_id = ? AND word_id = ?',
      [req.userId, wordId]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const lookupWord = async (req, res, next) => {
  try {
    const { word, noai } = req.query;
    if (!word || !word.trim()) return res.status(400).json({ error: 'Word is required' });

    const clean = word.trim().toLowerCase().replace(/[^a-zA-Z]/g, '');
    if (!clean) return res.status(400).json({ error: 'Invalid word' });

    const [rows] = await pool.execute(
      `SELECT id, word, ipa_pronunciation, marathi_meaning, english_meaning,
        hindi_meaning, part_of_speech, synonyms, antonyms, examples
       FROM words WHERE word = ?`,
      [clean]
    );

    if (rows.length > 0) {
      const w = rows[0];
      const [uv] = await pool.execute(
        'SELECT id FROM user_vocabulary WHERE user_id = ? AND word_id = ?',
        [req.userId, w.id]
      );
      return res.json({
        word_id: w.id,
        word: w.word,
        marathi_meaning: w.marathi_meaning,
        english_meaning: w.english_meaning,
        hindi_meaning: w.hindi_meaning,
        ipa_pronunciation: w.ipa_pronunciation,
        part_of_speech: w.part_of_speech,
        synonyms: w.synonyms,
        antonyms: w.antonyms,
        examples: w.examples,
        in_vocabulary: uv.length > 0,
        found: true,
      });
    }

    if (noai === 'true') {
      return res.json({ word: clean, found: false, marathi_meaning: null });
    }

    const explanation = await aiService.generateWordExplanation(clean);
    return res.json({
      word_id: null,
      word: explanation.word || clean,
      marathi_meaning: explanation.marathiMeaning || null,
      english_meaning: explanation.englishMeaning || null,
      hindi_meaning: explanation.hindiMeaning || null,
      ipa_pronunciation: explanation.ipaPronunciation || null,
      part_of_speech: explanation.partOfSpeech || null,
      synonyms: explanation.synonyms || [],
      antonyms: explanation.antonyms || [],
      examples: explanation.examples || [],
      in_vocabulary: false,
      found: false,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSentences = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) return res.status(400).json({ error: 'Word is required' });

    const sentences = await aiService.generateWordSentences(word.trim().toLowerCase());
    res.json({ word: sentences.word || word, sentences });
  } catch (error) {
    console.error('Sentence Generation Error:', error.message);
    if (error.message?.includes('JSON') || error.message?.includes('token') || error.message?.includes('AI request')) {
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }
    next(error);
  }
};

export const analyzeWord = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) return res.status(400).json({ error: 'Please enter a word to analyze' });

    const analysis = await aiService.generateComprehensiveWordAnalysis(word.trim().toLowerCase());

    let wordId = null;
    const [existing] = await pool.execute('SELECT id FROM words WHERE word = ?', [analysis.word]);
    if (existing.length > 0) {
      wordId = existing[0].id;
    } else {
      wordId = generateId();
      await pool.execute(
        `INSERT INTO words (id, word, ipa_pronunciation, marathi_meaning, english_meaning,
          part_of_speech, difficulty, examples)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [wordId, analysis.word, analysis.ipaPronunciation || null,
         analysis.marathiMeaning || null, analysis.englishMeaning || null,
         analysis.partOfSpeech || null, 'intermediate',
         analysis.realLifeSentences ? JSON.stringify(analysis.realLifeSentences.map(s => s.english)) : null]
      );
    }

    await memoryEngine.addWordToLearning(req.userId, wordId);

    res.json({ wordId, analysis });
  } catch (error) {
    console.error('Word Analysis Error:', error.message);
    if (error.message?.includes('JSON') || error.message?.includes('token') || error.message?.includes('AI request')) {
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }
    next(error);
  }
};

export const getRevisionWords = async (req, res, next) => {
  try {
    const words = await memoryEngine.getWordsNeedingReview(req.userId);
    res.json({ words });
  } catch (error) {
    next(error);
  }
};
