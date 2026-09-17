import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

export async function getNotifications() {
  const response = await api.get("/notifications");
  return unwrapList(response);
}
