import express from 'express';
import cors from 'cors';
import { initDb } from './db/queries.js';
import { authMiddleware, authRouter } from './routes/auth.js';
import { scoresRouter } from './routes/scores.js';
import { savesRouter } from './routes/saves.js';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

initDb();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Telegram-Init-Data'],
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/api', authMiddleware as any);
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/saves', savesRouter);

app.listen(PORT, () => {
  console.log(`OpenClaw server running on port ${PORT}`);
});
