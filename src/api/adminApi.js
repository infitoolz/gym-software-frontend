import api from "../utils/api";

const unwrap = (res) => res?.data?.data;

export async function getAdmins(requesterId) {
  const res = await api.get("/users/admins", { params: { requesterId } });
  return unwrap(res) || [];
}

export async function getAdminById(adminId, requesterId) {
  const res = await api.get(`/users/admin/${adminId}`, { params: { requesterId } });
  return unwrap(res) || null;
}

export async function createAdmin(payload, superAdminId) {
  const res = await api.post("/users/admin", payload, { params: { superAdminId } });
  return unwrap(res) || null;
}

export async function updateAdmin(adminId, payload, updaterId) {
  const res = await api.put(`/users/admin/${adminId}`, payload, { params: { updaterId } });
  return unwrap(res) || null;
}

export async function deleteAdmin(adminId, deleterId) {
  const res = await api.delete(`/users/admin/${adminId}`, { params: { deleterId } });
  return unwrap(res) ?? true;
}

export async function getAdminOverview() {
  const res = await api.get("/admin/stats/overview");
  return unwrap(res) ?? null;
}
