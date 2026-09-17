import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getMyGoals() {
  const response = await api.get("/goals");
  return unwrapList(response);
}

export async function createGoal(payload) {
  const response = await api.post("/goals", payload);
  return unwrapOne(response);
}

export async function updateGoal(id, payload) {
  const response = await api.put(`/goals/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteGoal(id) {
  await api.delete(`/goals/${id}`);
  return true;
}
