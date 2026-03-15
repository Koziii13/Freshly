const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn("Could not create data directory, using current directory for sqlite. Error:", err.message);
  }
}

// Fallback to current directory if dataDir is not writable
const dbFile = fs.existsSync(dataDir) ? path.join(dataDir, 'workshop.sqlite') : 'workshop.sqlite';
const db = new Database(dbFile);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workshops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'other',
    date TEXT NOT NULL,
    time TEXT,
    capacity INTEGER DEFAULT 20,
    price REAL DEFAULT 0,
    instructor TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    registered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(client_id, workshop_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  
  INSERT OR IGNORE INTO settings (key, value) VALUES ('webhook_url', '');
`);

module.exports = db;
