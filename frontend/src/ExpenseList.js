import { useState } from "react";

const CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment",
  "Health", "Shopping", "Utilities", "Other",
];

const CATEGORY_COLORS = {
  Food: "#f59e0b", Transport: "#3b82f6", Housing: "#8b5cf6",
  Entertainment: "#ec4899", Health: "#10b981", Shopping: "#f97316",
  Utilities: "#6b7280", Other: "#64748b",
};

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function downloadCSV(expenses) {
  if (expenses.length === 0) return;
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map(e => [
    e.date,
    `"${e.category}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount
  ]);
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `expenses_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ExpenseList({ expenses, loading, error, filters, onFilterChange, onDelete }) {
  const [timeFilter, setTimeFilter] = useState("current_month");
  const [monthlyLimit, setMonthlyLimit] = useState(() => Number(localStorage.getItem("monthly_limit")) || 10000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  function saveBudget(e) {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditingBudget(false);
      localStorage.setItem("monthly_limit", monthlyLimit);
    }
  }

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  let displayedExpenses = expenses;
  if (timeFilter === "current_month") {
    displayedExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
  } else if (timeFilter === "previous_month") {
    displayedExpenses = expenses.filter(e => e.date.startsWith(prevMonthStr));
  }

  const displayTotal = displayedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Always calculate budget based strictly on current month's expenses
  const currentMonthTotal = expenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const progress = monthlyLimit > 0 ? Math.min((currentMonthTotal / monthlyLimit) * 100, 100) : 0;
  const isOverLimit = monthlyLimit > 0 && currentMonthTotal > monthlyLimit;

  return (
    <div className="expense-list-section">
      <div className="list-header">
        <h2 className="section-title">Expenses</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => downloadCSV(displayedExpenses)} disabled={displayedExpenses.length === 0}>
            Export CSV
          </button>
          <div className="total-badge">Total: <strong>{formatAmount(displayTotal)}</strong></div>
        </div>
      </div>

      <div className="budget-section">
        <div className="budget-header">
          <label>Current Month Budget:</label>
          <span className="budget-amounts" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {formatAmount(currentMonthTotal)} / 
            {isEditingBudget ? (
              <input 
                 type="number" 
                 value={monthlyLimit} 
                 onChange={e => setMonthlyLimit(e.target.value)}
                 onBlur={saveBudget}
                 onKeyDown={saveBudget}
                 autoFocus
                 style={{ width: '80px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}
              />
            ) : (
              <span onClick={() => setIsEditingBudget(true)} style={{cursor: 'pointer', borderBottom: '1px dashed var(--accent)'}} title="Click to edit budget">
                {formatAmount(monthlyLimit)}
              </span>
            )}
          </span>
        </div>
        <div className="progress-container">
          <div 
            className={`progress-bar ${isOverLimit ? 'over-limit' : ''}`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="filters">
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
          <option value="current_month">Current Month</option>
          <option value="previous_month">Previous Month</option>
          <option value="all_time">All Time</option>
        </select>
        <select value={filters.category} onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}>
          <option value="date_desc">Newest first</option>
          <option value="">By creation order</option>
        </select>
      </div>
      {loading && <p className="state-msg">Loading…</p>}
      {error && <p className="state-msg error">Error: {error}</p>}
      {!loading && !error && displayedExpenses.length === 0 && (
        <p className="state-msg empty">No expenses found for this selection.</p>
      )}
      {!loading && displayedExpenses.length > 0 && (
        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr><th>Date</th><th>Category</th><th>Description</th><th className="amount-col">Amount</th><th className="action-col"></th></tr>
            </thead>
            <tbody>
              {displayedExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="date-cell">{formatDate(expense.date)}</td>
                  <td>
                    <span className="category-badge"
                      style={{ "--badge-color": CATEGORY_COLORS[expense.category] || "#64748b" }}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="desc-cell">{expense.description}</td>
                  <td className="amount-cell">{formatAmount(expense.amount)}</td>
                  <td className="action-cell">
                    <button className="btn-delete" onClick={() => onDelete(expense.id)} aria-label="Delete expense">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {displayedExpenses.length > 0 && (
        <div className="summary-by-category">
          <h3>Summary by Category</h3>
          <div className="summary-grid">
            {Object.entries(
              displayedExpenses.reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1]).map(([cat, sum]) => (
              <div key={cat} className="summary-item">
                <span className="summary-dot" style={{ background: CATEGORY_COLORS[cat] || "#64748b" }} />
                <span className="summary-cat">{cat}</span>
                <span className="summary-amt">{formatAmount(sum)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}