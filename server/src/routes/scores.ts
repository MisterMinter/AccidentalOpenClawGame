import { Router, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { addScore, getTopScores, getUserBestScore } from '../db/queries.js';

export const scoresRouter = Router();

scoresRouter.get('/leaderboard', (_req: AuthenticatedRequest, res: Response) => {
  const scores = getTopScores(20);
  res.json({ scores });
});

scoresRouter.get('/my-best', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.telegramUser!.id;
  const best = getUserBestScore(userId);
  res.json({ score: best || null });
});

scoresRouter.post('/submit', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.telegramUser!.id;
  const { score, level } = req.body;

  if (typeof score !== 'number' || typeof level !== 'number') {
    res.status(400).json({ error: 'score and level are required numbers' });
    return;
  }

  if (score < 0 || score > 999_999_999 || level < 1 || level > 14) {
    res.status(400).json({ error: 'Invalid score or level value' });
    return;
  }

  addScore(userId, score, level);

  const leaderboard = getTopScores(10);
  const rank = leaderboard.findIndex(e => e.telegram_id === userId && e.score === score) + 1;

  res.json({ success: true, rank: rank || null });
});
