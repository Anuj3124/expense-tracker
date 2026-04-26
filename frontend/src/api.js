const BASE_URL = process.env.REACT_APP_API_URL || "/api";

function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDeviceId() {
  let id = localStorage.getItem("flux_device_id");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("flux_device_id", id);
  }
  return id;
}

async function apiFetch(path, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: { 
      "Content-Type": "application/json", 
      "X-User-ID": getDeviceId(),
      ...headers 
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.details = body.details || [];
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;

  return res.json();
}

export async function createExpense(data, idempotencyKey) {
  return apiFetch("/expenses", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(data),
  });
}

export async function fetchExpenses({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  const query = params.toString() ? `?${params}` : "";
  return apiFetch(`/expenses${query}`);
}

export async function deleteExpense(id) {
  return apiFetch(`/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function updateExpense(id, data) {
  return apiFetch(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export { generateIdempotencyKey };