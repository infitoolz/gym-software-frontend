import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { IconHome, IconEdit, IconTrash, IconPlus, IconPhoto, IconEye } from "@tabler/icons-react";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import { createWorkoutPlan, deleteWorkoutPlan, getExercises, getWorkoutPlans, updateWorkoutPlan } from "../../api/workoutApi";
import api from "../../utils/api";
import { normalizeExercise, normalizeWorkoutPlan } from "./workoutUtils";
import { resolveDietImage } from "../../utils/dietImages";

const EMPTY_FORM = {
  name: "",
  description: "",
  goal: "",
  level: "Beginner",
  durationWeeks: 4,
  daysPerWeek: 3,
  estimatedTimeMinutes: 45,
  status: "ACTIVE",
  notes: "",
  mainImage: "",
  selectedExerciseIds: [],
};

const STEP_FIELDS = [
  { key: "basic", label: "Basic Info" },
  { key: "structure", label: "Plan Structure" },
  { key: "exercises", label: "Exercises" },
  { key: "media", label: "Media" },
  { key: "notes", label: "Notes" },
];

export default function WorkoutPlanMaster() {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalError, setModalError] = useState("");
  const [modalTab, setModalTab] = useState("basic");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseWorkoutType, setExerciseWorkoutType] = useState("");
  const [exerciseBodyPart, setExerciseBodyPart] = useState("");
  const [exerciseDifficulty, setExerciseDifficulty] = useState("");

  const canCreate = hasPermission("workout-plan", "create");
  const canEdit = hasPermission("workout-plan", "edit");
  const canDelete = hasPermission("workout-plan", "delete");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [planRows, exerciseRows] = await Promise.all([getWorkoutPlans(), getExercises()]);
      setRows(Array.isArray(planRows) ? planRows : []);
      setExercises(Array.isArray(exerciseRows) ? exerciseRows.map(normalizeExercise).filter(Boolean) : []);
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, "Failed to load workout plans"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!hasPermission("workout-plan")) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage Workout Plan Master.</div>
      </div>
    );
  }

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setModalTab("basic");
    clearExerciseFilters();
    setShowModal(true);
  };

  const openEdit = (row) => {
    const plan = normalizeWorkoutPlan(row);
    setForm({
      name: plan?.name || "",
      description: plan?.description || "",
      goal: plan?.goal || "",
      level: plan?.level || "Beginner",
      durationWeeks: plan?.durationWeeks || 4,
      daysPerWeek: plan?.daysPerWeek || 3,
      estimatedTimeMinutes: plan?.estimatedTimeMinutes || 45,
      status: plan?.status || "ACTIVE",
      notes: plan?.notes || "",
      mainImage: plan?.mainImage || "",
      selectedExerciseIds: (plan?.exercises || []).map((exercise) => String(exercise.id)).filter(Boolean),
    });
    setSelectedId(row?.id);
    setIsEdit(true);
    setModalError("");
    setModalTab("basic");
    clearExerciseFilters();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setModalTab("basic");
    clearExerciseFilters();
  };

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("file", file);
    const response = await api.post("/uploads/diet-images", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data?.path || response.data?.path || "";
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setModalError("");
    try {
      const path = await uploadImage(file);
      setForm((prev) => ({ ...prev, mainImage: path }));
    } catch (err) {
      setModalError("Image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const toggleExercise = (exerciseId) => {
    setForm((prev) => {
      const current = new Set(prev.selectedExerciseIds);
      if (current.has(String(exerciseId))) {
        current.delete(String(exerciseId));
      } else {
        current.add(String(exerciseId));
      }
      return { ...prev, selectedExerciseIds: Array.from(current) };
    });
  };

  const validateForm = () => {
    if (!form.name?.trim()) return "Workout plan name is required";
    if (!form.selectedExerciseIds.length) return "Select at least one exercise";
    return null;
  };

  const modalStepIndex = useMemo(() => {
    const idx = STEP_FIELDS.findIndex((step) => step.key === modalTab);
    return idx >= 0 ? idx : 0;
  }, [modalTab]);

  const goToNextStep = () => {
    setModalError("");
    if (modalTab === "basic" && !form.name?.trim()) {
      setModalError("Workout plan name is required");
      return;
    }
    if (modalStepIndex < STEP_FIELDS.length - 1) {
      setModalTab(STEP_FIELDS[modalStepIndex + 1].key);
    }
  };

  const goToPrevStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(STEP_FIELDS[modalStepIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    setModalError("");
    const validationMessage = validateForm();
    if (validationMessage) {
      setModalError(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || "",
        goal: form.goal?.trim() || "",
        level: form.level,
        durationWeeks: Number(form.durationWeeks) || 0,
        daysPerWeek: Number(form.daysPerWeek) || 0,
        estimatedTimeMinutes: Number(form.estimatedTimeMinutes) || 0,
        status: form.status,
        exercises: form.selectedExerciseIds.map((id) => ({ id: Number(id) })),
        notes: form.notes?.trim() || "",
        mainImage: form.mainImage,
      };

      if (isEdit) {
        await updateWorkoutPlan(selectedId, payload);
        setNotice("Workout plan updated successfully");
      } else {
        await createWorkoutPlan(payload);
        setNotice("Workout plan created successfully");
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setModalError(extractApiErrorMessage(err, "Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => setDeleteTarget(row);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setSaving(true);
    try {
      await deleteWorkoutPlan(deleteTarget.id);
      setNotice("Workout plan deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  const pageRows = useMemo(() => rows.map(normalizeWorkoutPlan).filter(Boolean), [rows]);
  const exerciseWorkoutTypeOptions = useMemo(() => {
    return Array.from(new Set(exercises.map((exercise) => exercise.workoutType?.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [exercises]);
  const exerciseBodyPartOptions = useMemo(() => {
    return Array.from(new Set(exercises.map((exercise) => exercise.bodyPart?.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [exercises]);
  const exerciseDifficultyOptions = useMemo(() => {
    return Array.from(new Set(exercises.map((exercise) => exercise.difficulty).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [exercises]);
  const filteredExercises = useMemo(() => {
    const search = exerciseSearch.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const searchableText = [
        exercise.name,
        exercise.description,
        exercise.workoutType?.name,
        exercise.bodyPart?.name,
        exercise.difficulty,
        exercise.equipment,
        exercise.videoUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesWorkoutType = !exerciseWorkoutType || exercise.workoutType?.name === exerciseWorkoutType;
      const matchesBodyPart = !exerciseBodyPart || exercise.bodyPart?.name === exerciseBodyPart;
      const matchesDifficulty = !exerciseDifficulty || String(exercise.difficulty || "").toLowerCase() === exerciseDifficulty.toLowerCase();

      return matchesSearch && matchesWorkoutType && matchesBodyPart && matchesDifficulty;
    });
  }, [exercises, exerciseSearch, exerciseWorkoutType, exerciseBodyPart, exerciseDifficulty]);
  const clearExerciseFilters = () => {
    setExerciseSearch("");
    setExerciseWorkoutType("");
    setExerciseBodyPart("");
    setExerciseDifficulty("");
  };

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">Workout Plan Master</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/"><IconHome size={16} /></Link>
                </li>
                <li className="breadcrumb-item active">Workout Plan Master</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" />
              Add Workout Plan
            </button>
          )}
        </div>

        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Goal</th>
                      <th>Level</th>
                      <th>Exercises</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">No workout plans found</td>
                      </tr>
                    ) : (
                      pageRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {row.mainImage ? (
                                <img src={resolveDietImage(row.mainImage)} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover" }} />
                              ) : (
                                <div className="bg-light rounded-2 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                                  <IconPhoto size={16} />
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold">{row.name}</div>
                                <small className="text-muted">{row.daysPerWeek} days/week</small>
                              </div>
                            </div>
                          </td>
                          <td>{row.goal || "-"}</td>
                          <td>{row.level || "-"}</td>
                          <td>{Array.isArray(row.exercises) ? row.exercises.length : 0}</td>
                          <td>
                            <span className={`badge ${String(row.status).toUpperCase() === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                              {row.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/workout-plan/${row.id}`} className="btn btn-sm btn-outline-secondary me-2" title="View plan">
                              <IconEye size={14} />
                            </Link>
                            {canEdit && (
                              <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(row)}>
                                <IconEdit size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(row)}>
                                <IconTrash size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <WizardPopup
        open={showModal}
        title={isEdit ? "Edit Workout Plan" : "Add Workout Plan"}
        steps={STEP_FIELDS.map((step) => step.label)}
        step={modalStepIndex}
        onClose={closeModal}
        onBack={goToPrevStep}
        onNext={goToNextStep}
        onSubmit={handleSubmit}
        disabled={saving}
        modalWidth="980px"
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        {modalTab === "basic" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Goal</label>
              <input className="form-control" value={form.goal} onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Level</label>
              <select className="form-select" value={form.level} onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        )}

        {modalTab === "structure" && (
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Level</label>
              <select className="form-select" value={form.level} onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Duration Weeks</label>
              <input type="number" className="form-control" value={form.durationWeeks} onChange={(e) => setForm((prev) => ({ ...prev, durationWeeks: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Days / Week</label>
              <input type="number" className="form-control" value={form.daysPerWeek} onChange={(e) => setForm((prev) => ({ ...prev, daysPerWeek: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Estimated Time (min)</label>
              <input type="number" className="form-control" value={form.estimatedTimeMinutes} onChange={(e) => setForm((prev) => ({ ...prev, estimatedTimeMinutes: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Goal</label>
              <input className="form-control" value={form.goal} onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "media" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Main Image</label>
              <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
              {uploading && <small className="text-muted d-block mt-2">Uploading...</small>}
              {form.mainImage && (
                <div className="mt-2">
                  <img src={resolveDietImage(form.mainImage)} alt="Workout plan" style={{ maxWidth: 180, borderRadius: 8 }} />
                </div>
              )}
            </div>
          </div>
        )}

        {modalTab === "notes" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={6} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "exercises" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Exercises</label>
              <div className="border rounded-3 p-3">
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Search exercises"
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={exerciseWorkoutType}
                      onChange={(e) => setExerciseWorkoutType(e.target.value)}
                    >
                      <option value="">All workout types</option>
                      {exerciseWorkoutTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={exerciseBodyPart}
                      onChange={(e) => setExerciseBodyPart(e.target.value)}
                    >
                      <option value="">All body parts</option>
                      {exerciseBodyPartOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={exerciseDifficulty}
                      onChange={(e) => setExerciseDifficulty(e.target.value)}
                    >
                      <option value="">All difficulty</option>
                      {exerciseDifficultyOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-between align-items-center gap-2">
                    <small className="text-muted">
                      Showing {filteredExercises.length} of {exercises.length} exercises
                    </small>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearExerciseFilters}>
                      Clear filters
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {exercises.length === 0 ? (
                  <div className="text-muted">Create exercises first to build workout plans.</div>
                ) : filteredExercises.length === 0 ? (
                  <div className="text-muted">No exercises match the current filters.</div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <label key={exercise.id} className="d-flex align-items-start gap-2 mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-1"
                        checked={form.selectedExerciseIds.includes(String(exercise.id))}
                        onChange={() => toggleExercise(exercise.id)}
                      />
                      <span>
                        <strong>{exercise.name}</strong>
                        <small className="d-block text-muted">
                          {exercise.workoutType?.name || "-"} | {exercise.bodyPart?.name || "-"} | {exercise.difficulty || "-"}
                        </small>
                      </span>
                    </label>
                  ))
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </WizardPopup>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{deleteTarget?.name || "this workout plan"}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleteTarget(null)} type="button">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} type="button">
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
