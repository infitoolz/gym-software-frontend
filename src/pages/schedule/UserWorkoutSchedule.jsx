import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { IconCalendarEvent, IconEdit, IconHome, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getWorkoutPlans, getWorkoutTypes } from "../../api/workoutApi";
import { getCustomersAssignedToTrainer, getVisibleTrainers } from "../../api/scheduleApi";
import {
  createUserWorkoutSchedule,
  deleteUserWorkoutSchedule,
  getUserWorkoutSchedules,
  updateUserWorkoutSchedule,
} from "../../api/scheduleApi";
import { normalizeUserWorkoutSchedule, getWorkoutEventColor, formatDateTimeForInput } from "./scheduleUtils";

const EMPTY_FORM = {
  trainerId: "",
  userId: "",
  workoutPlanId: "",
  workoutTypeId: "",
  title: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  repeatType: "None",
  location: "",
  completionStatus: "PENDING",
  notes: "",
  status: "ACTIVE",
};

const STEPS = ["Assignment", "Timing", "Progress"];

function toInputDateTime(value) {
  return formatDateTimeForInput(value);
}

function buildPayload(form) {
  return {
    trainerId: form.trainerId ? Number(form.trainerId) : null,
    userId: form.userId ? Number(form.userId) : null,
    workoutPlanId: form.workoutPlanId ? Number(form.workoutPlanId) : null,
    workoutTypeId: form.workoutTypeId ? Number(form.workoutTypeId) : null,
    title: form.title,
    description: form.description,
    startDateTime: form.startDateTime,
    endDateTime: form.endDateTime,
    repeatType: form.repeatType,
    location: form.location,
    completionStatus: form.completionStatus,
    notes: form.notes,
    status: form.status,
  };
}

export default function UserWorkoutSchedule() {
  const { hasPermission, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [users, setUsers] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalTab, setModalTab] = useState("assignment");
  const [form, setForm] = useState(EMPTY_FORM);

  const canView = hasPermission("user-workout-schedule", "view");
  const canCreate = hasPermission("user-workout-schedule", "create");
  const canEdit = hasPermission("user-workout-schedule", "edit");
  const canDelete = hasPermission("user-workout-schedule", "delete");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [scheduleRows, trainerRows, planRows, typeRows] = await Promise.all([
        getUserWorkoutSchedules(),
        user?.userId ? getVisibleTrainers(user.userId) : Promise.resolve([]),
        getWorkoutPlans(),
        getWorkoutTypes(),
      ]);

      setRows((Array.isArray(scheduleRows) ? scheduleRows : []).map(normalizeUserWorkoutSchedule).filter(Boolean));
      setTrainers(Array.isArray(trainerRows) ? trainerRows : []);
      setWorkoutPlans(Array.isArray(planRows) ? planRows : []);
      setWorkoutTypes(Array.isArray(typeRows) ? typeRows : []);
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, "Failed to load workout schedules"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [canView]);

  useEffect(() => {
    if (!canView) return;

    const selectedTrainerId = user?.role === "TRAINER" ? user?.userId : form.trainerId;
    if (!selectedTrainerId) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    const loadUsers = async () => {
      try {
        const userRows = await getCustomersAssignedToTrainer(selectedTrainerId);
        if (!cancelled) {
          setUsers(Array.isArray(userRows) ? userRows : []);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
        }
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [canView, form.trainerId, user?.role, user?.userId]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!canView) {
    return <div className="content"><div className="alert alert-danger">You do not have permission to manage workout schedules.</div></div>;
  }

  const calendarEvents = useMemo(() => rows.map((item) => ({
    id: String(item.id),
    title: item.title,
    start: item.startDateTime,
    end: item.endDateTime,
    backgroundColor: getWorkoutEventColor(item),
    borderColor: getWorkoutEventColor(item),
    extendedProps: { schedule: item },
  })), [rows]);

  const trainerOptions = useMemo(() => trainers.map((trainer) => ({
    id: trainer.id,
    label: [trainer.firstName, trainer.lastName].filter(Boolean).join(" ") || trainer.name || trainer.email || `Trainer ${trainer.id}`,
  })), [trainers]);

  const userOptions = useMemo(() => users.map((entry) => ({
    id: entry.id,
    label: [entry.firstName, entry.lastName].filter(Boolean).join(" ")
      || entry.email
      || entry.assignedTrainerName
      || `User ${entry.id}`,
  })), [users]);

  const workoutPlanOptions = useMemo(() => workoutPlans.map((plan) => ({
    id: plan.id,
    label: plan.name || `Workout Plan ${plan.id}`,
    workoutTypeId: plan?.exercises?.[0]?.workoutType?.id || "",
  })), [workoutPlans]);

  const workoutTypeOptions = useMemo(() => workoutTypes.map((type) => ({
    id: type.id,
    label: type.name || `Workout Type ${type.id}`,
  })), [workoutTypes]);

  const currentTrainerId = String(user?.userId || "");

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      trainerId: user?.role === "TRAINER" ? currentTrainerId : "",
    });
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setModalTab("assignment");
    setShowModal(true);
  };

  const openEdit = (row) => {
    const schedule = normalizeUserWorkoutSchedule(row);
    setForm({
      trainerId: schedule?.trainer?.id ? String(schedule.trainer.id) : "",
      userId: schedule?.user?.id ? String(schedule.user.id) : "",
      workoutPlanId: schedule?.workoutPlan?.id ? String(schedule.workoutPlan.id) : "",
      workoutTypeId: schedule?.workoutType?.id ? String(schedule.workoutType.id) : "",
      title: schedule?.title || "",
      description: schedule?.description || "",
      startDateTime: toInputDateTime(schedule?.startDateTime),
      endDateTime: toInputDateTime(schedule?.endDateTime),
      repeatType: schedule?.repeatType || "None",
      location: schedule?.location || "",
      completionStatus: schedule?.completionStatus || "PENDING",
      notes: schedule?.notes || "",
      status: schedule?.status || "ACTIVE",
    });
    setIsEdit(true);
    setSelectedId(row?.id);
    setModalError("");
    setModalTab("assignment");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setModalTab("assignment");
  };

  const validate = () => {
    if (user?.role !== "TRAINER" && !form.trainerId) return "Trainer is required";
    if (!form.userId) return "User is required";
    if (!form.workoutPlanId) return "Workout plan is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.startDateTime || !form.endDateTime) return "Start and end time are required";
    if (form.endDateTime < form.startDateTime) return "End time must be after start time";
    return null;
  };

  const handleSubmit = async () => {
    setModalError("");
    const validation = validate();
    if (validation) {
      setModalError(validation);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (isEdit) {
        await updateUserWorkoutSchedule(selectedId, payload);
        setNotice("Workout schedule updated successfully");
      } else {
        await createUserWorkoutSchedule(payload);
        setNotice("Workout schedule created successfully");
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setModalError(extractApiErrorMessage(err, "Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setSaving(true);
    try {
      await deleteUserWorkoutSchedule(deleteTarget.id);
      setNotice("Workout schedule deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  const eventClick = (info) => {
    if (!canEdit) return;
    const schedule = info?.event?.extendedProps?.schedule;
    if (schedule) openEdit(schedule);
  };

  const handleMove = async (info) => {
    if (!canEdit) {
      info.revert();
      return;
    }
    const schedule = info?.event?.extendedProps?.schedule;
    if (!schedule) return;
    try {
      await updateUserWorkoutSchedule(schedule.id, {
        trainerId: schedule.trainer?.id ? Number(schedule.trainer.id) : null,
        userId: schedule.user?.id ? Number(schedule.user.id) : null,
        workoutPlanId: schedule.workoutPlan?.id ? Number(schedule.workoutPlan.id) : null,
        workoutTypeId: schedule.workoutType?.id ? Number(schedule.workoutType.id) : null,
        title: schedule.title,
        description: schedule.description,
        startDateTime: formatDateTimeForInput(info.event.start),
        endDateTime: formatDateTimeForInput(info.event.end || info.event.start),
        repeatType: schedule.repeatType,
        location: schedule.location,
        completionStatus: schedule.completionStatus,
        notes: schedule.notes,
        status: schedule.status,
      });
      await loadData();
    } catch (err) {
      info.revert();
      setError(extractApiErrorMessage(err, "Unable to move schedule"));
    }
  };

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">User Workout Schedule</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">User Workout Schedule</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" />
              Add Workout Session
            </button>
          )}
        </div>

        <div className="card mb-3">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
                editable={canEdit}
                selectable={canEdit}
                events={calendarEvents}
                eventClick={eventClick}
                eventDrop={handleMove}
                eventResize={handleMove}
                height="auto"
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Trainer</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4">No workout schedules found</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="fw-semibold">{row.title}</div>
                          <small className="text-muted">{row.repeatType || "-"}</small>
                        </td>
                        <td>{row.trainer?.name || "-"}</td>
                        <td>{row.user?.name || "-"}</td>
                        <td>{row.workoutPlan?.name || "-"}</td>
                        <td>{row.workoutType?.name || "-"}</td>
                        <td>
                          <span className={`badge ${row.completionStatus === "COMPLETED" ? "bg-success" : row.completionStatus === "IN_PROGRESS" ? "bg-info" : "bg-warning text-dark"}`}>
                            {row.completionStatus || "PENDING"}
                          </span>
                        </td>
                        <td className="text-end">
                          {canEdit && (
                            <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(row)}><IconEdit size={14} /></button>
                          )}
                          {canDelete && (
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(row)}><IconTrash size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        open={showModal}
        title={isEdit ? "Edit Workout Schedule" : "Add Workout Schedule"}
        steps={STEPS}
        step={["assignment", "timing", "progress"].indexOf(modalTab)}
        onClose={closeModal}
        onBack={() => {
          if (modalTab === "timing") setModalTab("assignment");
          if (modalTab === "progress") setModalTab("timing");
        }}
        onNext={() => {
          setModalError("");
          if (modalTab === "assignment" && (!form.userId || !form.workoutPlanId)) {
            setModalError("User and workout plan are required");
            return;
          }
          if (modalTab === "assignment") setModalTab("timing");
          else if (modalTab === "timing") setModalTab("progress");
        }}
        onSubmit={handleSubmit}
        disabled={saving}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        {modalTab === "assignment" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Trainer</label>
              {user?.role === "TRAINER" ? (
                <input className="form-control" value={user?.name || "Current trainer"} disabled />
              ) : (
                <select
                  className="form-select"
                  value={form.trainerId}
                  onChange={(e) => setForm((prev) => ({ ...prev, trainerId: e.target.value, userId: "" }))}
                >
                  <option value="">Select trainer</option>
                  {trainerOptions.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.label}</option>)}
                </select>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">User</label>
              <select
                className="form-select"
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                disabled={user?.role !== "TRAINER" && !form.trainerId}
              >
                <option value="">Select user</option>
                {userOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Workout Plan</label>
              <select
                className="form-select"
                value={form.workoutPlanId}
                onChange={(e) => {
                  const selectedPlanId = e.target.value;
                  const selectedPlan = workoutPlanOptions.find((item) => String(item.id) === String(selectedPlanId));
                  setForm((prev) => ({
                    ...prev,
                    workoutPlanId: selectedPlanId,
                    workoutTypeId: selectedPlan?.workoutTypeId ? String(selectedPlan.workoutTypeId) : prev.workoutTypeId,
                  }));
                }}
              >
                <option value="">Select workout plan</option>
                {workoutPlanOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Workout Type</label>
              <select className="form-select" value={form.workoutTypeId} onChange={(e) => setForm((prev) => ({ ...prev, workoutTypeId: e.target.value }))}>
                <option value="">Select workout type</option>
                {workoutTypeOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "timing" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Start Date Time</label>
              <input type="datetime-local" className="form-control" value={form.startDateTime} onChange={(e) => setForm((prev) => ({ ...prev, startDateTime: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">End Date Time</label>
              <input type="datetime-local" className="form-control" value={form.endDateTime} onChange={(e) => setForm((prev) => ({ ...prev, endDateTime: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Repeat Type</label>
              <select className="form-select" value={form.repeatType} onChange={(e) => setForm((prev) => ({ ...prev, repeatType: e.target.value }))}>
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
            </div>
          </div>
        )}

        {modalTab === "progress" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Completion Status</label>
              <select className="form-select" value={form.completionStatus} onChange={(e) => setForm((prev) => ({ ...prev, completionStatus: e.target.value }))}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={4} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
        )}
      </WizardPopup>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Delete <strong>{deleteTarget?.title || "this workout schedule"}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleteTarget(null)} type="button">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} type="button">{saving ? "Deleting..." : "Delete"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
