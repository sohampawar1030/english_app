import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import authRoutes from './routes/auth.js';
import wordRoutes from './routes/words.js';
import storyRoutes from './routes/stories.js';
import chatRoutes from './routes/chat.js';
import grammarRoutes from './routes/grammar.js';
import speakingRoutes from './routes/speaking.js';
import interviewRoutes from './routes/interviews.js';
import writingRoutes from './routes/writing.js';
import readingRoutes from './routes/reading.js';
import gameRoutes from './routes/games.js';
import knowledgeRoutes from './routes/knowledge.js';
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';
import missionRoutes from './routes/missions.js';

import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/speaking', speakingRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/missions', missionRoutes);

app.use(errorHandler);

export default app;
