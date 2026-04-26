import { useExpenses } from "./useExpenses";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import "./index.css";

export default function App() {
  const { expenses, loading, error, filters, setFilters, addExpense, removeExpense, total } = useExpenses();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <span className="logo-text">Flux</span>
          </div>
          <p className="tagline">Track where your money goes</p>
        </div>
      </header>
      <main className="app-main">
        <ExpenseForm onAdd={addExpense} />
        <ExpenseList expenses={expenses} loading={loading} error={error}
          filters={filters} onFilterChange={setFilters} total={total} onDelete={removeExpense} />
      </main>
    </div>
  );
}