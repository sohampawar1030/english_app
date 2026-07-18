import cron from 'node-cron';
import pool from '../config/database.js';

async function cleanupActivity() {
  try {
    const [activity] = await pool.execute('DELETE FROM learning_activity');
    const [readings] = await pool.execute('DELETE FROM reading_sessions');
    const [stories] = await pool.execute('DELETE FROM stories');
    console.log(`[Cleanup] Deleted ${activity.affectedRows} activity, ${readings.affectedRows} reading sessions, ${stories.affectedRows} stories at midnight IST`);
  } catch (error) {
    console.error('[Cleanup] Error:', error.message);
  }
}

export function startScheduler() {
  cron.schedule('0 0 * * *', () => {
    cleanupActivity();
  }, {
    timezone: 'Asia/Kolkata'
  });
  console.log('[Scheduler] Midnight IST cleanup cron job registered (0 0 * * * Asia/Kolkata)');
}

export { cleanupActivity };
