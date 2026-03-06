import { Router, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { saveGame, loadGame, deleteSave } from '../db/queries.js';

export const savesRouter = Router();

savesRouter.get('/load', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.telegramUser!.id;
  const save = loadGame(userId);
  res.json({ save: save || null });
});

savesRouter.post('/save', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.telegramUser!.id;
  const { current_level, unlocked_levels, score, lives, health, ammo_pistol, ammo_dynamite, ammo_magic } = req.body;

  if (typeof current_level !== 'number' || typeof score !== 'number') {
    res.status(400).json({ error: 'Invalid save data' });
    return;
  }

  saveGame({
    telegram_id: userId,
    current_level: Math.max(1, Math.min(14, current_level)),
    unlocked_levels: Math.max(1, Math.min(14, unlocked_levels || current_level)),
    score: Math.max(0, Math.min(999_999_999, score)),
    lives: Math.max(0, Math.min(99, lives ?? 3)),
    health: Math.max(0, Math.min(200, health ?? 100)),
    ammo_pistol: Math.max(0, Math.min(99, ammo_pistol ?? 10)),
    ammo_dynamite: Math.max(0, Math.min(99, ammo_dynamite ?? 5)),
    ammo_magic: Math.max(0, Math.min(99, ammo_magic ?? 3)),
  });

  res.json({ success: true });
});

savesRouter.delete('/delete', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.telegramUser!.id;
  deleteSave(userId);
  res.json({ success: true });
});
