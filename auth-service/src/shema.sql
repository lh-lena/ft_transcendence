CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_2fa_enabled BOOLEAN DEFAULT 0,
  twofa_secret TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example users (argon2 hashes are placeholders)
INSERT INTO users (email, username, password_hash, is_2fa_enabled)
VALUES
  ('alice@example.com', 'alice',  '$argon2id$v=19$m=65536,t=3,p=4$ZGF0YXNhbHQ$u6k6w6v1v8w1v8w1v8w1v8w1v8w1v8w1', 0),
  ('bob@example.com',   'bob',    '$argon2id$v=19$m=65536,t=3,p=4$ZGF0YXNhbHQ$w1v8w1v8w1v8w1v8w1v8w1v8w1v8w1v8', 1);
