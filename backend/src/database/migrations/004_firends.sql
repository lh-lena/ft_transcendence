CREATE TABLE IF NOT EXISTS friend_statuses(
	id INTEGER UNIQUE PRIMARY KEY,
	name TEXT UNIQUE NOT NULL
);

INSERT OR IGNORE INTO friend_statuses( id, name ) VALUES
	(1, 'pending'),
	(2, 'accepted'),
	(3, 'denied');

CREATE TABLE IF NOT EXISTS friends(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	requester_id INTEGER NOT NULL,
	adresee_id INTEGER NOT NULL,
	status	INTEGER NOT NULL REFERENCES friend_statuses(id),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	
	FOREIGN KEY (requester_id) REFERENCES users(id),
	FOREIGN KEY (adresee_id) REFERENCES users(id)
);
