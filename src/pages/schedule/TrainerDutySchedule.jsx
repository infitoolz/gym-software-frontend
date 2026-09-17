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
import { getVisibleTrainers } from "../../api/scheduleApi";
import {
  createTrainerDutySchedule,
  deleteTrainerDutySchedule,
  getMyTrainerDutySchedules,
  getTrainerDutySchedules,
  updateTrainerDutySchedule,
} from "../../api/scheduleApi";
import { normalizeTrainerDutySchedule, getDutyEventColor, formatDateTimeForInput, formatDateTimeForDisplay, formatTimeRange } from "./scheduleUtils";

const EMPTY_FORM = {
  trainerId: "",
  title: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  repeatType: "None",
  shiftType: "General",
  location: "",
  status: "ACTIVE",
  notes: "",
};

const STEPS = ["Assignment", "Timing", "Notes"];

function toInputDateTime(value) {
  return formatDateTimeForInput(value);
}

function buildPayload(form) {
  return {
    trainerId: form.trainerId ? Number(form.trainerId) : null,
    title: form.title,
    description: form.description,
    startDateTime: form.startDateTime,
    endDateTime: form.endDateTime,
    repeatType: form.repeatType,
    shiftType: form.shiftType,
    location: form.location,
    status: form.status,
    notes: form.notes,
  };
}

export default function TrainerDutySchedule() {
  const { hasPermission, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [trainers, setTrainers] = useState([]);
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

  const canView = hasPermission("trainer-duty-schedule", "view");
  const canCreate = hasPermission("trainer-duty-schedule", "create");
  const canEdit = hasPermission("trainer-duty-schedule", "edit");
  const canDelete = hasPermission("trainer-duty-schedule", "delete");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [scheduleRows, trainerRows, myRows] = await Promise.all([
        getTrainerDutySchedules(),
        user?.userId ? getVisibleTrainers(user.userId) : Promise.resolve([]),
        user?.userId && user?.role === "TRAINER" ? getMyTrainerDutySchedules() : Promise.resolve([]),
      ]);
      const normalizedRows = (Array.isArray(scheduleRows) ? scheduleRows : []).map(normalizeTrainerDutySchedule).filter(Boolean);
      setRows(user?.role === "TRAINER" && myRows.length ? myRows.map(normalizeTrainerDutySchedule).filter(Boolean) : normalizedRows);
      setTrainers(Array.isArray(trainerRows) ? trainerRows : []);
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, "Failed to load trainer duty schedules"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [canView]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!canView) {
    return <div className="content"><div className="alert alert-danger">You do not have permission to view trainer duty schedules.</div></div>;
  }

  const pageRows = useMemo(() => rows, [rows]);
  const calendarEvents = useMemo(() => pageRows.map((item) => ({
    id: String(item.id),
    title: item.title,
    start: item.startDateTime,
    end: item.endDateTime,
    backgroundColor: getDutyEventColor(item),
    borderColor: getDutyEventColor(item),
    display: "block",
    extendedProps: { schedule: item },
  })), [pageRows]);

  const trainerOptions = useMemo(() => trainers.map((trainer) => ({
    id: trainer.id,
    label: [trainer.firstName, trainer.lastName].filter(Boolean).join(" ") || trainer.name || trainer.email || `Trainer ${trainer.id}`,
  })), [trainers]);
  const initialCalendarView = user?.role === "TRAINER" ? "listWeek" : "dayGridMonth";

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setModalTab("assignment");
    setShowModal(true);
  };

  const openEdit = (row) => {
    const schedule = normalizeTrainerDutySchedule(row);
    setForm({
      trainerId: schedule?.trainer?.id ? String(schedule.trainer.id) : "",
      title: schedule?.title || "",
      description: schedule?.description || "",
      startDateTime: toInputDateTime(schedule?.startDateTime),
      endDateTime: toInputDateTime(schedule?.endDateTime),
      repeatType: schedule?.repeatType || "None",
      shiftType: schedule?.shiftType || "General",
      location: schedule?.location || "",
      status: schedule?.status || "ACTIVE",
      notes: schedule?.notes || "",
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
    if (!form.trainerId) return "Trainer is required";
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
        await updateTrainerDutySchedule(selectedId, payload);
        setNotice("Trainer duty schedule updated successfully");
      } else {
        await createTrainerDutySchedule(payload);
        setNotice("Trainer duty schedule created successfully");
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
      await deleteTrainerDutySchedule(deleteTarget.id);
      setNotice("Trainer duty schedule deleted successfully");
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
      await updateTrainerDutySchedule(schedule.id, {
        trainerId: schedule.trainer?.id ? Number(schedule.trainer.id) : null,
        title: schedule.title,
        description: schedule.description,
        startDateTime: formatDateTimeForInput(info.event.start),
        endDateTime: formatDateTimeForInput(info.event.end || info.event.start),
        repeatType: schedule.repeatType,
        shiftType: schedule.shiftType,
        location: schedule.location,
        status: schedule.status,
        notes: schedule.notes,
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
            <h2 className="mb-1">Trainer Duty Schedule</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">Trainer Duty Schedule</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" />
              Add Duty Schedule
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
                initialView={initialCalendarView}
                headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
                eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                eventContent={(arg) => {
                  const schedule = arg?.event?.extendedProps?.schedule;
                  return (
                    <div className="text-start small text-white">
                      <div className="fw-semibold text-truncate" style={{ maxWidth: "100%" }}>
                        {schedule?.title || arg.event.title}
                      </div>
                      <div className="opacity-75 text-truncate" style={{ maxWidth: "100%" }}>
                        {formatTimeRange(schedule?.startDateTime || arg.event.start, schedule?.endDateTime || arg.event.end)}
                      </div>
                      {schedule?.trainer?.name && (
                        <div className="opacity-75 text-truncate" style={{ maxWidth: "100%" }}>
                          {schedule.trainer.name}
                        </div>
                      )}
                    </div>
                  );
                }}
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
                    <th>Shift</th>
                    <th>Trainer</th>
                    <th>Time</th>
                    <th>Repeat</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4">No trainer duty schedules found</td></tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="fw-semibold">{row.title}</div>
                          <small className="text-muted">{row.shiftType || "-"}</small>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 240 }}>
                            {row.location || "No location set"}
                          </div>
                        </td>
                        <td>{row.trainer?.name || "-"}</td>
                        <td>
                          <small className="d-block">{formatDateTimeForDisplay(row.startDateTime)}</small>
                          <small className="d-block text-muted">{formatDateTimeForDisplay(row.endDateTime)}</small>
                        </td>
                        <td>{row.repeatType || "-"}</td>
                        <td><span className={`badge ${String(row.status) === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>{row.status || "ACTIVE"}</span></td>
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
        title={isEdit ? "Edit Trainer Duty Schedule" : "Add Trainer Duty Schedule"}
        steps={STEPS}
        step={["assignment", "timing", "notes"].indexOf(modalTab)}
        onClose={closeModal}
        onBack={() => {
          if (modalTab === "timing") setModalTab("assignment");
          if (modalTab === "notes") setModalTab("timing");
        }}
        onNext={() => {
          setModalError("");
          if (modalTab === "assignment" && !form.trainerId) {
            setModalError("Trainer is required");
            return;
          }
          if (modalTab === "assignment") setModalTab("timing");
          else if (modalTab === "timing") setModalTab("notes");
        }}
        onSubmit={handleSubmit}
        disabled={saving}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        {modalTab === "assignment" && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Trainer</label>
              <select className="form-select" value={form.trainerId} onChange={(e) => setForm((prev) => ({ ...prev, trainerId: e.target.value }))}>
                <option value="">Select trainer</option>
                {trainerOptions.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Shift Type</label>
              <select className="form-select" value={form.shiftType} onChange={(e) => setForm((prev) => ({ ...prev, shiftType: e.target.value }))}>
                <option value="General">General</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
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

        {modalTab === "timing" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
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

        {modalTab === "notes" && (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Current Start</label>
              <input className="form-control" value={form.startDateTime ? formatDateTimeForDisplay(form.startDateTime) : "-"} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">Current End</label>
              <input className="form-control" value={form.endDateTime ? formatDateTimeForDisplay(form.endDateTime) : "-"} disabled />
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
        <Modal.Body>Delete <strong>{deleteTarget?.title || "this trainer duty schedule"}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleteTarget(null)} type="button">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} type="button">{saving ? "Deleting..." : "Delete"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
