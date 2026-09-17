import { resolveDietImage } from "../../utils/dietImages";

export const normalizeStatus = (value, fallback = "ACTIVE") =>
  value == null || String(value).trim() === "" ? fallback : String(value).trim().toUpperCase();

export const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const arrayToText = (arr) => (Array.isArray(arr) ? arr : []).join("\n");
export const textToArray = (text) => String(text || "").split(/\r?\n/).filter((line) => line.trim().length > 0);

export function normalizeWorkoutType(type) {
  if (!type) return null;
  return {
    ...type,
    name: type.name || "Untitled workout type",
    description: type.description || "",
    status: normalizeStatus(type.status),
  };
}

export function normalizeBodyPart(bodyPart) {
  if (!bodyPart) return null;
  return {
    ...bodyPart,
    name: bodyPart.name || "Untitled body part",
    description: bodyPart.description || "",
    status: normalizeStatus(bodyPart.status),
  };
}

export function normalizeExercise(exercise) {
  if (!exercise) return null;
  return {
    ...exercise,
    name: exercise.name || "Untitled exercise",
    description: exercise.description || "",
    workoutType: exercise.workoutType ? normalizeWorkoutType(exercise.workoutType) : null,
    bodyPart: exercise.bodyPart ? normalizeBodyPart(exercise.bodyPart) : null,
    difficulty: exercise.difficulty || "Medium",
    equipment: exercise.equipment || "",
    image: resolveDietImage(exercise.image || ""),
    videoUrl: exercise.videoUrl || "",
    caloriesBurned: numberOrZero(exercise.caloriesBurned),
    sets: numberOrZero(exercise.sets),
    reps: numberOrZero(exercise.reps),
    durationMinutes: numberOrZero(exercise.durationMinutes),
    instructions: Array.isArray(exercise.instructions) ? exercise.instructions : [],
    status: normalizeStatus(exercise.status),
  };
}

export function normalizeWorkoutPlan(plan) {
  if (!plan) return null;
  return {
    ...plan,
    name: plan.name || plan.title || "Untitled workout plan",
    description: plan.description || "",
    goal: plan.goal || "",
    level: plan.level || "Beginner",
    durationWeeks: numberOrZero(plan.durationWeeks),
    daysPerWeek: numberOrZero(plan.daysPerWeek),
    estimatedTimeMinutes: numberOrZero(plan.estimatedTimeMinutes),
    exercises: Array.isArray(plan.exercises) ? plan.exercises.map(normalizeExercise).filter(Boolean) : [],
    notes: plan.notes || "",
    mainImage: resolveDietImage(plan.mainImage || plan.image || ""),
    status: normalizeStatus(plan.status),
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export const exerciseOptionsText = (exercise) => {
  if (!exercise) return "";
  return [
    exercise.name,
    exercise.workoutType?.name,
    exercise.bodyPart?.name,
  ].filter(Boolean).join(" • ");
};
