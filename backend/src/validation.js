const { VALID_CATEGORIES } = require("./expense.model");

function validateCreateExpense(req, res, next) {
  const { amount, category, description, date } = req.body;
  const errors = [];

  const parsedAmount = parseFloat(amount);
  if (amount === undefined || amount === null || amount === "") {
    errors.push("amount is required");
  } else if (isNaN(parsedAmount)) {
    errors.push("amount must be a number");
  } else if (parsedAmount <= 0) {
    errors.push("amount must be greater than 0");
  } else if (parsedAmount > 10_000_000) {
    errors.push("amount exceeds maximum allowed value");
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    errors.push("category is required");
  } else if (!VALID_CATEGORIES.includes(category.trim())) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    errors.push("description is required");
  } else if (description.trim().length > 500) {
    errors.push("description must be 500 characters or fewer");
  }

  if (!date) {
    errors.push("date is required");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push("date must be in YYYY-MM-DD format");
  } else {
    const d = new Date(date);
    if (isNaN(d.getTime())) errors.push("date is not valid");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  next();
}

module.exports = { validateCreateExpense };