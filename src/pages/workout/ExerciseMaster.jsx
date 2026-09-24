import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { 
  IconHome, 
  IconEdit, 
  IconTrash, 
  IconPlus, 
  IconPhoto,
  IconEye,
  IconClock,
  IconFlame,
  IconBarbell,
  IconRepeat,
  IconBolt,
  IconUserStar,
  IconTools,
  IconVideo,
  IconExternalLink,
  IconInfoCircle,
  IconCheck
} from "@tabler/icons-react";
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
import CommonTable from "../../components/CommonTable";

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalTab, setModalTab] = useState("basic");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [uploading, setUploading] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
    setFieldErrors({});
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
    setFieldErrors({});
    setModalTab("basic");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setFieldErrors({});
    setModalTab("basic");
  };

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("file", file);
    const response = await api.post("/uploads/diet-images", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (
      response.data?.data?.url ||
      response.data?.data?.path ||
      response.data?.url ||
      response.data?.path ||
      ""
    );
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setModalError("");
    try {
      const path = await uploadImage(file);
      if (!path) {
        setModalError("No file path returned from server");
        return;
      }
      setForm((prev) => ({ ...prev, image: path }));
    } catch (err) {
      setModalError(extractApiErrorMessage(err, "Image upload failed"));
    } finally {
      setUploading(false);
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
    const errors = {};
    if (modalTab === "basic" && !form.name?.trim()) {
      errors.name = "Exercise name is required";
    }
    if (modalTab === "mapping") {
      if (!form.workoutTypeId) {
        errors.workoutTypeId = "Workout type is required";
      }
      if (!form.bodyPartId) {
        errors.bodyPartId = "Body part is required";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
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
    const errors = {};
    if (!form.name?.trim()) errors.name = "Exercise name is required";
    if (!form.workoutTypeId) errors.workoutTypeId = "Workout type is required";
    if (!form.bodyPartId) errors.bodyPartId = "Body part is required";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) setModalTab("basic");
      else if (errors.workoutTypeId || errors.bodyPartId) setModalTab("mapping");
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

        <CommonTable
          columns={[
            {
              key: "name",
              label: "EXERCISE",
              sortable: true,
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  {row.image ? (
                    <img src={resolveDietImage(row.image)} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 38, height: 38, background: "rgba(255,255,255,0.06)" }}>
                      <IconPhoto size={16} />
                    </div>
                  )}
                  <div>
                    <div className="fw-semibold text-white">{row.name}</div>
                    <small className="text-muted">{row.equipment || "No equipment listed"}</small>
                  </div>
                </div>
              ),
              cardRender: (val, row) => row.name,
            },
            {
              key: "workoutType",
              label: "TYPE",
              sortable: true,
              render: (val, row) => row.workoutType?.name || "-",
            },
            {
              key: "bodyPart",
              label: "BODY PART",
              sortable: true,
              render: (val, row) => row.bodyPart?.name || "-",
            },
            {
              key: "difficulty",
              label: "DIFFICULTY",
              sortable: true,
              render: (val, row) => row.difficulty || "-",
            },
            {
              key: "status",
              label: "STATUS",
              sortable: true,
            },
          ]}
          data={pageRows}
          entityName="exercise"
          loading={loading}
          onEdit={openEdit}
          onDelete={confirmDelete}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              try { await deleteExercise(id); } catch (e) {}
            }
            setNotice(`${ids.length} exercises deleted successfully`);
            await loadData();
          }}
          customActions={(row) => (
            <button
              type="button"
              className="ct-action-btn ct-btn-view"
              title="View Exercise Details"
              onClick={() => setViewTarget(row)}
            >
              <IconEye size={14} />
            </button>
          )}
          canEdit={canEdit}
          canDelete={canDelete}
        />
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
              <label className="form-label">Name <span className="req">*</span></label>
              <input
                className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => {
                  clearFieldError("name");
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                }}
              />
              {fieldErrors.name && <div className="avm-field-error">{fieldErrors.name}</div>}
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
              <label className="form-label">Workout Type <span className="req">*</span></label>
              <select
                className={`form-select ${fieldErrors.workoutTypeId ? "is-invalid" : ""}`}
                value={form.workoutTypeId}
                onChange={(e) => {
                  clearFieldError("workoutTypeId");
                  setForm((prev) => ({ ...prev, workoutTypeId: e.target.value }));
                }}
              >
                <option value="">Select workout type</option>
                {workoutTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {fieldErrors.workoutTypeId && <div className="avm-field-error">{fieldErrors.workoutTypeId}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Body Part <span className="req">*</span></label>
              <select
                className={`form-select ${fieldErrors.bodyPartId ? "is-invalid" : ""}`}
                value={form.bodyPartId}
                onChange={(e) => {
                  clearFieldError("bodyPartId");
                  setForm((prev) => ({ ...prev, bodyPartId: e.target.value }));
                }}
              >
                <option value="">Select body part</option>
                {bodyParts.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {fieldErrors.bodyPartId && <div className="avm-field-error">{fieldErrors.bodyPartId}</div>}
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
              {uploading && <small className="text-primary d-block mt-2">Uploading image...</small>}
              {form.image && (
                <div className="mt-2 d-flex align-items-center gap-3">
                  <img
                    src={resolveDietImage(form.image)}
                    alt="Exercise"
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                  >
                    Remove Image
                  </button>
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

      {/* ── View Exercise Details Modal ── */}
      <Modal show={Boolean(viewTarget)} onHide={() => setViewTarget(null)} size="lg" centered className="exercise-view-modal">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2 flex-wrap">
            <span>{viewTarget?.name}</span>
            <span
              className={`badge ${
                String(viewTarget?.status).toUpperCase() === "ACTIVE"
                  ? "bg-success"
                  : "bg-danger"
              }`}
              style={{ fontSize: "0.75rem" }}
            >
              {viewTarget?.status || "ACTIVE"}
            </span>
            {viewTarget?.difficulty && (
              <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                {viewTarget.difficulty}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewTarget && (
            <div className="d-flex flex-column gap-3">
              {/* Media & Key Tags */}
              <div className="row g-3 align-items-center">
                <div className="col-md-5 text-center">
                  {viewTarget.image ? (
                    <img
                      src={resolveDietImage(viewTarget.image)}
                      alt={viewTarget.name}
                      className="exercise-view-thumb img-fluid"
                    />
                  ) : (
                    <div className="exercise-no-thumb">
                      <IconPhoto size={42} stroke={1.5} />
                      <span className="small mt-2">No demonstration image</span>
                    </div>
                  )}
                </div>

                <div className="col-md-7">
                  <div className="exercise-tags-wrap">
                    <div className="tag-row">
                      <span className="tag-label">
                        <IconBolt size={15} className="text-warning" /> Workout Type:
                      </span>
                      <span className="tag-val">
                        {viewTarget.workoutType?.name || "General"}
                      </span>
                    </div>

                    <div className="tag-row">
                      <span className="tag-label">
                        <IconUserStar size={15} className="text-primary" /> Body Part:
                      </span>
                      <span className="tag-val">
                        {viewTarget.bodyPart?.name || "Full Body"}
                      </span>
                    </div>

                    <div className="tag-row">
                      <span className="tag-label">
                        <IconTools size={15} className="text-info" /> Equipment:
                      </span>
                      <span className="tag-val">
                        {viewTarget.equipment || "Bodyweight / None"}
                      </span>
                    </div>

                    {viewTarget.videoUrl && (
                      <div className="mt-2">
                        <a
                          href={viewTarget.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        >
                          <IconVideo size={15} /> Watch Tutorial Video <IconExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Performance Metric Chips */}
              <div className="row g-2 text-center pt-2">
                <div className="col-6 col-sm-3">
                  <div className="exercise-metric-chip">
                    <div className="metric-label">
                      <IconBarbell size={14} className="text-primary" /> Sets
                    </div>
                    <div className="metric-value">{viewTarget.sets || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="exercise-metric-chip">
                    <div className="metric-label">
                      <IconRepeat size={14} className="text-info" /> Reps
                    </div>
                    <div className="metric-value">{viewTarget.reps || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="exercise-metric-chip">
                    <div className="metric-label">
                      <IconClock size={14} className="text-warning" /> Duration
                    </div>
                    <div className="metric-value">{viewTarget.durationMinutes || 0} min</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="exercise-metric-chip">
                    <div className="metric-label">
                      <IconFlame size={14} className="text-danger" /> Calories
                    </div>
                    <div className="metric-value">{viewTarget.caloriesBurned || 0} kcal</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewTarget.description && (
                <div>
                  <h6 className="fw-bold mb-1 d-flex align-items-center gap-1">
                    <IconInfoCircle size={16} className="text-primary" /> Description
                  </h6>
                  <p className="exercise-desc-box">
                    {viewTarget.description}
                  </p>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div>
                <h6 className="fw-bold mb-2">Step-by-Step Instructions</h6>
                {viewTarget.instructions && viewTarget.instructions.length > 0 ? (
                  <div className="d-flex flex-column">
                    {viewTarget.instructions.map((step, idx) => (
                      <div key={idx} className="exercise-step-item">
                        <span className="step-number">{idx + 1}</span>
                        <div className="step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0 fst-italic">
                    No detailed step instructions provided for this exercise.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setViewTarget(null)} type="button">
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              onClick={() => {
                const target = viewTarget;
                setViewTarget(null);
                openEdit(target);
              }}
              type="button"
            >
              <IconEdit size={16} className="me-1" /> Edit Exercise
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
