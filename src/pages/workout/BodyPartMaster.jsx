import React from "react";
import WorkoutSimpleMasterPage from "./WorkoutSimpleMasterPage";
import { createBodyPart, deleteBodyPart, getBodyParts, updateBodyPart } from "../../api/workoutApi";
import { normalizeBodyPart } from "./workoutUtils";

export default function BodyPartMaster() {
  return (
    <WorkoutSimpleMasterPage
      pageKey="body-part"
      title="Body Part Master"
      label="Body Part"
      loadFn={getBodyParts}
      createFn={createBodyPart}
      updateFn={updateBodyPart}
      deleteFn={deleteBodyPart}
      normalizeFn={normalizeBodyPart}
    />
  );
}
