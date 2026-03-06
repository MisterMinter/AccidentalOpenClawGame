import { createHmac } from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { upsertUser } from '../db/queries.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  telegramUser?: TelegramUser;
}

export function validateInitData(initData: string): TelegramUser | null {
  if (!BOT_TOKEN || !initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = createHmac('sha256', secretKey).update(sortedParams).digest('hex');

    if (computedHash !== hash) return null;

    const authDate = parseInt(params.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!BOT_TOKEN) {
    req.telegramUser = { id: 0, first_name: 'Dev' };
    next();
    return;
  }

  const user = validateInitData(initData);
  if (!user) {
    res.status(401).json({ error: 'Invalid authentication' });
    return;
  }

  upsertUser({
    telegram_id: user.id,
    username: user.username || null,
    first_name: user.first_name,
    last_name: user.last_name || null,
  });

  req.telegramUser = user;
  next();
}

export const authRouter = Router();

authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.telegramUser });
});
