import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getMyAttendance() {
  const response = await api.get("/attendance/me");
  return unwrapList(response);
}

// All active members for the staff enrollment dropdown (not hierarchy-scoped).
export async function getEnrollableMembers() {
  const response = await api.get("/attendance/members");
  return unwrapList(response);
}

export async function getAllAttendance(date) {
  const response = await api.get("/attendance", { params: date ? { date } : {} });
  return unwrapList(response);
}

export async function getTodayAttendance() {
  const response = await api.get("/attendance/today");
  return unwrapList(response);
}

export async function manualCheckIn(memberId) {
  const response = await api.post(`/attendance/manual/${memberId}`);
  return unwrapOne(response);
}

export async function kioskCheckIn(identifier) {
  const response = await api.post(`/attendance/kiosk`, { identifier });
  return unwrapOne(response);
}

export async function selfCheckIn() {
  const response = await api.post(`/attendance/self`);
  return unwrapOne(response);
}

export async function enrollFingerprint(memberId, fingerprintId) {
  const response = await api.put(`/attendance/enroll/${memberId}`, { fingerprintId });
  return unwrapOne(response);
}
