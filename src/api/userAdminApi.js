import api from "../utils/api";

const unwrap = (res) => res?.data?.data;

export async function getTrainers(requesterId) {
  const res = await api.get("/users/trainers", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function getTrainer(trainerId, requesterId) {
  const res = await api.get(`/users/trainer/${trainerId}`, { params: { requesterId } });
  return unwrap(res) || null;
}

export async function createTrainer(payload, creatorId) {
  const res = await api.post("/users/trainer", payload, { params: { creatorId } });
  return unwrap(res) || null;
}

export async function updateTrainer(trainerId, payload, updaterId) {
  const res = await api.put(`/users/trainer/${trainerId}`, payload, { params: { updaterId } });
  return unwrap(res) || null;
}

export async function deleteTrainer(trainerId, deleterId) {
  await api.delete(`/users/trainer/${trainerId}`, { params: { deleterId } });
  return true;
}

export async function getCounselors(requesterId) {
  const res = await api.get("/users/counselors", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function createCounselor(payload, creatorId) {
  const res = await api.post("/users/counselor", payload, { params: { creatorId } });
  return unwrap(res) || null;
}

export async function updateCounselor(counselorId, payload, updaterId) {
  const res = await api.put(`/users/counselor/${counselorId}`, payload, { params: { updaterId } });
  return unwrap(res) || null;
}

export async function deleteCounselor(counselorId, deleterId) {
  await api.delete(`/users/counselor/${counselorId}`, { params: { deleterId } });
  return true;
}

export async function getTrainerPerformances(requesterId) {
  const res = await api.get("/trainers/performance", { params: { requesterId } });
  return unwrap(res) || [];
}
