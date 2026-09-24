import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { IconHome, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import {
  getAllDepartments,
  getDepartmentsByBranch,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllBranches,
} from "../../api/orgHierarchyApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import CommonTable from "../../components/CommonTable";

const EMPTY_FORM = {
  name: "",
  branchId: "",
  description: "",
  status: "ACTIVE",
};

const DEPARTMENT_STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "details", label: "Details" },
];

export default function DepartmentPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const currentRole = String(currentUser?.role || "").toUpperCase();

  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brLoading, setBrLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalError, setModalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalTab, setModalTab] = useState("basic");

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const modalStepIndex = useMemo(() => {
    const index = DEPARTMENT_STEPS.findIndex((item) => item.key === modalTab);
    return index >= 0 ? index : 0;
  }, [modalTab]);

  const modalStepCount = DEPARTMENT_STEPS.length;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (currentRole === "SUPER_ADMIN") data = await getAllDepartments();
      else if (currentRole === "ADMIN") data = await getDepartmentsByBranch(currentUser?.branchId);
      else data = [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(extractApiErrorMessage(e, "Failed to load departments"));
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    setBrLoading(true);
    try {
      const data = await getAllBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setBrLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadBranches();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  if (!hasPermission("departments")) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage Departments</div>
      </div>
    );
  }

  // ── Modal open/close ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, branchId: currentRole === "ADMIN" ? String(currentUser?.branchId) : "" });
    setIsEdit(false);
    setModalError("");
    setFieldErrors({});
    setModalTab("basic");
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setForm({
      name: dept?.name || "",
      branchId: String(dept?.branchId || ""),
      description: dept?.description || "",
      status: String(dept?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(dept?.id);
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

  const goToNextModalStep = () => {
    setModalError("");
    
    // Validate current step before proceeding
    if (modalTab === "basic") {
      const errs = {};
      if (!form.name?.trim()) {
        errs.name = "Department name is required";
      }
      if (!form.branchId) {
        errs.branchId = "Branch is required";
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        return;
      }
    }
    
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(DEPARTMENT_STEPS[modalStepIndex + 1].key);
    }
  };

  const goToPreviousModalStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(DEPARTMENT_STEPS[modalStepIndex - 1].key);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────────

  const validateForm = () => {
    const errors = {};
    if (!form.name?.trim()) {
      errors.name = "Department name is required";
    }
    if (!form.branchId) {
      errors.branchId = "Branch is required";
    }
    return errors;
  };

  const handleSubmit = async () => {
    setModalError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setModalTab("basic");
      return;
    }

    const payload = {
      name: form.name.trim(),
      branchId: Number(form.branchId),
      description: form.description?.trim() || null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateDepartment(selectedId, payload);
        setNotice("Department updated successfully");
      } else {
        await createDepartment(payload);
        setNotice("Department added successfully");
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
      await deleteDepartment(deleteTarget);
      setNotice("Department deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to delete department"));
    } finally {
      setSaving(false);
    }
  };

  // ── Statistics ─────────────────────────────────────────────────────────────────

  const totalDepartments = rows.length;
  const activeDepartments = rows.filter((d) => String(d?.status || "").toUpperCase() === "ACTIVE").length;

  // ── Form Renderers ────────────────────────────────────────────────────────────

  const renderBasicInfoFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Department Information</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Department Name *</label>
        <input
          className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            clearFieldError("name");
          }}
          placeholder="Enter department name"
        />
        {fieldErrors.name && <div className="avm-field-error">{fieldErrors.name}</div>}
      </div>

      <div className="col-md-12">
        <label className="form-label">Branch *</label>
        <select
          className={`form-select ${fieldErrors.branchId ? "is-invalid" : ""}`}
          value={form.branchId}
          onChange={(e) => {
            setForm({ ...form, branchId: e.target.value });
            clearFieldError("branchId");
          }}
          disabled={currentRole === "ADMIN" || brLoading}
        >
          <option value="">Select Branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {fieldErrors.branchId && <div className="avm-field-error">{fieldErrors.branchId}</div>}
        {currentRole === "ADMIN" && (
          <small className="text-muted d-block mt-1">
            Branch is locked to your assigned branch
          </small>
        )}
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

  const renderDetailsFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Department Details</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the department's purpose and responsibilities"
        />
        <small className="text-muted d-block mt-1">
          Optional: Add details about this department
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
              <p>Are you sure you want to delete this department? This action cannot be undone.</p>
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
    <div className="page-wrapper department-page-wrapper">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">DEPARTMENTS</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/"><IconHome size={16} /></Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active">Departments</li>
              </ol>
            </nav>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={16} className="me-2" />Add Department
          </button>
        </div>

        {/* ── Statistics Cards ── */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalDepartments}</h3>
                <p className="text-muted small mb-0">Total Departments</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{activeDepartments}</h3>
                <p className="text-muted small mb-0">Active Departments</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Departments Table with CommonTable ── */}
        <CommonTable
          columns={[
            { key: "name", label: "NAME", sortable: true },
            {
              key: "branchId",
              label: "BRANCH",
              sortable: true,
              render: (val, row) => {
                const b = branches.find((item) => item.id === row.branchId);
                return b?.name || "-";
              },
            },
            { key: "description", label: "DESCRIPTION", sortable: true },
            { key: "status", label: "STATUS", sortable: true },
          ]}
          data={rows}
          entityName="department"
          searchPlaceholder="Search department..."
          loading={loading}
          onEdit={openEdit}
          onDelete={(d) => confirmDelete(d.id)}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              try { await deleteDepartment(id); } catch (e) {}
            }
            setNotice(`${ids.length} departments deleted successfully`);
            await loadData();
          }}
          canEdit={true}
          canDelete={true}
        />

        {/* ── Add / Edit Department Modal using WizardPopup ─────────────────────── */}
        <WizardPopup
          open={showModal}
          title={isEdit ? "Edit Department" : "Add Department"}
          steps={DEPARTMENT_STEPS.map((item) => item.label)}
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
          {modalTab === "details" && renderDetailsFields()}
        </WizardPopup>

        {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
        {renderDeleteModal()}
        {deleteTarget && <div className="modal-backdrop fade show" />}
      </div>
    </div>
  );
}
