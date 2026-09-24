import api from "../utils/api";

/**
 * Fetch corporate wellness dashboard metrics.
 */
export async function getWellnessDashboard(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/dashboard", { params });
  return response.data;
}

/**
 * Fetch employees mapped to the corporate partner.
 */
export async function getCorporateEmployees(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/employees", { params });
  return response.data;
}

/**
 * Add or link an employee to the corporate partner.
 */
export async function addCorporateEmployee(payload, hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.post("/corporate/employees", payload, { params });
  return response.data;
}

/**
 * Fetch BMI distribution and health tracking data.
 */
export async function getBmiData(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/bmi-data", { params });
  return response.data;
}

/**
 * Fetch active, upcoming, and completed wellness challenges.
 */
export async function getChallenges(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/challenges", { params });
  return response.data;
}

/**
 * Create a new wellness challenge.
 */
export async function createChallenge(payload, hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.post("/corporate/challenges", payload, { params });
  return response.data;
}

/**
 * Join an active challenge.
 */
export async function joinChallenge(challengeId, employeeId) {
  const response = await api.post(`/corporate/challenges/${challengeId}/join`, { employeeId });
  return response.data;
}

/**
 * Fetch real corporate wellness reports aggregated from the database.
 */
export async function getCorporateReports(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/reports", { params });
  return response.data;
}

/**
 * Fetch real corporate attendance logs.
 */
export async function getCorporateAttendance(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/attendance", { params });
  return response.data;
}

/**
 * Fetch real corporate billing invoices.
 */
export async function getCorporateBilling(hrUserId) {
  const params = hrUserId ? { hrUserId } : {};
  const response = await api.get("/corporate/billing", { params });
  return response.data;
}
