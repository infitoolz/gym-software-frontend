import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { IconHome, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {
  getAllDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getAllDepartments,
} from "../../api/orgHierarchyApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";

const EMPTY_FORM = {
  name: "",
  departmentId: "",
  description: "",
  salary: 0,
  status: "ACTIVE",
};

const DESIGNATION_STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "compensation", label: "Compensation" },
  { key: "details", label: "Details" },
];

export default function DesignationPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const currentRole = String(currentUser?.role || "").toUpperCase();

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
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
    const index = DESIGNATION_STEPS.findIndex((item) => item.key === modalTab);
    return index >= 0 ? index : 0;
  }, [modalTab]);

  const modalStepCount = DESIGNATION_STEPS.length;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllDesignations();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(extractApiErrorMessage(e, "Failed to load designations"));
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    setDeptLoading(true);
    try {
      const data = await getAllDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  if (!hasPermission("designations")) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage Designations</div>
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

  const openEdit = (desig) => {
    setForm({
      name: desig?.name || "",
      departmentId: String(desig?.departmentId || ""),
      description: desig?.description || "",
      salary: desig?.salary || 0,
      status: String(desig?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(desig?.id);
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
        setModalError("Designation name is required");
        return;
      }
      if (!form.departmentId) {
        setModalError("Department is required");
        return;
      }
    }
    
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(DESIGNATION_STEPS[modalStepIndex + 1].key);
    }
  };

  const goToPreviousModalStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(DESIGNATION_STEPS[modalStepIndex - 1].key);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────────

  const validateForm = () => {
    if (!form.name?.trim()) {
      return "Designation name is required";
    }
    if (!form.departmentId) {
      return "Department is required";
    }
    if (form.salary < 0) {
      return "Salary cannot be negative";
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
      salary: Number(form.salary) || 0,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateDesignation(selectedId, payload);
        setNotice("Designation updated successfully");
      } else {
        await createDesignation(payload);
        setNotice("Designation added successfully");
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
      await deleteDesignation(deleteTarget);
      setNotice("Designation deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to delete designation"));
    } finally {
      setSaving(false);
    }
  };

  // ── Statistics ─────────────────────────────────────────────────────────────────

  const totalDesignations = rows.length;
  const activeDesignations = rows.filter((d) => String(d?.status || "").toUpperCase() === "ACTIVE").length;

  // ── Form Renderers ────────────────────────────────────────────────────────────

  const renderBasicInfoFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Designation Information</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Designation Name *</label>
        <input
          className="form-control"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Senior Software Engineer"
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
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
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

  const renderCompensationFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Compensation Details</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Salary (₹ per annum)</label>
        <input
          type="number"
          className="form-control"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          min="0"
          step="1000"
          placeholder="0"
        />
        <small className="text-muted d-block mt-1">
          Enter the annual salary for this designation
        </small>
      </div>
    </div>
  );

  const renderDetailsFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Additional Details</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the role, responsibilities, and requirements for this designation"
        />
        <small className="text-muted d-block mt-1">
          Optional: Add details about this designation
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
              <p>Are you sure you want to delete this designation? This action cannot be undone.</p>
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
    <div className="page-wrapper designation-page-wrapper">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">DESIGNATIONS</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">
                    <IconHome size={16} />
                  </Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active">Designations</li>
              </ol>
            </nav>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={16} className="me-2" />
            Add Designation
          </button>
        </div>

        {/* ── Statistics Cards ── */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalDesignations}</h3>
                <p className="text-muted small mb-0">Total Designations</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{activeDesignations}</h3>
                <p className="text-muted small mb-0">Active Designations</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Designations Table ── */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Designations List</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th>Salary</th>
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
                      <td colSpan={6} className="text-center py-4">No designations found</td>
                    </tr>
                  ) : (
                    rows.map((desig) => {
                      const dept = departments.find((d) => d.id === desig.departmentId);
                      return (
                        <tr key={desig.id}>
                          <td className="fw-semibold">{desig.name}</td>
                          <td>{dept?.name || "-"}</td>
                          <td>
                            <span className="badge bg-info">{desig.level}</span>
                          </td>
                          <td>₹ {Number(desig.salary || 0).toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`badge ${desig.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>
                              {desig.status === "ACTIVE" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(desig)}>
                              <IconEdit size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(desig.id)}>
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

        {/* ── Add / Edit Designation Modal using WizardPopup ─────────────────────── */}
        <WizardPopup
          open={showModal}
          title={isEdit ? "Edit Designation" : "Add Designation"}
          steps={DESIGNATION_STEPS.map((item) => item.label)}
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
          {modalTab === "compensation" && renderCompensationFields()}
          {modalTab === "details" && renderDetailsFields()}
        </WizardPopup>

        {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
        {renderDeleteModal()}
        {deleteTarget && <div className="modal-backdrop fade show" />}
      </div>
    </div>
  );
}
