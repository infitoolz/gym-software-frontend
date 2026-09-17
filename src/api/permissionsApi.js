import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function getMyPermissions() {
  const response = await api.get("/access/permissions/me");
  return unwrap(response);
}

export async function getPermissionMatrix() {
  const response = await api.get("/access/permissions/matrix");
  return unwrap(response);
}

export async function savePermissionMatrix(payload) {
  const response = await api.put("/access/permissions/matrix", payload);
  return unwrap(response);
}
