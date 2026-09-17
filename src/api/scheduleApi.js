import api from "../utils/api";

const unwrapList = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const unwrapOne = (response) => response?.data?.data ?? null;

export async function getVisibleTrainers(requesterId) {
  const response = await api.get("/users/trainers", { params: { requesterId } });
  return unwrapList(response);
}

export async function getVisibleWorkoutUsers(requesterId, role) {
  const response = await api.get("/users/customers", { params: { requesterId } });
  return unwrapList(response);
}

export async function getCustomersAssignedToTrainer(trainerId) {
  const response = await api.get(`/users/customers/assigned-to/${trainerId}`);
  return unwrapList(response);
}

export async function getTrainerDutySchedules() {
  const response = await api.get("/trainer-duty-schedules");
  return unwrapList(response);
}

export async function getMyTrainerDutySchedules() {
  const response = await api.get("/trainer-duty-schedules/my-team");
  return unwrapList(response);
}

export async function createTrainerDutySchedule(payload) {
  const response = await api.post("/trainer-duty-schedules", payload);
  return unwrapOne(response);
}

export async function updateTrainerDutySchedule(id, payload) {
  const response = await api.put(`/trainer-duty-schedules/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteTrainerDutySchedule(id) {
  await api.delete(`/trainer-duty-schedules/${id}`);
  return true;
}

export async function getUserWorkoutSchedules() {
  const response = await api.get("/user-workout-schedules");
  return unwrapList(response);
}

export async function getMyCreatedUserWorkoutSchedules() {
  const response = await api.get("/user-workout-schedules/my-created");
  return unwrapList(response);
}

export async function getMyUsersWorkoutSchedules() {
  const response = await api.get("/user-workout-schedules/my-users");
  return unwrapList(response);
}

export async function getMyWorkoutSchedule() {
  const response = await api.get("/user-workout-schedules/my-schedule");
  return unwrapList(response);
}

export async function createUserWorkoutSchedule(payload) {
  const response = await api.post("/user-workout-schedules", payload);
  return unwrapOne(response);
}

export async function updateUserWorkoutSchedule(id, payload) {
  const response = await api.put(`/user-workout-schedules/${id}`, payload);
  return unwrapOne(response);
}

export async function deleteUserWorkoutSchedule(id) {
  await api.delete(`/user-workout-schedules/${id}`);
  return true;
}
