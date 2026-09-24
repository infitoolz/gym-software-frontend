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

export async function getMemberGoals(memberId) {
  const response = await api.get(`/goals/member/${memberId}`);
  return unwrapList(response);
}

export async function createGoalForMember(memberId, payload) {
  const response = await api.post(`/goals/member/${memberId}`, payload);
  return unwrapOne(response);
}

export async function loadGoalPresets(memberId = null, category = "strength") {
  const response = await api.post("/goals/presets", { memberId, category });
  return unwrapList(response);
}
