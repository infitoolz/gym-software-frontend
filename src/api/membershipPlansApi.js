import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getMembershipPlans({ activeOnly = false } = {}) {
  const response = await api.get("/membership-plans", { params: { activeOnly } });
  return unwrapList(response);
}

export async function createMembershipPlan(payload) {
  const response = await api.post("/membership-plans", payload);
  return unwrapOne(response);
}

export async function updateMembershipPlan(id, payload) {
  const response = await api.put(`/membership-plans/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteMembershipPlan(id) {
  const response = await api.delete(`/membership-plans/${id}`);
  return unwrapOne(response);
}
