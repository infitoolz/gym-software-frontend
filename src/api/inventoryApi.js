import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function getInventory() {
  const response = await api.get("/inventory");
  return unwrap(response);
}

export async function getInventoryById(id) {
  const response = await api.get(`/inventory/${id}`);
  return unwrap(response);
}

export async function createInventory(item) {
  const response = await api.post("/inventory", item);
  return unwrap(response);
}

export async function updateInventory(id, item) {
  const response = await api.put(`/inventory/${id}`, item);
  return unwrap(response);
}

export async function deleteInventory(id) {
  const response = await api.delete(`/inventory/${id}`);
  return unwrap(response);
}
