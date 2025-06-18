-- test-schema.sql
CREATE TABLE IF NOT EXISTS test_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

INSERT INTO test_items (name) VALUES ('alpha'), ('beta'), ('gamma');

