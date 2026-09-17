import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import { IconHome, IconEdit, IconTrash, IconPlus, IconInfinity, IconClock } from "@tabler/icons-react";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from "../../api/membershipPlansApi";

const PAGE_KEY = "membership-plans";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  price: 0,
  durationDays: 30,
  maxSessionMinutes: 60,
  unlimitedAccess: false,
  trainerChat: false,
  features: "",
  active: true,
};

export default function MembershipPlans() {
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission(PAGE_KEY, "create");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const canDelete = hasPermission(PAGE_KEY, "delete");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getMembershipPlans());
    } catch (err) {
      setRows([]);
      setError(extractApiErrorMessage(err, "Failed to load membership plans"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setSelectedId(null);
    setModalError("");
    setShowModal(true);
  };

  const openEdit = (row) => {
    setForm({
      code: row.code || "",
      name: row.name || "",
      description: row.description || "",
      price: row.price ?? 0,
      durationDays: row.durationDays ?? 30,
      maxSessionMinutes: row.maxSessionMinutes ?? 0,
      unlimitedAccess: Boolean(row.unlimitedAccess),
      trainerChat: Boolean(row.trainerChat),
      features: Array.isArray(row.features) ? row.features.join("\n") : (row.features || ""),
      active: row.active !== false,
    });
    setSelectedId(row.id);
    setIsEdit(true);
    setModalError("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setModalError("");
    if (!form.code?.trim()) return setModalError("Plan code is required");
    if (!form.name?.trim()) return setModalError("Plan name is required");

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description?.trim() || "",
        price: Number(form.price) || 0,
        durationDays: Number(form.durationDays) || 0,
        maxSessionMinutes: Number(form.maxSessionMinutes) || 0,
        unlimitedAccess: Boolean(form.unlimitedAccess),
        trainerChat: Boolean(form.trainerChat),
        features: form.features || "",
        active: Boolean(form.active),
      };
      if (isEdit) {
        await updateMembershipPlan(selectedId, payload);
        setNotice("Membership plan updated");
      } else {
        await createMembershipPlan(payload);
        setNotice("Membership plan created");
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
      await deleteMembershipPlan(deleteTarget.id);
      setNotice("Membership plan deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    [rows],
  );

  if (!hasPermission(PAGE_KEY)) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage membership plans.</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">Membership Plans</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">Membership Plans</li>
              </ol>
            </nav>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={16} className="me-1" /> Add Plan
            </button>
          )}
        </div>

        <p className="text-muted">
          Plans decide membership length and gym access. <strong>Unlimited</strong> plans let members
          check in any time; time-restricted plans only allow check-in during the daily window staff
          assign to each member (on the Attendance page).
        </p>

        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Code</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Access</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-4">No membership plans yet.</td></tr>
                    ) : (
                      sortedRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="fw-semibold">{row.name}</div>
                            {row.description && <small className="text-muted">{row.description}</small>}
                          </td>
                          <td><span className="badge bg-light text-dark">{row.code}</span></td>
                          <td>{row.price > 0 ? `₹${row.price}` : "Free"}</td>
                          <td>
                            {row.durationDays > 0 ? `${row.durationDays} days` : "Lifetime"}
                            <div className="small text-muted">
                              {row.unlimitedAccess || !row.maxSessionMinutes ? "No visit limit" : `${row.maxSessionMinutes} min/visit`}
                            </div>
                          </td>
                          <td>
                            {row.unlimitedAccess ? (
                              <span className="badge bg-success d-inline-flex align-items-center gap-1">
                                <IconInfinity size={14} /> Unlimited
                              </span>
                            ) : (
                              <span className="badge bg-info d-inline-flex align-items-center gap-1">
                                <IconClock size={14} /> Time-restricted
                              </span>
                            )}
                            {row.trainerChat && (
                              <span className="badge bg-light-primary text-primary ms-1">Trainer chat</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${row.active ? "bg-success" : "bg-secondary"}`}>
                              {row.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            {canEdit && (
                              <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(row)}>
                                <IconEdit size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(row)}>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? "Edit Plan" : "Add Plan"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <div className="alert alert-danger">{modalError}</div>}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Code</label>
              <Form.Control
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="e.g. PREMIUM"
                disabled={isEdit}
              />
              {isEdit && <small className="text-muted">Code is fixed after creation. Edit the Name to change the label.</small>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <Form.Control value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Premium" />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Price (₹)</label>
              <Form.Control type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Duration (days)</label>
              <Form.Control type="number" min={0} value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} />
              <small className="text-muted">0 = lifetime (no expiry)</small>
            </div>
            <div className="col-md-6">
              <label className="form-label">Time per visit (minutes)</label>
              <Form.Control
                type="number"
                min={0}
                value={form.maxSessionMinutes}
                onChange={(e) => setField("maxSessionMinutes", e.target.value)}
                disabled={form.unlimitedAccess}
              />
              <small className="text-muted">0 = no limit. After this, admin & member are notified to extend/upgrade.</small>
            </div>
            <div className="col-md-6">
              <Form.Check
                type="switch"
                id="unlimited-switch"
                label="Unlimited access (any time)"
                checked={form.unlimitedAccess}
                onChange={(e) => setField("unlimitedAccess", e.target.checked)}
              />
              <small className="text-muted">Off = member restricted to their assigned daily window</small>
            </div>
            <div className="col-md-6">
              <Form.Check
                type="switch"
                id="trainer-chat-switch"
                label="Wellness chat with personal trainers"
                checked={form.trainerChat}
                onChange={(e) => setField("trainerChat", e.target.checked)}
              />
            </div>
            <div className="col-md-6">
              <Form.Check
                type="switch"
                id="active-switch"
                label="Active"
                checked={form.active}
                onChange={(e) => setField("active", e.target.checked)}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Features <small className="text-muted">(one per line, shown on the plan card)</small></label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.features}
                onChange={(e) => setField("features", e.target.value)}
                placeholder={"Everything in Basic\nPersonalised workout & diet plans\nDetailed progress analytics"}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)} type="button">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving} type="button">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete the <strong>{deleteTarget?.name || "this"}</strong> plan? Members already on it keep their
          settings, but it can no longer be assigned.
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
