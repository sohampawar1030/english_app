import pool from '../config/database.js';
import { generateId, calculateNextRevision, calculateMemoryScore, getStatusFromMemoryScore } from '../utils/helpers.js';

class MemoryEngine {
  async getWordsForRevision(userId) {
    const [rows] = await pool.execute(
      `SELECT uw.*, w.word, w.ipa_pronunciation, w.audio_url, w.english_meaning, 
              w.marathi_meaning, w.hindi_meaning, w.synonyms, w.antonyms,
              w.part_of_speech, w.difficulty, w.category, w.examples
       FROM user_vocabulary uw
       JOIN words w ON uw.word_id = w.id
       WHERE uw.user_id = ? 
         AND (uw.next_revision IS NULL OR uw.next_revision <= NOW())
         AND uw.status IN ('learning', 'revision', 'mastered')
       ORDER BY uw.next_revision ASC NULLS LAST
       LIMIT 20`,
      [userId]
    );
    return rows;
  }

  async getNewWords(userId, limit = 10) {
    const [rows] = await pool.execute(
      `SELECT w.* FROM words w
       WHERE w.id NOT IN (
         SELECT word_id FROM user_vocabulary WHERE user_id = ?
       )
       ORDER BY w.difficulty ASC, w.frequency DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  async addWordToLearning(userId, wordId) {
    const id = generateId();
    const now = new Date();
    const nextRevision = new Date(now.setDate(now.getDate() + 1));

    await pool.execute(
      `INSERT INTO user_vocabulary (id, user_id, word_id, status, next_revision)
       VALUES (?, ?, ?, 'learning', ?)
       ON DUPLICATE KEY UPDATE status = 'learning', updated_at = NOW()`,
      [id, userId, wordId, nextRevision]
    );

    await this.logActivity(userId, 'new_word', 'Started learning a new word', 10, 5);
    return { id, wordId, status: 'learning', nextRevision };
  }

  async processRevision(userId, wordId, correct, responseTimeMs, confidence = 0.5) {
    const [existing] = await pool.execute(
      `SELECT * FROM user_vocabulary WHERE user_id = ? AND word_id = ?`,
      [userId, wordId]
    );

    if (existing.length === 0) {
      throw new Error('Word not found in user vocabulary');
    }

    const word = existing[0];
    const revisionCount = word.revision_count + 1;
    const accuracy = correct ? Math.min((word.accuracy || 0) + 0.1, 1) : Math.max((word.accuracy || 0) - 0.2, 0);
    const newConfidence = correct ? Math.min(confidence + 0.1, 1) : Math.max(confidence - 0.2, 0);

    const { nextRevision, nextInterval } = calculateNextRevision(correct, 1, revisionCount);
    const memoryScore = calculateMemoryScore(accuracy, newConfidence, revisionCount, responseTimeMs);
    const status = getStatusFromMemoryScore(memoryScore);

    const logId = generateId();
    await pool.execute(
      `INSERT INTO revision_log (id, user_id, word_id, revision_type, correct, response_time_ms, 
        confidence_before, confidence_after, interval_day)
       VALUES (?, ?, ?, 'review', ?, ?, ?, ?, ?)`,
      [logId, userId, wordId, correct, responseTimeMs, word.confidence_score, newConfidence, nextInterval]
    );

    await pool.execute(
      `UPDATE user_vocabulary 
       SET status = ?, memory_score = ?, confidence_score = ?, accuracy = ?,
           last_seen = NOW(), next_revision = ?, revision_count = ?,
           learning_time_seconds = learning_time_seconds + ?
       WHERE user_id = ? AND word_id = ?`,
      [status, memoryScore, newConfidence, accuracy, nextRevision, revisionCount, Math.floor(responseTimeMs / 1000), userId, wordId]
    );

    if (correct) {
      const xpEarned = status === 'mastered' || status === 'long_term' ? 20 : 10;
      const coinsEarned = status === 'mastered' || status === 'long_term' ? 10 : 5;
      await this.logActivity(userId, 'revision_correct', `Correct revision: ${wordId}`, xpEarned, coinsEarned);
    } else {
      await this.logActivity(userId, 'revision_incorrect', `Incorrect revision: ${wordId}`, 2, 1);
    }

    await this.updateUserProgress(userId);

    return {
      wordId,
      correct,
      memoryScore,
      confidence: newConfidence,
      accuracy,
      status,
      revisionCount,
      nextRevision,
      xpEarned: correct ? (status === 'mastered' || status === 'long_term' ? 20 : 10) : 2
    };
  }

  async getWordStats(userId, wordId) {
    const [rows] = await pool.execute(
      `SELECT uw.*, w.*,
        (SELECT COUNT(*) FROM revision_log WHERE user_id = ? AND word_id = ? AND correct = true) as correct_count,
        (SELECT COUNT(*) FROM revision_log WHERE user_id = ? AND word_id = ?) as total_revisions
       FROM user_vocabulary uw
       JOIN words w ON uw.word_id = w.id
       WHERE uw.user_id = ? AND uw.word_id = ?`,
      [userId, wordId, userId, wordId, userId, wordId]
    );
    return rows[0] || null;
  }

  async getDueWordsCount(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM user_vocabulary 
       WHERE user_id = ? AND next_revision <= NOW() 
       AND status IN ('learning', 'revision', 'mastered')`,
      [userId]
    );
    return rows[0].count;
  }

  async getUserVocabularySummary(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_count,
        SUM(CASE WHEN status = 'revision' THEN 1 ELSE 0 END) as revision_count,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
        SUM(CASE WHEN status = 'long_term' THEN 1 ELSE 0 END) as long_term_count,
        COUNT(*) as total
       FROM user_vocabulary WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  async logActivity(userId, type, description, xp = 0, coins = 0, metadata = {}) {
    const id = generateId();
    await pool.execute(
      `INSERT INTO learning_activity (id, user_id, activity_type, description, xp_earned, coins_earned, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, type, description, xp, coins, JSON.stringify(metadata)]
    );

    await pool.execute(
      `UPDATE user_profiles 
       SET total_xp = total_xp + ?, coins = coins + ?
       WHERE user_id = ?`,
      [xp, coins, userId]
    );
  }

  async updateUserProgress(userId) {
    const [wordCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM user_vocabulary WHERE user_id = ? AND status IN ('mastered', 'long_term')`,
      [userId]
    );

    const today = new Date().toISOString().split('T')[0];
    const [dailyExists] = await pool.execute(
      `SELECT id FROM daily_progress WHERE user_id = ? AND date = ?`,
      [userId, today]
    );

    if (dailyExists.length === 0) {
      await pool.execute(
        `INSERT INTO daily_progress (id, user_id, date, words_learned, xp_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [generateId(), userId, today, 0, 0]
      );
    }

    const [profile] = await pool.execute(
      `SELECT * FROM user_profiles WHERE user_id = ?`,
      [userId]
    );

    if (profile.length > 0) {
      const totalWords = wordCount[0].count;
      const level = Math.floor(1 + Math.sqrt((profile[0].total_xp || 0) / 100));

      await pool.execute(
        `UPDATE user_profiles 
         SET total_words_learned = ?, level = ?,
             vocabulary_score = LEAST((? / 1000) * 100, 100),
             overall_score = (
               (vocabulary_score + grammar_score + speaking_score + reading_score + writing_score) / 5
             )
         WHERE user_id = ?`,
        [totalWords, level, totalWords, userId]
      );
    }
  }

  async getWordsNeedingReview(userId) {
    const [rows] = await pool.execute(
      `SELECT uw.*, w.word, w.english_meaning, w.marathi_meaning, w.hindi_meaning
       FROM user_vocabulary uw
       JOIN words w ON uw.word_id = w.id
       WHERE uw.user_id = ? 
         AND uw.status IN ('learning', 'revision')
         AND uw.next_revision <= NOW()
       ORDER BY uw.next_revision ASC
       LIMIT 20`,
      [userId]
    );
    return rows;
  }
}

export default new MemoryEngine();
