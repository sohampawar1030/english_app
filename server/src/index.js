import app from './app.js';
import { startScheduler } from './services/scheduler.js';

const PORT = process.env.PORT || 5000;

startScheduler();

app.listen(PORT, () => {
  console.log(`🚀 English OS Server running on port ${PORT}`);
});
