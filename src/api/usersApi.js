import api from "../utils/api";

const unwrap = (res) => res?.data?.data;

function splitName(name = "") {
  const normalized = String(name).trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const parts = normalized.split(" ");
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function toUiAdminRow(a) {
  return {
    id: a?.id,
    employeeCode: a?.employeeId || "",
    userCode: a?.employeeId || "",
    name: [a?.firstName, a?.lastName].filter(Boolean).join(" "),
    email: a?.email || "",
    phone: a?.phone || "",
    dept: a?.department || "",
    branch: "",
    designation: "Admin",
    joinDate: "",
    status: a?.active ? "ACTIVE" : "INACTIVE",
    role: "ADMIN",
  };
}

export async function getUsers(requesterId) {
  if (!requesterId) return [];
  const res = await api.get("/users/admins", { params: { requesterId } });
  const rows = unwrap(res);
  return Array.isArray(rows) ? rows.map(toUiAdminRow) : [];
}

export async function getUser(adminId, requesterId) {
  const res = await api.get(`/users/admin/${adminId}`, { params: { requesterId } });
  const row = unwrap(res);
  return row ? toUiAdminRow(row) : null;
}

export async function createUser(payload, superAdminId) {
  const { firstName, lastName } = splitName(payload?.name || `${payload?.firstName || ""} ${payload?.lastName || ""}`);

  const req = {
    email: payload?.email,
    password: payload?.password || "Temp@123",
    firstName,
    lastName,
    department: payload?.dept || "",
    phone: payload?.phone || "",
    employeeId: payload?.employeeCode || payload?.userCode || `EMP${Date.now()}`,
    qualification: payload?.qualification || "N/A",
  };

  const res = await api.post("/users/admin", req, { params: { superAdminId } });
  return toUiAdminRow(unwrap(res));
}

export async function updateUser(adminId, payload, updaterId) {
  const { firstName, lastName } = splitName(payload?.name || `${payload?.firstName || ""} ${payload?.lastName || ""}`);

  const req = {
    email: payload?.email,
    password: payload?.password || "Temp@123",
    firstName,
    lastName,
    department: payload?.dept || "",
    phone: payload?.phone || "",
    employeeId: payload?.employeeCode || payload?.userCode || "",
    qualification: payload?.qualification || "N/A",
  };

  const res = await api.put(`/users/admin/${adminId}`, req, { params: { updaterId } });
  return toUiAdminRow(unwrap(res));
}

export async function deleteUser(adminId, deleterId) {
  await api.delete(`/users/admin/${adminId}`, { params: { deleterId } });
  return true;
}
