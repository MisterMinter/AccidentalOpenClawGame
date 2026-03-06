import { telegram } from './TelegramBridge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (telegram.initData) {
    headers['X-Telegram-Init-Data'] = telegram.initData;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getLeaderboard() {
    return apiFetch('/api/scores/leaderboard');
  },

  async submitScore(score: number, level: number) {
    return apiFetch('/api/scores/submit', {
      method: 'POST',
      body: JSON.stringify({ score, level }),
    });
  },

  async getMyBestScore() {
    return apiFetch('/api/scores/my-best');
  },

  async saveGame(data: {
    current_level: number;
    unlocked_levels: number;
    score: number;
    lives: number;
    health: number;
    ammo_pistol: number;
    ammo_dynamite: number;
    ammo_magic: number;
  }) {
    return apiFetch('/api/saves/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async loadGame() {
    return apiFetch('/api/saves/load');
  },

  async deleteSave() {
    return apiFetch('/api/saves/delete', { method: 'DELETE' });
  },
};
