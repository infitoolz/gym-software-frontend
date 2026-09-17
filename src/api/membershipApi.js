import api from "../utils/api";

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getMyMembership() {
  const response = await api.get("/membership/me");
  return unwrapOne(response);
}

export async function createMembershipOrder(planId, months = 1) {
  const response = await api.post("/membership/create-order", { planId, months });
  return unwrapOne(response);
}

export async function verifyMembershipPayment(payload) {
  const response = await api.post("/membership/verify-payment", payload);
  return unwrapOne(response);
}

export async function cancelMembership() {
  const response = await api.post("/membership/cancel");
  return unwrapOne(response);
}

// Member asks staff to move them to a different plan (admin-assisted upgrade).
export async function requestPlanChange(planId, note) {
  const response = await api.post("/membership/request-change", { planId, note });
  return unwrapOne(response);
}

// Staff: list members' pending plan-upgrade requests.
export async function getPlanChangeRequests() {
  const response = await api.get("/membership/requests");
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
}

// Staff: dismiss a pending request without assigning a plan.
export async function dismissPlanChangeRequest(requestId) {
  const response = await api.post(`/membership/requests/${requestId}/dismiss`);
  return unwrapOne(response);
}

// Staff: read/assign a specific member's plan + check-in window.
export async function getMemberMembership(memberId) {
  const response = await api.get(`/membership/member/${memberId}`);
  return unwrapOne(response);
}

export async function assignMembership(memberId, payload) {
  const response = await api.post(`/membership/assign/${memberId}`, payload);
  return unwrapOne(response);
}

/**
 * Fetch members whose membership expires within the next `days` days.
 * @param {number} days - 3, 7, 15, or 30
 * @param {number} requesterId - current user ID
 */
export async function getExpiringMembers(days, requesterId) {
  const response = await api.get("/users/customers/expiring", {
    params: { days, requesterId },
  });
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch members at risk of churn with their risk reasons.
 * @param {number} requesterId - current user ID
 */
export async function getAtRiskMembers(requesterId) {
  const response = await api.get("/users/customers/at-risk", {
    params: { requesterId },
  });
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
}

export async function engageAtRiskMember(customerId, requesterId, message) {
  const response = await api.post(`/users/customers/${customerId}/engage`, { message }, {
    params: { requesterId }
  });
  return unwrapOne(response);
}
