import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

// Workout Type
export async function getWorkoutTypes() {
  const response = await api.get("/workout-types");
  return unwrapList(response);
}

export async function createWorkoutType(payload) {
  const response = await api.post("/workout-types", payload);
  return unwrapOne(response);
}

export async function updateWorkoutType(id, payload) {
  const response = await api.put(`/workout-types/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteWorkoutType(id) {
  await api.delete(`/workout-types/${id}`);
  return true;
}

// Body Part
export async function getBodyParts() {
  const response = await api.get("/body-parts");
  return unwrapList(response);
}

export async function createBodyPart(payload) {
  const response = await api.post("/body-parts", payload);
  return unwrapOne(response);
}

export async function updateBodyPart(id, payload) {
  const response = await api.put(`/body-parts/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteBodyPart(id) {
  await api.delete(`/body-parts/${id}`);
  return true;
}

// Exercise
export async function getExercises() {
  const response = await api.get("/exercises");
  return unwrapList(response);
}

export async function createExercise(payload) {
  const response = await api.post("/exercises", payload);
  return unwrapOne(response);
}

export async function updateExercise(id, payload) {
  const response = await api.put(`/exercises/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteExercise(id) {
  await api.delete(`/exercises/${id}`);
  return true;
}

// Workout Plan
export async function getWorkoutPlans() {
  const response = await api.get("/workout-plans");
  return unwrapList(response);
}

export async function createWorkoutPlan(payload) {
  const response = await api.post("/workout-plans", payload);
  return unwrapOne(response);
}

export async function updateWorkoutPlan(id, payload) {
  const response = await api.put(`/workout-plans/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteWorkoutPlan(id) {
  await api.delete(`/workout-plans/${id}`);
  return true;
}

export async function assignWorkoutPlan(userId, workoutPlanId) {
  const response = await api.put(`/users/${userId}/assign-workout/${workoutPlanId}`);
  return unwrapOne(response);
}

export async function getMyWorkoutPlan() {
  const response = await api.get("/users/me/workout-plan");
  return unwrapOne(response);
}
