const { getDb, persist, all, get, run } = require("./db");
const { v4: uuidv4 } = require("uuid");

/**
 * Data Model for Expenses.
 * This separates database interaction logic from the route handlers,
 * which makes the application much easier to scale, test, and refactor in the future.
 */

const VALID_CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment",
  "Health", "Shopping", "Utilities", "Other",
];

function toDecimal(paise) {
  return (paise / 100).toFixed(2);
}

function toPaise(amount) {
  return Math.round(parseFloat(amount) * 100);
}

/**
 * Converts a database row to a cleanly formatted expense object.
 * This ensures internal database field names/types don't leak to the API consumer.
 */
function rowToExpense(row) {
  return {
    id: row.id,
    amount: toDecimal(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  };
}

/**
 * Creates a new expense securely and robustly.
 * @param {Object} payload - The expense details.
 * @returns {Object} The created expense and whether it was newly created.
 */
async function createExpense({ amount, category, description, date, idempotency_key }) {
  const db = await getDb();

  if (idempotency_key) {
    const existing = get(db, "SELECT * FROM expenses WHERE idempotency_key = ?", [idempotency_key]);
    if (existing) return { expense: rowToExpense(existing), created: false };
  }

  const paise = toPaise(amount);
  const id = uuidv4();
  const created_at = new Date().toISOString();

  run(db,
    `INSERT INTO expenses (id, amount, category, description, date, created_at, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, paise, category, description, date, created_at, idempotency_key || null]
  );

  persist();

  const expense = get(db, "SELECT * FROM expenses WHERE id = ?", [id]);
  return { expense: rowToExpense(expense), created: true };
}

/**
 * Lists expenses with optional filtering and sorting.
 * Doing this directly in the database query (via WHERE and ORDER BY) is critical
 * for scaling to thousands of records without memory bloat on the server.
 */
async function listExpenses({ category, sort } = {}) {
  const db = await getDb();
  let query = "SELECT * FROM expenses WHERE 1=1";
  const params = [];

  if (category) {
    query += " AND LOWER(category) = LOWER(?)";
    params.push(category);
  }

  query += sort === "date_desc"
    ? " ORDER BY date DESC, created_at DESC"
    : " ORDER BY created_at DESC";

  const rows = all(db, query, params);
  return rows.map(rowToExpense);
}

/**
 * Deletes an expense by its ID.
 */
async function deleteExpense(id) {
  const db = await getDb();
  run(db, "DELETE FROM expenses WHERE id = ?", [id]);
  persist();
  return true;
}

async function updateExpense(id, { amount, category, description, date }) {
  const db = await getDb();
  const paise = toPaise(amount);
  run(db,
    `UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?`,
    [paise, category, description, date, id]
  );
  persist();
  const expense = get(db, "SELECT * FROM expenses WHERE id = ?", [id]);
  return rowToExpense(expense);
}

module.exports = { createExpense, listExpenses, deleteExpense, updateExpense, VALID_CATEGORIES };