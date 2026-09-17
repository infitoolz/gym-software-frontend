import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function getTransactions() {
  const response = await api.get("/billing/transactions");
  return unwrap(response);
}

// Invoices
export async function getInvoices(requesterId) {
  const res = await api.get("/billing/invoices", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function createInvoice(payload, creatorId) {
  const res = await api.post("/billing/invoices", payload, { params: { creatorId } });
  return unwrap(res) || null;
}

// Receipts
export async function getReceipts(requesterId) {
  const res = await api.get("/billing/receipts", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function createReceipt(payload, creatorId) {
  const res = await api.post("/billing/receipts", payload, { params: { creatorId } });
  return unwrap(res) || null;
}

// Trainer Payments
export async function getTrainerPayments(requesterId) {
  const res = await api.get("/billing/trainer-payments", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function createTrainerPayment(payload, creatorId) {
  const res = await api.post("/billing/trainer-payments", payload, { params: { creatorId } });
  return unwrap(res) || null;
}

// Expenses
export async function getExpenses(requesterId) {
  const res = await api.get("/billing/expenses", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function createExpense(payload, creatorId) {
  const res = await api.post("/billing/expenses", payload, { params: { creatorId } });
  return unwrap(res) || null;
}
