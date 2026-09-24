import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import {
  IconCalendarEvent,
  IconEdit,
  IconHome,
  IconPlus,
  IconTrash,
  IconBarbell,
  IconCheck,
  IconClock,
  IconActivity,
} from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import CommonTable from "../../components/CommonTable";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getWorkoutPlans, getWorkoutTypes } from "../../api/workoutApi";
import { getCustomersAssignedToTrainer, getVisibleTrainers } from "../../api/scheduleApi";
import {
  createUserWorkoutSchedule,
  deleteUserWorkoutSchedule,
  getUserWorkoutSchedules,
  updateUserWorkoutSchedule,
} from "../../api/scheduleApi";
import {
  normalizeUserWorkoutSchedule,
  getWorkoutEventColor,
  formatDateTimeForInput,
  formatTimeRange,
} from "./scheduleUtils";

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalTab, setModalTab] = useState("assignment");
  const [form, setForm] = useState(EMPTY_FORM);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

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

  const kpiStats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => String(r.completionStatus).toUpperCase() === "COMPLETED").length;
    const inProgress = rows.filter((r) => String(r.completionStatus).toUpperCase() === "IN_PROGRESS").length;
    const pending = rows.filter((r) => {
      const s = String(r.completionStatus || "").toUpperCase();
      return s === "PENDING" || !s;
    }).length;
    return { total, completed, inProgress, pending };
  }, [rows]);

  const renderEventContent = (eventInfo) => {
    const schedule = eventInfo.event.extendedProps?.schedule;
    const completion = String(schedule?.completionStatus || "PENDING").toLowerCase();
    const timeText = eventInfo.timeText;
    const userName = schedule?.user?.name;
    return (
      <div
        className={`workout-event-capsule status-${completion}`}
        title={`${eventInfo.event.title}${userName ? ` • Member: ${userName}` : ""}`}
      >
        <span className="event-status-dot" />
        {timeText && <span className="event-time-pill">{timeText}</span>}
        <span className="event-title-text">{eventInfo.event.title}</span>
        {userName && <span className="event-user-badge">({userName})</span>}
      </div>
    );
  };

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

  const tableData = useMemo(() => rows.map((row) => ({
    ...row,
    trainerName: row.trainer?.name || "-",
    userName: row.user?.name || "-",
    workoutPlanName: row.workoutPlan?.name || "-",
    workoutTypeName: row.workoutType?.name || "-",
  })), [rows]);

  const columns = useMemo(() => [
    {
      key: "title",
      label: "Session",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="fw-semibold text-dark">{row.title}</div>
          <small className="text-muted">{row.repeatType || "No repeat"}</small>
        </div>
      ),
    },
    {
      key: "trainerName",
      label: "Trainer",
      sortable: true,
      render: (val, row) => row.trainerName,
    },
    {
      key: "userName",
      label: "User",
      sortable: true,
      render: (val, row) => row.userName,
    },
    {
      key: "workoutPlanName",
      label: "Workout Plan",
      sortable: true,
      render: (val, row) => row.workoutPlanName,
    },
    {
      key: "workoutTypeName",
      label: "Workout Type",
      sortable: true,
      render: (val, row) => row.workoutTypeName,
    },
    {
      key: "completionStatus",
      label: "Status",
      sortable: true,
      render: (val, row) => {
        const status = String(row.completionStatus || "PENDING").toUpperCase();
        const badgeClass =
          status === "COMPLETED"
            ? "bg-success"
            : status === "IN_PROGRESS"
            ? "bg-info"
            : "bg-warning text-dark";
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      },
    },
  ], []);

  const currentTrainerId = String(user?.userId || "");

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      trainerId: user?.role === "TRAINER" && user?.userId ? String(user.userId) : "",
    });
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setFieldErrors({});
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
    setFieldErrors({});
    setModalTab("assignment");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setFieldErrors({});
    setModalTab("assignment");
  };

  const validate = () => {
    const errors = {};
    if (user?.role !== "TRAINER" && !form.trainerId) errors.trainerId = "Trainer is required";
    if (!form.userId) errors.userId = "User is required";
    if (!form.workoutPlanId) errors.workoutPlanId = "Workout plan is required";
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.startDateTime) errors.startDateTime = "Start date time is required";
    if (!form.endDateTime) errors.endDateTime = "End date time is required";
    if (form.startDateTime && form.endDateTime && form.endDateTime < form.startDateTime) {
      errors.endDateTime = "End time must be after start time";
    }
    return errors;
  };

  const handleSubmit = async () => {
    setModalError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.trainerId || errors.userId || errors.workoutPlanId || errors.title) {
        setModalTab("assignment");
      } else {
        setModalTab("timing");
      }
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
    <div className="page-wrapper users-page-wrapper workout-schedule-page">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold">User Workout Schedule</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">User Workout Schedule</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold" onClick={openAdd}>
              <IconPlus size={18} />
              <span>Add Workout Session</span>
            </button>
          )}
        </div>

        {/* KPI Stats Overview Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3">
            <div className="workout-kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <IconBarbell size={24} />
              </div>
              <div>
                <div className="kpi-value">{kpiStats.total}</div>
                <div className="kpi-label">Total Sessions</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="workout-kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
                <IconCheck size={24} />
              </div>
              <div>
                <div className="kpi-value">{kpiStats.completed}</div>
                <div className="kpi-label">Completed Sessions</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="workout-kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#f0f9ff", color: "#0284c7" }}>
                <IconActivity size={24} />
              </div>
              <div>
                <div className="kpi-value">{kpiStats.inProgress}</div>
                <div className="kpi-label">In Progress</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="workout-kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#fff7ed", color: "#f97316" }}>
                <IconClock size={24} />
              </div>
              <div>
                <div className="kpi-value">{kpiStats.pending}</div>
                <div className="kpi-label">Pending / Scheduled</div>
              </div>
            </div>
          </div>
        </div>

        <div className="workout-calendar-card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-2 text-muted fw-medium">Loading schedule calendar...</div>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
                editable={canEdit}
                selectable={canEdit}
                events={calendarEvents}
                eventContent={renderEventContent}
                eventClick={eventClick}
                eventDrop={handleMove}
                eventResize={handleMove}
                height={530}
              />
            )}
          </div>
        </div>

        <div className="workout-table-section mt-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <IconCalendarEvent size={20} className="text-primary" />
                <span>Workout Sessions Overview</span>
              </h5>
              <small className="text-muted">Search, filter, and manage scheduled workout sessions</small>
            </div>
          </div>

          <CommonTable
            columns={columns}
            data={tableData}
            entityName="workout schedule"
            searchPlaceholder="Search session, trainer, user, plan..."
            searchKeys={["title", "trainerName", "userName", "workoutPlanName", "workoutTypeName", "completionStatus"]}
            loading={loading}
            onEdit={canEdit ? openEdit : null}
            onDelete={canDelete ? (row) => setDeleteTarget(row) : null}
            canEdit={canEdit}
            canDelete={canDelete}
            defaultPageSize={10}
            filterOptions={[
              { label: "All Status", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
            ]}
          />
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
          if (modalTab === "assignment") {
            const errs = {};
            if (user?.role !== "TRAINER" && !form.trainerId) errs.trainerId = "Trainer is required";
            if (!form.userId) errs.userId = "User is required";
            if (!form.workoutPlanId) errs.workoutPlanId = "Workout plan is required";
            if (!form.title.trim()) errs.title = "Title is required";
            if (Object.keys(errs).length > 0) {
              setFieldErrors((prev) => ({ ...prev, ...errs }));
              return;
            }
          }
          if (modalTab === "timing") {
            const errs = {};
            if (!form.startDateTime) errs.startDateTime = "Start date time is required";
            if (!form.endDateTime) errs.endDateTime = "End date time is required";
            if (form.startDateTime && form.endDateTime && form.endDateTime < form.startDateTime) {
              errs.endDateTime = "End time must be after start time";
            }
            if (Object.keys(errs).length > 0) {
              setFieldErrors((prev) => ({ ...prev, ...errs }));
              return;
            }
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
                <>
                  <select
                    className={`form-select ${fieldErrors.trainerId ? "is-invalid" : ""}`}
                    value={form.trainerId}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, trainerId: e.target.value, userId: "" }));
                      clearFieldError("trainerId");
                    }}
                  >
                    <option value="">Select trainer</option>
                    {trainerOptions.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.label}</option>)}
                  </select>
                  {fieldErrors.trainerId && <div className="avm-field-error">{fieldErrors.trainerId}</div>}
                </>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">User *</label>
              <select
                className={`form-select ${fieldErrors.userId ? "is-invalid" : ""}`}
                value={form.userId}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, userId: e.target.value }));
                  clearFieldError("userId");
                }}
                disabled={user?.role !== "TRAINER" && !form.trainerId}
              >
                <option value="">Select user</option>
                {userOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              {fieldErrors.userId && <div className="avm-field-error">{fieldErrors.userId}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Workout Plan *</label>
              <select
                className={`form-select ${fieldErrors.workoutPlanId ? "is-invalid" : ""}`}
                value={form.workoutPlanId}
                onChange={(e) => {
                  const selectedPlanId = e.target.value;
                  const selectedPlan = workoutPlanOptions.find((item) => String(item.id) === String(selectedPlanId));
                  setForm((prev) => ({
                    ...prev,
                    workoutPlanId: selectedPlanId,
                    workoutTypeId: selectedPlan?.workoutTypeId ? String(selectedPlan.workoutTypeId) : prev.workoutTypeId,
                  }));
                  clearFieldError("workoutPlanId");
                }}
              >
                <option value="">Select workout plan</option>
                {workoutPlanOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              {fieldErrors.workoutPlanId && <div className="avm-field-error">{fieldErrors.workoutPlanId}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Workout Type</label>
              <select className="form-select" value={form.workoutTypeId} onChange={(e) => setForm((prev) => ({ ...prev, workoutTypeId: e.target.value }))}>
                <option value="">Select workout type</option>
                {workoutTypeOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Title *</label>
              <input
                className={`form-control ${fieldErrors.title ? "is-invalid" : ""}`}
                value={form.title}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, title: e.target.value }));
                  clearFieldError("title");
                }}
              />
              {fieldErrors.title && <div className="avm-field-error">{fieldErrors.title}</div>}
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
              <label className="form-label">Start Date Time *</label>
              <input
                type="datetime-local"
                className={`form-control ${fieldErrors.startDateTime ? "is-invalid" : ""}`}
                value={form.startDateTime}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, startDateTime: e.target.value }));
                  clearFieldError("startDateTime");
                }}
              />
              {fieldErrors.startDateTime && <div className="avm-field-error">{fieldErrors.startDateTime}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">End Date Time *</label>
              <input
                type="datetime-local"
                className={`form-control ${fieldErrors.endDateTime ? "is-invalid" : ""}`}
                value={form.endDateTime}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, endDateTime: e.target.value }));
                  clearFieldError("endDateTime");
                }}
              />
              {fieldErrors.endDateTime && <div className="avm-field-error">{fieldErrors.endDateTime}</div>}
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
