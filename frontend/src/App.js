import { useState } from "react";
import { useExpenses } from "./useExpenses";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import "./index.css";

export default function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem("flux_user_name") || "");
  const [tempName, setTempName] = useState("");
  const { expenses, loading, error, filters, setFilters, addExpense, removeExpense, total } = useExpenses();

  if (!userName) {
    return (
      <div className="app welcome-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="logo" style={{ marginBottom: '24px', transform: 'scale(1.5)' }}>
          <span className="logo-icon">₹</span>
          <span className="logo-text">Flux</span>
        </div>
        <div className="expense-form" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--text)' }}>Welcome to Flux</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please enter your name to continue.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (tempName.trim()) {
              localStorage.setItem("flux_user_name", tempName.trim());
              setUserName(tempName.trim());
            }
          }}>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Start Tracking</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <span className="logo-text">Flux</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
            <p className="tagline" style={{ margin: 0 }}>Welcome, <strong>{userName}</strong></p>
            <button 
              onClick={() => { localStorage.removeItem("flux_user_name"); setUserName(""); }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
            >
              Change
            </button>
          </div>
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