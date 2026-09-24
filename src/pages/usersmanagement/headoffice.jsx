import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { IconHome, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { getAllHeadOffices, createHeadOffice, updateHeadOffice, deleteHeadOffice } from "../../api/orgHierarchyApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import PhoneField from "../../components/PhoneField";
import CommonTable from "../../components/CommonTable";
import { ensureCountryCodeValue, sanitizePhoneDigits, splitPhoneWithCountryCode, validatePhoneNumber } from "../../utils/phoneUtils";

const EMPTY_FORM = {
  name: "",
  location: "",
  address: "",
  phone: "",
  countryCode: "+91",
  email: "",
  status: "ACTIVE",
};

const HEAD_OFFICE_STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "contact", label: "Contact Details" },
];

export default function HeadOfficePage() {
  const { user: currentUser, hasPermission } = useAuth();
  const currentRole = String(currentUser?.role || "").toUpperCase();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
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
    const index = HEAD_OFFICE_STEPS.findIndex((item) => item.key === modalTab);
    return index >= 0 ? index : 0;
  }, [modalTab]);

  const modalStepCount = HEAD_OFFICE_STEPS.length;
  const isLastModalStep = modalStepIndex === modalStepCount - 1;

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllHeadOffices();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(extractApiErrorMessage(e, "Failed to load head offices"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  // ── Authorization Check ───────────────────────────────────────────────────────

  if (!hasPermission("headoffice")) {
    return (
      <div className="content">
        <div className="alert alert-danger">
          ⛔ You do not have permission to manage Head Offices
        </div>
      </div>
    );
  }

  // ── Modal open/close ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setModalError("");
    setFieldErrors({});
    setModalTab("basic");
    setShowModal(true);
  };

  const openEdit = (office) => {
    const parsedPhone = splitPhoneWithCountryCode(office?.phone, office?.countryCode);

    setForm({
      name: office?.name || "",
      location: office?.location || "",
      address: office?.address || "",
      phone: parsedPhone.phone,
      countryCode: parsedPhone.countryCode,
      email: office?.email || "",
      status: String(office?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(office?.id);
    setIsEdit(true);
    setModalError("");
    setFieldErrors({});
    setModalTab(parsedPhone.phone || office?.email ? "contact" : "basic");
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
    // Validate basic info before going to next step
    if (modalTab === "basic" && !form.name?.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: "Head office name is required" }));
      return;
    }
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(HEAD_OFFICE_STEPS[modalStepIndex + 1].key);
    }
  };

  const goToPreviousModalStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(HEAD_OFFICE_STEPS[modalStepIndex - 1].key);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────────

  const validateForm = () => {
    const errors = {};
    if (!form.name?.trim()) {
      errors.name = "Head office name is required";
    }

    if (form.phone) {
      const phoneValidation = validatePhoneNumber(form.phone, form.countryCode);
      if (phoneValidation) errors.phone = phoneValidation;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    return errors;
  };

  const handleSubmit = async () => {
    setModalError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        setModalTab("basic");
      } else if (errors.phone || errors.email) {
        setModalTab("contact");
      }
      return;
    }

    // Format phone with country code
    let formattedPhone = "";
    if (form.phone) {
      const normalizedCode = ensureCountryCodeValue(form.countryCode);
      const digits = sanitizePhoneDigits(form.phone);
      formattedPhone = digits ? `${normalizedCode}${digits}` : "";
    }

    const payload = {
      name: form.name.trim(),
      location: form.location?.trim() || null,
      address: form.address?.trim() || null,
      phone: formattedPhone || null,
      email: form.email?.trim() || null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateHeadOffice(selectedId, payload);
        setNotice("Head office updated successfully");
      } else {
        await createHeadOffice(payload);
        setNotice("Head office added successfully");
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
      await deleteHeadOffice(deleteTarget);
      setNotice("Head office deleted successfully");
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to delete head office"));
    } finally {
      setSaving(false);
    }
  };

  // ── Statistics ─────────────────────────────────────────────────────────────────

  const totalHeadOffices = rows.length;
  const activeHeadOffices = rows.filter(h => String(h?.status || "").toUpperCase() === "ACTIVE").length;

  // ── Form Renderers ────────────────────────────────────────────────────────────

  const renderBasicInfoFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Basic Information</p>
      </div>

      <div className="col-md-12">
        <label className="form-label">Head Office Name *</label>
        <input
          className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            clearFieldError("name");
          }}
          placeholder="Enter head office name"
        />
        {fieldErrors.name && <div className="avm-field-error">{fieldErrors.name}</div>}
      </div>

      <div className="col-md-12">
        <label className="form-label">Location</label>
        <input
          className="form-control"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Bangalore, Mumbai, Delhi"
        />
      </div>

      <div className="col-md-12">
        <label className="form-label">Address</label>
        <textarea
          className="form-control"
          rows={3}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Full address of the head office"
        />
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

  const renderContactFields = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Contact Details</p>
      </div>

      <div className="col-md-12">
        <PhoneField
          id="headOfficePhone"
          label="Phone Number"
          countryCode={form.countryCode}
          value={form.phone}
          onChange={({ countryCode, phone }) => {
            setForm({ ...form, countryCode, phone });
            clearFieldError("phone");
          }}
          className={fieldErrors.phone ? "is-invalid" : ""}
        />
        {fieldErrors.phone && <div className="avm-field-error">{fieldErrors.phone}</div>}
      </div>

      <div className="col-md-12">
        <label className="form-label">Email Address</label>
        <input
          type="email"
          className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            clearFieldError("email");
          }}
          placeholder="office@example.com"
        />
        {fieldErrors.email && <div className="avm-field-error">{fieldErrors.email}</div>}
        <small className="text-muted d-block mt-1">
          Used for official communication
        </small>
      </div>
    </div>
  );

  // ── Delete Confirmation Modal (using react-bootstrap style) ───────────────────

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
              <p>Are you sure you want to delete this head office? This action cannot be undone.</p>
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
    <div className="page-wrapper head-office-page-wrapper">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">HEAD OFFICES</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">
                    <IconHome size={16} />
                  </Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active">Head Offices</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-2" />
              Add Head Office
            </button>
          </div>
        </div>

        {/* ── Statistics Cards ── */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalHeadOffices}</h3>
                <p className="text-muted small mb-0">Total Head Offices</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{activeHeadOffices}</h3>
                <p className="text-muted small mb-0">Active Head Offices</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Head Offices Table with CommonTable ── */}
        <CommonTable
          columns={[
            { key: "name", label: "NAME", sortable: true },
            { key: "location", label: "LOCATION", sortable: true },
            { key: "phone", label: "CONTACT", sortable: true },
            { key: "email", label: "EMAIL", sortable: true },
            { key: "status", label: "STATUS", sortable: true },
          ]}
          data={rows}
          entityName="head office"
          searchPlaceholder="Search head office..."
          loading={loading}
          onEdit={openEdit}
          onDelete={(office) => confirmDelete(office.id)}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              try { await deleteHeadOffice(id); } catch (e) {}
            }
            setNotice(`${ids.length} head offices deleted successfully`);
            await loadData();
          }}
          canEdit={true}
          canDelete={true}
        />

        {/* ── Add / Edit Head Office Modal using WizardPopup ─────────────────────── */}
        <WizardPopup
          open={showModal}
          title={isEdit ? "Edit Head Office" : "Add Head Office"}
          steps={HEAD_OFFICE_STEPS.map((item) => item.label)}
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
          {modalTab === "contact" && renderContactFields()}
        </WizardPopup>

        {/* ── Delete Confirmation Modal ───────────────────────────────────────────── */}
        {renderDeleteModal()}
        {deleteTarget && <div className="modal-backdrop fade show" />}
      </div>
    </div>
  );
}
