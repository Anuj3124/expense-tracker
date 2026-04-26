import { useRef } from "react";
import { useState } from "react";
import { generateIdempotencyKey } from "./api";

// Configuration for scalable category additions. 
// Adding a new category here automatically populates it in the UI and validates it.
const CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment",
  "Health", "Shopping", "Utilities", "Other",
];

export function ExpenseForm({ onAdd }) {
  // State for tracking submission and validation errors
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  
  // Idempotency key prevents duplicate network requests if the user rapidly clicks or refreshes
  const idempotencyKey = useRef(generateIdempotencyKey());

  // Using uncontrolled components (useRef) for form fields to improve performance in large forms
  const amountRef = useRef();
  const categoryRef = useRef();
  const descriptionRef = useRef();
  const dateRef = useRef();

  /**
   * Validates form data before submission.
   * Scalable approach: Returns an object mapping field names to error messages.
   */
  function validate(data) {
    const errors = {};
    const amount = parseFloat(data.amount);
    if (!data.amount || data.amount.trim() === "") errors.amount = "Required";
    else if (isNaN(amount) || amount <= 0) errors.amount = "Must be > 0";
    if (!data.category || data.category === "") errors.category = "Required";
    if (!data.description || data.description.trim() === "") errors.description = "Required";
    if (!data.date || data.date.trim() === "") errors.date = "Required";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const data = {
      amount: amountRef.current.value,
      category: categoryRef.current.value,
      description: descriptionRef.current.value,
      date: dateRef.current.value,
    };

    // This will show you exactly what the form is sending
    console.log("Submitting data:", data);

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      await onAdd(
        {
          amount: parseFloat(data.amount),
          category: data.category.trim(),
          description: data.description.trim(),
          date: data.date,
        },
        idempotencyKey.current
      );
      idempotencyKey.current = generateIdempotencyKey();
      // Reset form to empty states
      amountRef.current.value = "";
      categoryRef.current.value = "";
      descriptionRef.current.value = "";
      dateRef.current.value = ""; // Require user to select date manually
    } catch (err) {
      setSubmitError(
        err.details?.length > 0
          ? err.details.join("; ")
          : err.message || "Something went wrong. Please retry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">Add Expense</h2>

      <div className="form-row">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            ref={amountRef}
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            disabled={submitting}
            className={fieldErrors.amount ? "input-error" : ""}
          />
          {fieldErrors.amount && <span className="error-msg">{fieldErrors.amount}</span>}
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            ref={categoryRef}
            id="category"
            name="category"
            defaultValue=""
            disabled={submitting}
            className={fieldErrors.category ? "input-error" : ""}
          >
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {fieldErrors.category && <span className="error-msg">{fieldErrors.category}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          ref={descriptionRef}
          id="description"
          name="description"
          type="text"
          placeholder="What was this for?"
          maxLength={500}
          disabled={submitting}
          className={fieldErrors.description ? "input-error" : ""}
        />
        {fieldErrors.description && <span className="error-msg">{fieldErrors.description}</span>}
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input
          ref={dateRef}
          id="date"
          name="date"
          type="date"
          defaultValue=""
          disabled={submitting}
          className={fieldErrors.date ? "input-error" : ""}
        />
        {fieldErrors.date && <span className="error-msg">{fieldErrors.date}</span>}
      </div>

      {submitError && <p className="submit-error">{submitError}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Saving…" : "Add Expense"}
      </button>
    </form>
  );
}