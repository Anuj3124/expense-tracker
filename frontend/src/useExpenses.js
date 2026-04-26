import { useState, useEffect, useCallback } from "react";
import { fetchExpenses, createExpense, deleteExpense, generateIdempotencyKey } from "./api";

/**
 * Custom React Hook for managing expense state, fetching, and filtering.
 * Scalable Architecture: By extracting this from App.js, the UI components remain 
 * strictly responsible for rendering, while this hook handles all business logic.
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: "", sort: "date_desc" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses(filters);
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const addExpense = useCallback(async (formData, idempotencyKey) => {
    const expense = await createExpense(formData, idempotencyKey);
    setFilters((f) => ({ ...f }));
    return expense;
  }, []);

  const removeExpense = useCallback(async (id) => {
    try {
      await deleteExpense(id);
      setFilters((f) => ({ ...f })); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const total = expenses
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
    .toFixed(2);

  return { expenses, loading, error, filters, setFilters, addExpense, removeExpense, refresh: load, total };
}