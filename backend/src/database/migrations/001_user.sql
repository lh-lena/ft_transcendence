CREATE TABLE IF NOT EXISTS user(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	two_fa_enabled BOOLEAN DEFAULT FALSE,
	first_name TEXT,
	display_name TEXT,
	avatar_url TEXT,
	status TEXT DEFAULT 'offline',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
