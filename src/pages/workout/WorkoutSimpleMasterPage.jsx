import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { IconHome, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import CommonTable from "../../components/CommonTable";

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "ACTIVE",
};

const STEP_FIELDS = [
  { key: "basic", label: "Basic Info" },
];

export default function WorkoutSimpleMasterPage({
  pageKey,
  title,
  label,
  loadFn,
  createFn,
  updateFn,
  deleteFn,
  normalizeFn = (item) => item,
  canCreateAction = "create",
  canEditAction = "edit",
  canDeleteAction = "delete",
}) {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
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

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission(pageKey, canCreateAction);
  const canEdit = hasPermission(pageKey, canEditAction);
  const canDelete = hasPermission(pageKey, canDeleteAction);

  const pageRows = useMemo(() => rows.map(normalizeFn), [rows, normalizeFn]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadFn();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, `Failed to load ${label.toLowerCase()}s`));
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

  if (!hasPermission(pageKey)) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage {title}.</div>
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
    setForm({
      name: row?.name || "",
      description: row?.description || "",
      status: String(row?.status || "ACTIVE").toUpperCase(),
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

  const validateForm = () => {
    const errors = {};
    if (!form.name?.trim()) errors.name = `${label} name is required`;
    return errors;
  };

  const modalStepIndex = useMemo(() => {
    const idx = STEP_FIELDS.findIndex((step) => step.key === modalTab);
    return idx >= 0 ? idx : 0;
  }, [modalTab]);

  const goToNextStep = () => {
    setModalError("");
    if (modalTab === "basic" && !form.name?.trim()) {
      setFieldErrors({ name: `${label} name is required` });
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
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setModalTab("basic");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || "",
        status: form.status,
      };

      if (isEdit) {
        await updateFn(selectedId, payload);
        setNotice(`${label} updated successfully`);
      } else {
        await createFn(payload);
        setNotice(`${label} created successfully`);
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
      await deleteFn(deleteTarget.id);
      setNotice(`${label} deleted successfully`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">{title}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/"><IconHome size={16} /></Link>
                </li>
                <li className="breadcrumb-item active">{title}</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" />
              Add {label}
            </button>
          )}
        </div>

        <CommonTable
          columns={[
            { key: "name", label: "NAME", sortable: true },
            { key: "description", label: "DESCRIPTION", sortable: true },
            { key: "status", label: "STATUS", sortable: true },
            {
              key: "updatedAt",
              label: "UPDATED",
              sortable: true,
              render: (val) => (val ? new Date(val).toLocaleString() : "-"),
            },
          ]}
          data={pageRows}
          entityName={label.toLowerCase()}
          loading={loading}
          onEdit={openEdit}
          onDelete={confirmDelete}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              try { await deleteFn(id); } catch (e) {}
            }
            setNotice(`${ids.length} ${label.toLowerCase()}s deleted successfully`);
            await loadData();
          }}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      <WizardPopup
        open={showModal}
        title={isEdit ? `Edit ${label}` : `Add ${label}`}
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
            <div className="col-12">
              <label className="form-label">Name *</label>
              <input
                className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  clearFieldError("name");
                }}
              />
              {fieldErrors.name && <div className="avm-field-error">{fieldErrors.name}</div>}
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="row g-3 mt-1">
          <div className="col-12">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </WizardPopup>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{deleteTarget?.name || "this item"}</strong>?
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
