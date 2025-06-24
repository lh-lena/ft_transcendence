CREATE TABLE IF NOT EXISTS stats(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id	INTEGER,
	completed_games INTEGER,
	wins INTEGER, 
	best_time TEXT,
	FOREIGN KEY (user_id) REFERENCES users(id)
);
