import api from "../utils/api";

const unwrapOne = (response) => response?.data?.data ?? null;
const message = (response) => response?.data?.message ?? "";

export async function forgotPassword(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return { data: unwrapOne(response), message: message(response) };
}

export async function verifyOtp(email, otp, purpose) {
  const response = await api.post("/auth/verify-otp", { email, otp, purpose });
  return unwrapOne(response);
}

export async function resetPassword(email, otp, newPassword) {
  const response = await api.post("/auth/reset-password", { email, otp, newPassword });
  return message(response);
}

export async function sendEmailOtp(email) {
  const response = await api.post("/auth/send-email-otp", { email });
  return { data: unwrapOne(response), message: message(response) };
}

export async function verifyEmail(email, otp) {
  const response = await api.post("/auth/verify-email", { email, otp });
  return message(response);
}
