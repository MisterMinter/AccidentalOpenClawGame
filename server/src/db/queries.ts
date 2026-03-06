import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database;

export function initDb(): void {
  db = new Database(join(__dirname, '../../data/openclaw.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

export interface User {
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
}

export function upsertUser(user: User): void {
  db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, last_name, last_seen)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      last_seen = datetime('now')
  `).run(user.telegram_id, user.username, user.first_name, user.last_name);
}

export interface ScoreEntry {
  telegram_id: number;
  username: string | null;
  first_name: string;
  score: number;
  level: number;
  created_at: string;
}

export function addScore(telegramId: number, score: number, level: number): void {
  db.prepare(`
    INSERT INTO scores (telegram_id, score, level) VALUES (?, ?, ?)
  `).run(telegramId, score, level);
}

export function getTopScores(limit: number = 20): ScoreEntry[] {
  return db.prepare(`
    SELECT s.telegram_id, u.username, u.first_name, s.score, s.level, s.created_at
    FROM scores s
    JOIN users u ON s.telegram_id = u.telegram_id
    ORDER BY s.score DESC
    LIMIT ?
  `).all(limit) as ScoreEntry[];
}

export function getUserBestScore(telegramId: number): ScoreEntry | undefined {
  return db.prepare(`
    SELECT s.telegram_id, u.username, u.first_name, s.score, s.level, s.created_at
    FROM scores s
    JOIN users u ON s.telegram_id = u.telegram_id
    WHERE s.telegram_id = ?
    ORDER BY s.score DESC
    LIMIT 1
  `).get(telegramId) as ScoreEntry | undefined;
}

export interface SaveData {
  telegram_id: number;
  current_level: number;
  unlocked_levels: number;
  score: number;
  lives: number;
  health: number;
  ammo_pistol: number;
  ammo_dynamite: number;
  ammo_magic: number;
}

export function saveGame(data: SaveData): void {
  db.prepare(`
    INSERT INTO saves (telegram_id, current_level, unlocked_levels, score, lives, health, ammo_pistol, ammo_dynamite, ammo_magic, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(telegram_id) DO UPDATE SET
      current_level = excluded.current_level,
      unlocked_levels = excluded.unlocked_levels,
      score = excluded.score,
      lives = excluded.lives,
      health = excluded.health,
      ammo_pistol = excluded.ammo_pistol,
      ammo_dynamite = excluded.ammo_dynamite,
      ammo_magic = excluded.ammo_magic,
      updated_at = datetime('now')
  `).run(
    data.telegram_id, data.current_level, data.unlocked_levels,
    data.score, data.lives, data.health,
    data.ammo_pistol, data.ammo_dynamite, data.ammo_magic
  );
}

export function loadGame(telegramId: number): SaveData | undefined {
  return db.prepare(`
    SELECT * FROM saves WHERE telegram_id = ?
  `).get(telegramId) as SaveData | undefined;
}

export function deleteSave(telegramId: number): void {
  db.prepare('DELETE FROM saves WHERE telegram_id = ?').run(telegramId);
}
