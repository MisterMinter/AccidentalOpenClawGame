CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS saves (
  telegram_id INTEGER PRIMARY KEY,
  current_level INTEGER DEFAULT 1,
  unlocked_levels INTEGER DEFAULT 1,
  score INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 3,
  health INTEGER DEFAULT 100,
  ammo_pistol INTEGER DEFAULT 10,
  ammo_dynamite INTEGER DEFAULT 5,
  ammo_magic INTEGER DEFAULT 3,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_telegram ON scores(telegram_id);
