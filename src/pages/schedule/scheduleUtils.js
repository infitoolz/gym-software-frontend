import { normalizeWorkoutPlan, normalizeWorkoutType } from "../workout/workoutUtils";

export function normalizeScheduleUser(user) {
  if (!user) return null;
  return {
    ...user,
    name: user.name || "Unnamed user",
    email: user.email || "",
    role: user.role || "",
    branchId: user.branchId || null,
  };
}

export function normalizeTrainerDutySchedule(schedule) {
  if (!schedule) return null;
  return {
    ...schedule,
    trainer: normalizeScheduleUser(schedule.trainer),
    assignedBy: normalizeScheduleUser(schedule.assignedBy),
    branch: schedule.branch || "",
    title: schedule.title || "Untitled duty schedule",
    description: schedule.description || "",
    repeatType: schedule.repeatType || "None",
    shiftType: schedule.shiftType || "General",
    location: schedule.location || "",
    status: String(schedule.status || "ACTIVE").toUpperCase(),
    notes: schedule.notes || "",
  };
}

export function normalizeUserWorkoutSchedule(schedule) {
  if (!schedule) return null;
  return {
    ...schedule,
    trainer: normalizeScheduleUser(schedule.trainer),
    user: normalizeScheduleUser(schedule.user),
    workoutPlan: normalizeWorkoutPlan(schedule.workoutPlan),
    workoutType: normalizeWorkoutType(schedule.workoutType),
    title: schedule.title || "Untitled workout session",
    description: schedule.description || "",
    repeatType: schedule.repeatType || "None",
    location: schedule.location || "",
    completionStatus: String(schedule.completionStatus || "PENDING").toUpperCase(),
    notes: schedule.notes || "",
    status: String(schedule.status || "ACTIVE").toUpperCase(),
  };
}

export function getDutyEventColor(schedule) {
  const status = String(schedule?.status || "").toUpperCase();
  const shiftType = String(schedule?.shiftType || "").toLowerCase();
  if (status !== "ACTIVE") return "#6c757d";
  if (shiftType.includes("morning")) return "#0d6efd";
  if (shiftType.includes("evening")) return "#6610f2";
  return "#198754";
}

export function getWorkoutEventColor(schedule) {
  const completion = String(schedule?.completionStatus || "").toUpperCase();
  const status = String(schedule?.status || "").toUpperCase();
  if (status !== "ACTIVE") return "#6c757d";
  if (completion === "COMPLETED") return "#198754";
  if (completion === "IN_PROGRESS") return "#0dcaf0";
  return "#fd7e14";
}

export function toCalendarRange(startDateTime, endDateTime) {
  return {
    start: startDateTime || null,
    end: endDateTime || null,
  };
}

export function formatDateTimeForInput(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTimeForDisplay(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeRange(startValue, endValue) {
  const start = formatDateTimeForDisplay(startValue);
  const end = formatDateTimeForDisplay(endValue);
  if (start === "-" && end === "-") return "-";
  if (start === end) return start;
  return `${start} - ${end}`;
}
