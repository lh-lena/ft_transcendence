CREATE TABLE IF NOT EXISTS connections(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER,
	session_id TEXT,
	ip_address TEXT,
	user_agent TEXT,
	connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
	disconnected_at DATETIME,
	FOREIGN KEY (user_id) REFERENCES users(id)
);
