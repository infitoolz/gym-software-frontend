import api from "../utils/api";

function unwrap(response) {
  return response?.data?.data ?? null;
}

export async function getOverviewStats() {
  const response = await api.get("/admin/stats/overview");
  return unwrap(response);
}
