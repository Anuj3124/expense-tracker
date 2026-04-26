const express = require("express");
const { createExpense, listExpenses, deleteExpense } = require("./expense.model");
const { validateCreateExpense } = require("./validation");

const router = express.Router();

/**
 * POST /expenses
 * Creates a new expense. Includes validation middleware before execution.
 * Scalability: Error boundaries catch any unexpected failures without crashing the server.
 */
router.post("/expenses", validateCreateExpense, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const idempotency_key = req.headers["idempotency-key"] || null;

    const { expense, created } = await createExpense({
      amount,
      category: category.trim(),
      description: description.trim(),
      date,
      idempotency_key,
    });

    return res.status(created ? 201 : 200).json(expense);
  } catch (err) {
    console.error("POST /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/expenses", async (req, res) => {
  try {
    const { category, sort } = req.query;
    const expenses = await listExpenses({ category, sort });
    return res.json(expenses);
  } catch (err) {
    console.error("GET /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteExpense(id);
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /expenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;