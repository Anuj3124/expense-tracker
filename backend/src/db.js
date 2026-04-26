const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

/**
 * Database connection module.
 * Using sql.js to provide a local SQLite instance.
 * For production scale, replace this file with a PostgreSQL/MySQL connection (e.g. pg or knex).
 */

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/expenses.db");
const IN_MEMORY = DB_PATH === ":memory:";

let db = null;

/**
 * Initializes and returns the singleton database connection.
 * If the database file exists, it loads the data from disk.
 * Otherwise, it initializes a new schema.
 */
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!IN_MEMORY && fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema(db);
  return db;
}

/**
 * Initializes the database schema.
 * Scalability: Defines clear indexes on `date` and `category` to ensure fast filtering and sorting.
 */
function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id                TEXT PRIMARY KEY,
      amount            INTEGER NOT NULL,
      category          TEXT NOT NULL,
      description       TEXT NOT NULL,
      date              TEXT NOT NULL,
      created_at        TEXT NOT NULL,
      idempotency_key   TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);
}

/**
 * Synchronously writes the in-memory database to disk.
 * Note: For high-throughput scalability, this should be replaced with an asynchronous 
 * background job or by using a true disk-based engine (like better-sqlite3 or PostgreSQL).
 */
function persist() {
  if (IN_MEMORY || !db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function all(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(db, sql, params = []) {
  return all(db, sql, params)[0];
}

function run(db, sql, params = []) {
  db.run(sql, params);
}

module.exports = { getDb, persist, all, get, run };