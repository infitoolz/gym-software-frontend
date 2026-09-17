import React from "react";
import WorkoutSimpleMasterPage from "./WorkoutSimpleMasterPage";
import { createWorkoutType, deleteWorkoutType, getWorkoutTypes, updateWorkoutType } from "../../api/workoutApi";
import { normalizeWorkoutType } from "./workoutUtils";

export default function WorkoutTypeMaster() {
  return (
    <WorkoutSimpleMasterPage
      pageKey="workout-type"
      title="Workout Type Master"
      label="Workout Type"
      loadFn={getWorkoutTypes}
      createFn={createWorkoutType}
      updateFn={updateWorkoutType}
      deleteFn={deleteWorkoutType}
      normalizeFn={normalizeWorkoutType}
    />
  );
}
