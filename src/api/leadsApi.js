import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function getLeads() {
  const response = await api.get("/leads");
  return unwrap(response);
}

export async function getLeadById(id) {
  const response = await api.get(`/leads/${id}`);
  return unwrap(response);
}

export async function createLead(lead) {
  const response = await api.post("/leads", lead);
  return unwrap(response);
}

export async function updateLead(id, lead) {
  const response = await api.put(`/leads/${id}`, lead);
  return unwrap(response);
}

export async function deleteLead(id) {
  const response = await api.delete(`/leads/${id}`);
  return unwrap(response);
}

export async function convertLeadToMember(id, payload) {
  const response = await api.post(`/leads/${id}/convert`, payload);
  return unwrap(response);
}

export async function generateAiReply(id) {
  const response = await api.post(`/leads/${id}/ai/generate-reply`);
  return unwrap(response);
}
