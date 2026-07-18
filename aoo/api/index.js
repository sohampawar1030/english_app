import app from './app.js';
import { startScheduler, cleanupActivity } from './services/scheduler.js';

app.post('/api/cron/cleanup-activity', async (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET || 'local-cron-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await cleanupActivity();
  res.json({ success: true });
});

startScheduler();

export default app;