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

// Server-backed PIN lock APIs
export async function setPinOnServer(pin) {
  const response = await api.post("/users/me/pin", { pin });
  return unwrapOne(response);
}

export async function removePinOnServer() {
  const response = await api.delete("/users/me/pin");
  return unwrapOne(response);
}

export async function verifyPinOnServer(pin) {
  const response = await api.post("/users/me/pin/verify", { pin });
  return unwrapOne(response);
}
