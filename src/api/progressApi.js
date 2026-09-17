import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getProgressSummary() {
  const response = await api.get("/progress/summary");
  return unwrapOne(response);
}

export async function getProgressEntries() {
  const response = await api.get("/progress");
  return unwrapList(response);
}

export async function getMemberProgressEntries(memberId) {
  const response = await api.get(`/progress/member/${memberId}`);
  return unwrapList(response);
}

export async function createProgressEntry(payload) {
  const response = await api.post("/progress", payload);
  return unwrapOne(response);
}

export async function deleteProgressEntry(id) {
  await api.delete(`/progress/${id}`);
  return true;
}
