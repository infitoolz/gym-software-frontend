import api from "../utils/api";

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getMyProfile() {
  const response = await api.get("/users/me/profile");
  return unwrapOne(response);
}

export async function updateMyProfile(payload) {
  const response = await api.put("/users/me/profile", payload);
  return unwrapOne(response);
}

// Flags the member's onboarding as finished (notifies their staff).
export async function completeOnboarding() {
  await api.post("/users/me/onboarding-complete");
  return true;
}
