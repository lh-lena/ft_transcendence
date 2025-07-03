CREATE TABLE IF NOT EXISTS game(
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('pvp_remote', 'pvp_local', 'pvp_ai')),
    ai_difficulty TEXT CHECK (ai_difficulty IN ('easy', 'medium', 'hard')),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP
);
