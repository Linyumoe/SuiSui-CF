-- 碎碎 SuiSui — Cloudflare D1 初始表结构
-- 与旧 Go 版 SQLite schema 对齐，字段语义完全一致

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  created_at INTEGER DEFAULT 0,
  theme_color TEXT DEFAULT '#1976D2',
  app_icon TEXT DEFAULT '',
  salt TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  pinned INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  username TEXT,
  avatar TEXT,
  nickname TEXT,
  pin_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS reactions (
  id TEXT,
  emoji TEXT,
  username TEXT,
  PRIMARY KEY (id, emoji, username)
);

CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  content TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  pinned INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  username TEXT,
  avatar TEXT,
  nickname TEXT,
  deleted_at INTEGER,
  pin_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  username TEXT,
  created_at INTEGER
);

-- 登录限流（按 IP）
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_time INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notes_username ON notes(username);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_trash_username ON trash(username);
