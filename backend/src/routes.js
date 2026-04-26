const express = require("express");
const { createExpense, listExpenses, deleteExpense, updateExpense } = require("./expense.model");
const { validateCreateExpense } = require("./validation");

const router = express.Router();

const getUserId = (req) => req.headers["x-user-id"] || "default_user";

/**
 * POST /expenses
 * Creates a new expense. Includes validation middleware before execution.
 * Scalability: Error boundaries catch any unexpected failures without crashing the server.
 */
router.post("/expenses", validateCreateExpense, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, category, description, date } = req.body;
    const idempotency_key = req.headers["idempotency-key"] || null;

    const { expense, created } = await createExpense({
      amount,
      category: category.trim(),
      description: description.trim(),
      date,
      idempotency_key,
      user_id: userId,
    });

    return res.status(created ? 201 : 200).json(expense);
  } catch (err) {
    console.error("POST /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/expenses", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, sort } = req.query;
    const expenses = await listExpenses(userId, { category, sort });
    return res.json(expenses);
  } catch (err) {
    console.error("GET /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    await deleteExpense(id, userId);
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/expenses/:id", validateCreateExpense, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;
    const expense = await updateExpense(id, {
      amount,
      category: category.trim(),
      description: description.trim(),
      date,
    });
    return res.json(expense);
  } catch (err) {
    console.error("PUT /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;