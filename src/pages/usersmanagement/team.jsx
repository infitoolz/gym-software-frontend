import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { IconHome, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { 
  getAllTeams, 
  getTeamsByDepartment,
  createTeam, 
  updateTeam, 
  deleteTeam,
  getAllDepartments
} from "../../api/orgHierarchyApi";
import { getTrainers } from "../../api/userAdminApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";

const EMPTY_FORM = {
  name: "",
  departmentId: "",
  description: "",
  teamLead: "",
  status: "ACTIVE",
};

const TEAM_STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "description", label: "Description" },
];

function getTeamLeadValue(team) {
  const rawLead =
    team?.teamLead ??
    team?.teamLeadName ??
    team?.trainer ??
    team?.trainerName ??
    "";

  if (rawLead && typeof rawLead === "object") {
    return String(rawLead.name ?? rawLead.fullName ?? rawLead.label ?? "").trim();
  }

  return String(rawLead || "").trim();
}

function buildTeamLeadToken(trainer) {
  if (!trainer) return "";

  const id = String(trainer?.id ?? "").trim();
  const name =
    [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") ||
    trainer?.name ||
    "";

  if (!id && !name) return "";
  if (!id) return name.trim();
  if (!name) return id;
  return `${id}::${name.trim()}`;
}

function splitTeamLeadToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return { id: "", name: "" };

  const [id, ...rest] = raw.split("::");
  if (rest.length) {
    return { id: id.trim(), name: rest.join("::").trim() };
  }

  return { id: "", name: raw };
}

function getTrainerDisplayLabel(trainer) {
  if (!trainer) return "";

  const firstLast = [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ").trim();
  const fallbackName =
    String(trainer?.name || trainer?.fullName || trainer?.label || trainer?.email || "").trim();

  return firstLast || fallbackName || `Trainer ${trainer?.id}`;
}

export default function TeamPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const currentRole = String(currentUser?.role || "").toUpperCase();
  const currentUserId = currentUser?.userId ?? currentUser?.id ?? localStorage.getItem("userId") ?? null;

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalTab, setModalTab] = useState("basic");

  const modalStepIndex = useMemo(() => {
    const index = TEAM_STEPS.findIndex((item) => item.key === modalTab);
    return index >= 0 ? index : 0;
  }, [modalTab]);

  const modalStepCount = TEAM_STEPS.length;

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (currentRole === "SUPER_ADMIN") {
        data = await getAllTeams();
      } else if (currentRole === "ADMIN") {
        data = await getAllTeams(); // Will filter in service layer
      } else if (currentRole === "MANAGER") {
        data = await getAllTeams(); // Will filter by their branch
      } else {
        data = [];
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(extractApiErrorMessage(e, "Failed to load teams"));
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    setDeptLoading(true);
    try {
      const data = await getAllDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  };

  const loadTrainers = async () => {
    setTrainerLoading(true);
    try {
      const requesterId = currentUserId ? Number(currentUserId) || currentUserId : null;
      const data = requesterId ? await getTrainers(requesterId) : [];
      setTrainers(Array.isArray(data) ? data : []);
    } catch (e) {
      setTrainers([]);
    } finally {
      setTrainerLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadDepartments();
    loadTrainers();
  }, [currentUserId]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  // ── Authorization Check ───────────────────────────────────────────────────────

  if (!hasPermission("teams")) {
    return (
      <div className="content">
        <div className="alert alert-danger">
          ⛔ You do not have permission to manage Teams
        </div>
      </div>
    );
  }

  // ── Modal open/close ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setModalError("");
    setModalTab("basic");
    setShowModal(true);
  };

  const openEdit = (team) => {
    const leadToken = String(team?.teamLead || "").trim();
    const leadParts = splitTeamLeadToken(leadToken);
    const matchedTrainer =
      trainers.find((trainer) => String(trainer.id) === leadParts.id) ||
      trainers.find((trainer) => {
        const label = [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") || trainer?.name || "";
        return label.trim() === leadParts.name;
      }) ||
      null;

    setForm({
      name: team?.name || "",
      departmentId: String(team?.departmentId || ""),
      description: team?.description || "",
      teamLead: matchedTrainer ? buildTeamLeadToken(matchedTrainer) : leadToken,
      status: String(team?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(team?.id);
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

  const goToNextModalStep = () => {
    setModalError("");
    
    // Validate current step before proceeding
    if (modalTab === "basic") {
      if (!form.name?.trim()) {
        setModalError("Team name is required");
        return;
      }
      if (!form.departmentId) {
        setModalError("Department is required");
        return;
      }
    }
    
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(TEAM_STEPS[modalStepIndex + 1].key);
    }
  };

  const goToPreviousModalStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(TEAM_STEPS[modalStepIndex - 1].key);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────────

  const validateForm = () => {
    if (!form.name?.trim()) {
      return "Team name is required";
    }
    if (!form.departmentId) {
      return "Department is required";
    }
    return null;
  };

  const handleSubmit = async () => {
    setModalError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setModalError(validationMessage);
      setModalTab("basic");
      return;
    }

    const payload = {
      name: form.name.trim(),
      departmentId: Number(form.departmentId),
      description: form.description?.trim() || null,
      teamLead: form.teamLead?.trim() || null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateTeam(selectedId, payload);
        setNotice("Team updated successfully");
      } else {
        await createTeam(payload);
        setNotice("Team added successfully");
      }
      closeModal();
      setForm(EMPTY_FORM);
      setSelectedId(null);
      await loadData();
    } catch (e) {
      setModalError(extractApiErrorMessage(e, "Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const confirmDelete = (id) => {
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await deleteTeam(deleteTarget);
      setNotice("Team deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to delete team"));
    } finally {
      setSaving(false);
    }
  };

  // ── Statistics ─────────────────────────────────────────────────────────────────

  const totalTeams = rows.length;
  const activeTeams = rows.filter(t => String(t?.status || "").toUpperCase() === "ACTIVE").length;
  const totalMembers = rows.reduce((sum, t) => sum + (Number(t?.memberCount) || 0), 0);

  // ── Form Renderers ────────────────────────────────────────────────────────────

  const renderBasicInfoFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Team Information</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Team Name *</label>
        <input
          className="form-control"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Enter team name"
        />
      </div>

      <div className="col-md-12">
        <label className="form-label">Department *</label>
        <select
          className="form-select"
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          disabled={deptLoading}
        >
          <option value="">Select Department</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-12">
        <label className="form-label">Team Trainer</label>
        <select
          className="form-select"
          value={form.teamLead}
          onChange={(e) => setForm({ ...form, teamLead: e.target.value })}
          disabled={trainerLoading}
        >
          <option value="">Select Trainer</option>
          {trainers.map((trainer) => {
            const label = getTrainerDisplayLabel(trainer);
            return (
              <option key={trainer.id} value={buildTeamLeadToken(trainer)}>
                {label}
              </option>
            );
          })}
        </select>
        <small className="text-muted d-block mt-1">
          Optional: choose the trainer responsible for this team.
        </small>
      </div>

      <div className="col-md-6">
        <label className="form-label">Status</label>
        <select
          className="form-select"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    </div>
  );

  const renderDescriptionFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Team Description</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the team's purpose, responsibilities, and goals"
        />
        <small className="text-muted d-block mt-1">
          Optional: Add details about this team
        </small>
      </div>
    </div>
  );

  // ── Delete Confirmation Modal ─────────────────────────────────────────────────

  const renderDeleteModal = () => (
    deleteTarget && (
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this team? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="page-wrapper team-page-wrapper">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">TEAMS</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">
                    <IconHome size={16} />
                  </Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active">Teams</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-2" />
              Add Team
            </button>
          </div>
        </div>

        {/* ── Statistics Cards ── */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalTeams}</h3>
                <p className="text-muted small mb-0">Total Teams</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{activeTeams}</h3>
                <p className="text-muted small mb-0">Active Teams</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalMembers}</h3>
                <p className="text-muted small mb-0">Total Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Teams Table ── */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Teams List</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Team Lead</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">Loading...</td>
                  </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">No teams found</td>
                    </tr>
                  ) : (
                    rows.map((team) => {
                      const dept = departments.find(d => d.id === team.departmentId);
                      const leadToken = splitTeamLeadToken(getTeamLeadValue(team));
                      const matchedTrainer =
                        trainers.find((trainer) => String(trainer.id) === leadToken.id) ||
                        trainers.find((trainer) => {
                          const label = getTrainerDisplayLabel(trainer);
                          return label.trim() === leadToken.name;
                        }) ||
                        null;
                      const leadLabel =
                        getTrainerDisplayLabel(matchedTrainer) ||
                        leadToken.name ||
                        "-";
                      return (
                        <tr key={team.id}>
                          <td className="fw-semibold">{team.name}</td>
                          <td>{dept?.name || "-"}</td>
                          <td>{leadLabel}</td>
                          <td>
                            <span className="badge bg-primary">{team.memberCount}</span>
                          </td>
                          <td>
                            <span className={`badge ${team.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>
                              {team.status === "ACTIVE" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(team)}>
                              <IconEdit size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(team.id)}>
                              <IconTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Add / Edit Team Modal using WizardPopup ─────────────────────────── */}
        <WizardPopup
          open={showModal}
          title={isEdit ? "Edit Team" : "Add Team"}
          steps={TEAM_STEPS.map((item) => item.label)}
          step={modalStepIndex}
          onClose={closeModal}
          onBack={goToPreviousModalStep}
          onNext={goToNextModalStep}
          onSubmit={handleSubmit}
          submitLabel={saving ? "Saving..." : "Save Changes"}
          modalWidth="580px"
          disabled={saving}
        >
          {modalError && <div className="alert alert-danger">{modalError}</div>}

          {modalTab === "basic" && renderBasicInfoFields()}
          {modalTab === "description" && renderDescriptionFields()}
        </WizardPopup>

        {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
        {renderDeleteModal()}
        {deleteTarget && <div className="modal-backdrop fade show" />}
      </div>
    </div>
  );
}
