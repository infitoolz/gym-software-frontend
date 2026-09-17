import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { IconHome, IconEdit, IconTrash, IconPlus, IconPhoto } from "@tabler/icons-react";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import api from "../../utils/api";
import {
  createExercise,
  deleteExercise,
  getBodyParts,
  getExercises,
  getWorkoutTypes,
  updateExercise,
} from "../../api/workoutApi";
import { arrayToText, normalizeBodyPart, normalizeExercise, normalizeWorkoutType, textToArray } from "./workoutUtils";
import { resolveDietImage } from "../../utils/dietImages";

const EMPTY_FORM = {
  name: "",
  description: "",
  workoutTypeId: "",
  bodyPartId: "",
  difficulty: "Medium",
  equipment: "",
  image: "",
  videoUrl: "",
  caloriesBurned: 0,
  sets: 0,
  reps: 0,
  durationMinutes: 0,
  instructionsText: "",
  status: "ACTIVE",
};

const STEP_FIELDS = [
  { key: "basic", label: "Basic Info" },
  { key: "mapping", label: "Workout Mapping" },
  { key: "performance", label: "Performance Details" },
  { key: "media", label: "Media" },
  { key: "instructions", label: "Instructions" },
];

export default function ExerciseMaster() {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
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

  const canCreate = hasPermission("exercise-master", "create");
  const canEdit = hasPermission("exercise-master", "edit");
  const canDelete = hasPermission("exercise-master", "delete");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [exerciseRows, types, parts] = await Promise.all([getExercises(), getWorkoutTypes(), getBodyParts()]);
      setRows(Array.isArray(exerciseRows) ? exerciseRows : []);
      setWorkoutTypes(Array.isArray(types) ? types.map(normalizeWorkoutType).filter(Boolean) : []);
      setBodyParts(Array.isArray(parts) ? parts.map(normalizeBodyPart).filter(Boolean) : []);
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, "Failed to load exercises"));
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

  if (!hasPermission("exercise-master")) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage Exercise Master.</div>
      </div>
    );
  }

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setModalTab("basic");
    setShowModal(true);
  };

  const openEdit = (row) => {
    const item = normalizeExercise(row);
    setForm({
      name: item?.name || "",
      description: item?.description || "",
      workoutTypeId: item?.workoutType?.id ? String(item.workoutType.id) : "",
      bodyPartId: item?.bodyPart?.id ? String(item.bodyPart.id) : "",
      difficulty: item?.difficulty || "Medium",
      equipment: item?.equipment || "",
      image: item?.image || "",
      videoUrl: item?.videoUrl || "",
      caloriesBurned: item?.caloriesBurned || 0,
      sets: item?.sets || 0,
      reps: item?.reps || 0,
      durationMinutes: item?.durationMinutes || 0,
      instructionsText: arrayToText(item?.instructions || []),
      status: item?.status || "ACTIVE",
    });
    setSelectedId(row?.id);
    setIsEdit(true);
    setModalError("");
    setModalTab("basic");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setModalTab("basic");
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
      setForm((prev) => ({ ...prev, image: path }));
    } catch (err) {
      setModalError("Image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const validateForm = () => {
    if (!form.name?.trim()) return "Exercise name is required";
    if (!form.workoutTypeId) return "Workout type is required";
    if (!form.bodyPartId) return "Body part is required";
    return null;
  };

  const modalStepIndex = useMemo(() => {
    const idx = STEP_FIELDS.findIndex((step) => step.key === modalTab);
    return idx >= 0 ? idx : 0;
  }, [modalTab]);

  const goToNextStep = () => {
    setModalError("");
    if (modalTab === "basic" && !form.name?.trim()) {
      setModalError("Exercise name is required");
      return;
    }
    if (modalTab === "mapping") {
      if (!form.workoutTypeId) {
        setModalError("Workout type is required");
        return;
      }
      if (!form.bodyPartId) {
        setModalError("Body part is required");
        return;
      }
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
        workoutType: { id: Number(form.workoutTypeId) },
        bodyPart: { id: Number(form.bodyPartId) },
        difficulty: form.difficulty,
        equipment: form.equipment?.trim() || "",
        image: form.image,
        videoUrl: form.videoUrl?.trim() || "",
        caloriesBurned: Number(form.caloriesBurned) || 0,
        sets: Number(form.sets) || 0,
        reps: Number(form.reps) || 0,
        durationMinutes: Number(form.durationMinutes) || 0,
        instructions: textToArray(form.instructionsText),
        status: form.status,
      };

      if (isEdit) {
        await updateExercise(selectedId, payload);
        setNotice("Exercise updated successfully");
      } else {
        await createExercise(payload);
        setNotice("Exercise created successfully");
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
      await deleteExercise(deleteTarget.id);
      setNotice("Exercise deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  const pageRows = useMemo(() => rows.map(normalizeExercise).filter(Boolean), [rows]);

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">Exercise Master</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/"><IconHome size={16} /></Link>
                </li>
                <li className="breadcrumb-item active">Exercise Master</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" />
              Add Exercise
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
                      <th>Exercise</th>
                      <th>Type</th>
                      <th>Body Part</th>
                      <th>Difficulty</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">No exercises found</td>
                      </tr>
                    ) : (
                      pageRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {row.image ? (
                                <img src={resolveDietImage(row.image)} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover" }} />
                              ) : (
                                <div className="bg-light rounded-2 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                                  <IconPhoto size={16} />
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold">{row.name}</div>
                                <small className="text-muted">{row.equipment || "No equipment listed"}</small>
                              </div>
                            </div>
                          </td>
                          <td>{row.workoutType?.name || "-"}</td>
                          <td>{row.bodyPart?.name || "-"}</td>
                          <td>{row.difficulty || "-"}</td>
                          <td>
                            <span className={`badge ${String(row.status).toUpperCase() === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                              {row.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="text-end">
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
        title={isEdit ? "Edit Exercise" : "Add Exercise"}
        steps={STEP_FIELDS.map((step) => step.label)}
        step={modalStepIndex}
        onClose={closeModal}
        onBack={goToPrevStep}
        onNext={goToNextStep}
        onSubmit={handleSubmit}
        disabled={saving}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        {modalTab === "basic" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={form.difficulty} onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "mapping" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Workout Type</label>
              <select className="form-select" value={form.workoutTypeId} onChange={(e) => setForm((prev) => ({ ...prev, workoutTypeId: e.target.value }))}>
                <option value="">Select workout type</option>
                {workoutTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Body Part</label>
              <select className="form-select" value={form.bodyPartId} onChange={(e) => setForm((prev) => ({ ...prev, bodyPartId: e.target.value }))}>
                <option value="">Select body part</option>
                {bodyParts.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Equipment</label>
              <input className="form-control" value={form.equipment} onChange={(e) => setForm((prev) => ({ ...prev, equipment: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "performance" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Calories Burned</label>
              <input type="number" className="form-control" value={form.caloriesBurned} onChange={(e) => setForm((prev) => ({ ...prev, caloriesBurned: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Sets</label>
              <input type="number" className="form-control" value={form.sets} onChange={(e) => setForm((prev) => ({ ...prev, sets: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Reps</label>
              <input type="number" className="form-control" value={form.reps} onChange={(e) => setForm((prev) => ({ ...prev, reps: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Duration Minutes</label>
              <input type="number" className="form-control" value={form.durationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))} />
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

        {modalTab === "media" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Image</label>
              <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
              {uploading && <small className="text-muted d-block mt-2">Uploading...</small>}
              {form.image && (
                <div className="mt-2">
                  <img src={resolveDietImage(form.image)} alt="Exercise" style={{ maxWidth: 180, borderRadius: 8 }} />
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label">Video URL</label>
              <input className="form-control" value={form.videoUrl} onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "instructions" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Instructions (one step per line)</label>
              <textarea className="form-control" rows={6} value={form.instructionsText} onChange={(e) => setForm((prev) => ({ ...prev, instructionsText: e.target.value }))} />
            </div>
          </div>
        )}
      </WizardPopup>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{deleteTarget?.name || "this exercise"}</strong>?
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
