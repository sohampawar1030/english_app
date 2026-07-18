import pool from '../config/database.js';

export const getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [profile] = await pool.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]
    );

    const [dailyProgress] = await pool.execute(
      'SELECT * FROM daily_progress WHERE user_id = ? AND date = ?',
      [req.userId, today]
    );

    const [vocabSummary] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_count,
        SUM(CASE WHEN status = 'revision' THEN 1 ELSE 0 END) as revision_count,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
        SUM(CASE WHEN status = 'long_term' THEN 1 ELSE 0 END) as long_term_count
       FROM user_vocabulary WHERE user_id = ?`,
      [req.userId]
    );

    const [revisionDue] = await pool.execute(
      `SELECT COUNT(*) as count FROM user_vocabulary 
       WHERE user_id = ? AND next_revision <= NOW() 
       AND status IN ('learning', 'revision', 'mastered')`,
      [req.userId]
    );

    const [recentActivity] = await pool.execute(
      'SELECT * FROM learning_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.userId]
    );

    const [weeklyStats] = await pool.execute(
      `SELECT DATE(created_at) as date, 
        SUM(xp_earned) as xp, SUM(coins_earned) as coins,
        COUNT(*) as activities
       FROM learning_activity 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.userId]
    );

    const [heatmap] = await pool.execute(
      `SELECT date, xp_earned, words_learned, words_revised, minutes_active
       FROM daily_progress 
       WHERE user_id = ? 
       ORDER BY date DESC LIMIT 365`,
      [req.userId]
    );

    res.json({
      profile: profile[0] || {},
      dailyProgress: dailyProgress[0] || { words_learned: 0, words_revised: 0, xp_earned: 0, minutes_active: 0 },
      vocabulary: vocabSummary[0] || {},
      revisionDue: revisionDue[0]?.count || 0,
      recentActivity,
      weeklyStats,
      heatmap
    });
  } catch (error) {
    next(error);
  }
};

export const getVocabularyGrowth = async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    let interval;
    switch (period) {
      case 'week': interval = '7 DAY'; break;
      case 'year': interval = '365 DAY'; break;
      default: interval = '30 DAY';
    }

    const [rows] = await pool.execute(
      `SELECT DATE(created_at) as date, 
        SUM(CASE WHEN activity_type = 'new_word' THEN 1 ELSE 0 END) as new_words,
        SUM(CASE WHEN activity_type = 'revision_correct' THEN 1 ELSE 0 END) as correct_revisions,
        SUM(CASE WHEN activity_type = 'revision_incorrect' THEN 1 ELSE 0 END) as incorrect_revisions
       FROM learning_activity 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.userId]
    );

    res.json({ growth: rows });
  } catch (error) {
    next(error);
  }
};

export const getSkillScores = async (req, res, next) => {
  try {
    const [profile] = await pool.execute(
      `SELECT grammar_score, speaking_score, reading_score, writing_score, vocabulary_score,
        overall_score, total_xp, level, current_streak, longest_streak,
        total_words_learned, total_revisions_completed
       FROM user_profiles WHERE user_id = ?`,
      [req.userId]
    );

    res.json(profile[0] || {});
  } catch (error) {
    next(error);
  }
};

export const getWeakWords = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT w.*, uw.memory_score, uw.confidence_score, uw.accuracy, 
        uw.revision_count, uw.status
       FROM user_vocabulary uw
       JOIN words w ON uw.word_id = w.id
       WHERE uw.user_id = ? AND uw.accuracy < 0.6
       ORDER BY uw.accuracy ASC
       LIMIT 20`,
      [req.userId]
    );
    res.json({ words: rows });
  } catch (error) {
    next(error);
  }
};

export const getWeeklyReport = async (req, res, next) => {
  try {
    const [weekly] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT DATE(created_at)) as active_days,
        SUM(xp_earned) as total_xp,
        SUM(coins_earned) as total_coins,
        SUM(CASE WHEN activity_type = 'new_word' THEN 1 ELSE 0 END) as new_words,
        SUM(CASE WHEN activity_type IN ('revision_correct', 'revision_incorrect') THEN 1 ELSE 0 END) as revisions,
        SUM(CASE WHEN activity_type = 'story_generated' OR activity_type = 'story_read' THEN 1 ELSE 0 END) as stories,
        SUM(CASE WHEN activity_type = 'writing' THEN 1 ELSE 0 END) as writing_sessions,
        SUM(CASE WHEN activity_type = 'speaking_practice' THEN 1 ELSE 0 END) as speaking_sessions
       FROM learning_activity 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [req.userId]
    );

    res.json(weekly[0] || {});
  } catch (error) {
    next(error);
  }
};

export const getMonthlyReport = async (req, res, next) => {
  try {
    const [monthly] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT DATE(created_at)) as active_days,
        SUM(xp_earned) as total_xp,
        SUM(coins_earned) as total_coins,
        SUM(CASE WHEN activity_type = 'new_word' THEN 1 ELSE 0 END) as new_words,
        SUM(CASE WHEN activity_type IN ('revision_correct', 'revision_incorrect') THEN 1 ELSE 0 END) as revisions
       FROM learning_activity 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.userId]
    );

    const [dailyAvg] = await pool.execute(
      `SELECT AVG(xp_earned) as avg_daily_xp FROM learning_activity 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.userId]
    );

    res.json({ ...monthly[0], avgDailyXp: dailyAvg[0]?.avg_daily_xp || 0 });
  } catch (error) {
    next(error);
  }
};

export const getAllTimeStats = async (req, res, next) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_activities,
        SUM(xp_earned) as total_xp,
        SUM(coins_earned) as total_coins,
        COUNT(DISTINCT DATE(created_at)) as total_active_days
       FROM learning_activity 
       WHERE user_id = ?`,
      [req.userId]
    );

    const [profile] = await pool.execute(
      `SELECT total_xp, level, coins, current_streak, longest_streak,
        total_words_learned, overall_score
       FROM user_profiles WHERE user_id = ?`,
      [req.userId]
    );

    res.json({ ...stats[0], ...profile[0] });
  } catch (error) {
    next(error);
  }
};
