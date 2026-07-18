import pool from '../config/database.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT total_xp, level, coins, current_streak, longest_streak 
       FROM user_profiles WHERE user_id = ?`,
      [req.userId]
    );
    res.json(rows[0] || { total_xp: 0, level: 1, coins: 0, current_streak: 0, longest_streak: 0 });
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    const [allBadges] = await pool.execute(
      `SELECT DISTINCT name, description, badge_icon, badge_color, category, xp_reward, coin_reward
       FROM achievements`
    );
    res.json({ achievements: rows, available: allBadges });
  } catch (error) {
    next(error);
  }
};

export const getMissions = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await ensureDailyMissions(req.userId, today);

    const [missions] = await pool.execute(
      `SELECT * FROM missions 
       WHERE user_id = ? 
       ORDER BY FIELD(mission_type, 'daily', 'weekly', 'monthly'), created_at ASC`,
      [req.userId]
    );
    res.json({ missions });
  } catch (error) {
    next(error);
  }
};

export const claimMission = async (req, res, next) => {
  try {
    const [mission] = await pool.execute(
      'SELECT * FROM missions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (mission.length === 0) return res.status(404).json({ error: 'Mission not found' });
    if (!mission[0].is_completed) return res.status(400).json({ error: 'Mission not completed' });
    if (mission[0].is_reward_claimed) return res.status(400).json({ error: 'Reward already claimed' });

    await pool.execute(
      `UPDATE user_profiles 
       SET total_xp = total_xp + ?, coins = coins + ?
       WHERE user_id = ?`,
      [mission[0].xp_reward, mission[0].coin_reward, req.userId]
    );

    await pool.execute(
      'UPDATE missions SET is_reward_claimed = true WHERE id = ?',
      [req.params.id]
    );

    await memoryEngine.logActivity(req.userId, 'mission_claim', `Claimed mission reward`, mission[0].xp_reward, mission[0].coin_reward);

    res.json({ message: 'Reward claimed', xp: mission[0].xp_reward, coins: mission[0].coin_reward });
  } catch (error) {
    next(error);
  }
};

export const spinWheel = async (req, res, next) => {
  try {
    const rewards = [
      { type: 'xp', amount: 50, label: '50 XP' },
      { type: 'xp', amount: 100, label: '100 XP' },
      { type: 'coins', amount: 30, label: '30 Coins' },
      { type: 'xp', amount: 25, label: '25 XP' },
      { type: 'coins', amount: 50, label: '50 Coins' },
      { type: 'xp', amount: 200, label: '200 XP' },
      { type: 'coins', amount: 100, label: '100 Coins' },
      { type: 'xp', amount: 10, label: '10 XP' }
    ];

    const today = new Date().toISOString().split('T')[0];
    const [existing] = await pool.execute(
      `SELECT id FROM learning_activity 
       WHERE user_id = ? AND activity_type = 'wheel_spin' 
       AND DATE(created_at) = ?`,
      [req.userId, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already spun today' });
    }

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const multiplier = Math.random() < 0.05 ? 5 : 1;
    const finalAmount = reward.amount * multiplier;

    if (reward.type === 'xp') {
      await pool.execute(
        'UPDATE user_profiles SET total_xp = total_xp + ? WHERE user_id = ?',
        [finalAmount, req.userId]
      );
    } else {
      await pool.execute(
        'UPDATE user_profiles SET coins = coins + ? WHERE user_id = ?',
        [finalAmount, req.userId]
      );
    }

    await memoryEngine.logActivity(req.userId, 'wheel_spin', `Spin wheel: ${finalAmount} ${reward.type}`, 
      reward.type === 'xp' ? finalAmount : 0, reward.type === 'coins' ? finalAmount : 0);

    res.json({
      reward: { type: reward.type, amount: finalAmount, multiplier },
      label: multiplier > 1 ? `${finalAmount} ${reward.type} (${multiplier}x!)` : `${finalAmount} ${reward.type}`
    });
  } catch (error) {
    next(error);
  }
};

export const openTreasure = async (req, res, next) => {
  try {
    const rewards = [
      { type: 'xp', min: 10, max: 50 },
      { type: 'coins', min: 5, max: 30 },
      { type: 'xp', min: 30, max: 100 }
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

    if (reward.type === 'xp') {
      await pool.execute(
        'UPDATE user_profiles SET total_xp = total_xp + ? WHERE user_id = ?',
        [amount, req.userId]
      );
    } else {
      await pool.execute(
        'UPDATE user_profiles SET coins = coins + ? WHERE user_id = ?',
        [amount, req.userId]
      );
    }

    await memoryEngine.logActivity(req.userId, 'treasure_opened', `Opened treasure: ${amount} ${reward.type}`,
      reward.type === 'xp' ? amount : 0, reward.type === 'coins' ? amount : 0);

    res.json({ reward: { type: reward.type, amount } });
  } catch (error) {
    next(error);
  }
};

export const submitGameScore = async (req, res, next) => {
  try {
    const { gameType, score, maxScore } = req.body;
    if (!gameType || score === undefined) {
      return res.status(400).json({ error: 'Game type and score are required' });
    }

    const xpEarned = Math.floor(score * 2);
    const coinsEarned = Math.floor(score);
    const percentage = maxScore ? (score / maxScore) * 100 : 0;

    await pool.execute(
      'UPDATE user_profiles SET total_xp = total_xp + ?, coins = coins + ? WHERE user_id = ?',
      [xpEarned, coinsEarned, req.userId]
    );

    await memoryEngine.logActivity(req.userId, `game_${gameType}`, `Played ${gameType}: ${score}/${maxScore || score}`,
      xpEarned, coinsEarned);

    const [profile] = await pool.execute(
      'SELECT level FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );

    const newLevel = Math.floor(1 + Math.sqrt((profile[0]?.total_xp || 0) / 100));

    if (newLevel > (profile[0]?.level || 1)) {
      await pool.execute(
        'UPDATE user_profiles SET level = ? WHERE user_id = ?',
        [newLevel, req.userId]
      );
      await memoryEngine.logActivity(req.userId, 'level_up', `Reached level ${newLevel}!`, 100, 50);
    }

    res.json({
      score,
      percentage,
      xpEarned,
      coinsEarned,
      level: newLevel,
      leveledUp: newLevel > (profile[0]?.level || 1)
    });
  } catch (error) {
    next(error);
  }
};

async function ensureDailyMissions(userId, today) {
  const [existingDaily] = await pool.execute(
    `SELECT id FROM missions WHERE user_id = ? AND mission_type = 'daily' AND DATE(starts_at) = ?`,
    [userId, today]
  );

  if (existingDaily.length === 0) {
    const dailies = [
      { title: 'Learn 5 New Words', desc: 'Add 5 new words to your vocabulary', type: 'new_words', count: 5, xp: 50, coins: 20 },
      { title: 'Review 10 Words', desc: 'Complete 10 word revisions', type: 'revisions', count: 10, xp: 40, coins: 15 },
      { title: 'Read a Story', desc: 'Read one AI-generated story', type: 'stories', count: 1, xp: 30, coins: 10 },
      { title: 'Write 3 Sentences', desc: 'Write 3 sentences in English', type: 'writing', count: 3, xp: 35, coins: 12 },
      { title: 'Practice Speaking', desc: 'Complete one speaking exercise', type: 'speaking', count: 1, xp: 45, coins: 18 }
    ];

    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');

    for (const daily of dailies) {
      const id = generateId();
      await pool.execute(
        `INSERT INTO missions (id, user_id, title, description, mission_type, 
          xp_reward, coin_reward, requirement_type, requirement_count, starts_at, ends_at)
         VALUES (?, ?, ?, ?, 'daily', ?, ?, ?, ?, ?, ?)`,
        [id, userId, daily.title, daily.desc, daily.xp, daily.coins,
         daily.type, daily.count, startOfDay, endOfDay]
      );
    }
  }
}

export const updateMissionProgress = async (req, res, next) => {
  try {
    const { missionType, progressAmount = 1 } = req.body;
    const today = new Date().toISOString().split('T')[0];

    await ensureDailyMissions(req.userId, today);

    await pool.execute(
      `UPDATE missions 
       SET progress = LEAST(progress + ?, requirement_count),
           is_completed = CASE WHEN progress + ? >= requirement_count THEN true ELSE is_completed END,
           completed_at = CASE WHEN progress + ? >= requirement_count AND is_completed = false THEN NOW() ELSE completed_at END
       WHERE user_id = ? AND mission_type = ? AND is_completed = false
       AND requirement_type = ?`,
      [progressAmount, progressAmount, progressAmount, req.userId, missionType, missionType]
    );

    res.json({ message: 'Progress updated' });
  } catch (error) {
    next(error);
  }
};
