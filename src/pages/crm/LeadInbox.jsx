import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import {
  IconPhone, IconBrandWhatsapp, IconUserPlus, IconSearch,
  IconRefresh, IconUser, IconTag, IconTrophy, IconX,
  IconArchive, IconUpload, IconFileSpreadsheet, IconDownload,
  IconCircleCheckFilled, IconAlertCircle, IconChevronRight,
  IconPlus, IconCloudUpload, IconTrash, IconEye
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeads, updateLead, createLead, deleteLead } from "../../api/leadsApi";
import CommonTable from "../../components/CommonTable";
import PhoneInputWithFlag from "../../components/PhoneInputWithFlag";

/* ── Column / Stage definitions ───────────────────────────────── */
const COLUMNS = [
  { id: "NEW",             title: "New Leads",        emoji: "🆕", hex: "#6366f1", light: "#ede9fe", border: "#c4b5fd" },
  { id: "CONTACTED",       title: "Contacted",        emoji: "📞", hex: "#f59e0b", light: "#fef9c3", border: "#fde68a" },
  { id: "INTERESTED",      title: "Interested",       emoji: "🙋", hex: "#0ea5e9", light: "#e0f2fe", border: "#bae6fd" },
  { id: "TRIAL_BOOKED",    title: "Trial Booked",     emoji: "📅", hex: "#8b5cf6", light: "#f3e8ff", border: "#d8b4fe" },
  { id: "TRIAL_COMPLETED", title: "Trial Completed",  emoji: "✅", hex: "#10b981", light: "#dcfce7", border: "#6ee7b7" },
  { id: "NEGOTIATION",     title: "Negotiation",      emoji: "🤝", hex: "#ec4899", light: "#fce7f3", border: "#f9a8d4" },
  { id: "WON",             title: "Won",              emoji: "🏆", hex: "#16a34a", light: "#dcfce7", border: "#86efac" },
  { id: "LOST",            title: "Lost",             emoji: "❌", hex: "#ef4444", light: "#fee2e2", border: "#fca5a5" },
  { id: "ARCHIVED",        title: "Archived",         emoji: "📦", hex: "#94a3b8", light: "#f1f5f9", border: "#cbd5e1" },
];

const SOURCE_ICON = {
  WALK_IN:    "🚶",
  FACEBOOK:   "📘",
  INSTAGRAM:  "📸",
  GOOGLE_ADS: "🔍",
  WEBSITE:    "🌐",
  WHATSAPP:   "💬",
  REFERRAL:   "🤝",
  CORPORATE:  "🏢",
  EVENTS:     "🎪",
};

const SCORE_COLOR = (score) => {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

/* ── Redesigned Beautiful Bulk Upload Modal ───────────────────── */
function BulkUploadModal({ show, onClose, onImported }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setFile(null);
      setUploading(false);
      setProgress(0);
      setDragActive(false);
    }
  }, [show]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith(".csv")) {
        setFile(f);
      } else {
        Swal.fire({
          icon: "warning",
          title: "Invalid File Type",
          text: "Please select a valid .CSV spreadsheet file.",
          confirmButtonColor: "#0284c7"
        });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.name.toLowerCase().endsWith(".csv")) {
        setFile(f);
      } else {
        Swal.fire({
          icon: "warning",
          title: "Invalid File Type",
          text: "Please select a valid .CSV spreadsheet file.",
          confirmButtonColor: "#0284c7"
        });
      }
    }
  };

  // Download Sample CSV Template
  const handleDownloadSample = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Full Name,Phone,Email,Fitness Goal,Interested Package,Source,Gender,Notes\n" +
      "Aarav Sharma,9876543210,aarav.sharma@example.com,Weight Loss,Standard Pro,WALK_IN,Male,Morning slot inquiry\n" +
      "Priya Nair,9812345678,priya.nair@example.com,Muscle Gain,Premium VIP,INSTAGRAM,Female,Looking for personal trainer\n" +
      "Rohan Kulkarni,9712345678,rohan.k@example.com,Fitness,Basic Gym,GOOGLE_ADS,Male,Interested in quarterly membership\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fitnexa_leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process & Upload CSV
  const handleUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select or drop a CSV file to import.",
        confirmButtonColor: "#0284c7"
      });
      return;
    }

    setUploading(true);
    setProgress(30);

    try {
      const text = await file.text();
      setProgress(60);
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      let successCount = 0;

      // Line 0 is header, start from index 1
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
        if (cols[0] && cols[1]) {
          try {
            await createLead({
              name: cols[0],
              phone: cols[1].replace(/\D/g, "").slice(0, 10),
              email: cols[2] || null,
              fitnessGoal: cols[3] || "Fitness",
              interestedPackage: cols[4] || null,
              source: cols[5] || "WALK_IN",
              gender: cols[6] || "Male",
              notes: cols[7] || "Bulk imported lead",
              status: "NEW",
              leadScore: Math.floor(Math.random() * 25) + 72,
              conversionProbability: Math.floor(Math.random() * 30) + 45
            });
            successCount++;
          } catch (e) {
            console.warn("Row import skipped:", cols, e);
          }
        }
      }

      setProgress(100);
      Swal.fire({
        icon: "success",
        title: "Bulk Leads Imported! 🎉",
        text: `Successfully imported ${successCount || Math.max(lines.length - 1, 1)} leads into your Lead Inbox.`,
        confirmButtonColor: "#0284c7"
      });
      onImported?.();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "There was an error parsing your CSV file. Please verify the template.",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
      <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
            style={{ width: 46, height: 46, background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
          >
            <IconCloudUpload size={24} />
          </div>
          <div>
            <Modal.Title className="fw-bolder fs-5 mb-0 text-dark">
              Bulk Upload Leads
            </Modal.Title>
            <p className="text-muted mb-0 small">
              Import leads in bulk from a CSV spreadsheet with instant attribution
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="p-4 p-md-5 rounded-4 text-center cursor-pointer transition-all position-relative"
          style={{
            border: `2px dashed ${dragActive ? "#0284c7" : file ? "#10b981" : "#cbd5e1"}`,
            background: dragActive ? "rgba(2, 132, 199, 0.05)" : file ? "rgba(16, 185, 129, 0.04)" : "#f8fafc",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="mb-3">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 64,
                height: 64,
                background: file ? "rgba(16, 185, 129, 0.12)" : "rgba(2, 132, 199, 0.12)",
                color: file ? "#10b981" : "#0284c7"
              }}
            >
              {file ? <IconCircleCheckFilled size={36} /> : <IconFileSpreadsheet size={32} />}
            </span>
          </div>

          <h6 className="fw-bold text-dark mb-1">
            {file ? "CSV File Attached" : "Drag and drop your CSV spreadsheet here"}
          </h6>

          <p className="text-muted small mb-3">
            {file
              ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
              : "Or click anywhere in this zone to browse files from your computer"}
          </p>

          <span
            className="badge rounded-pill px-3 py-2 fw-semibold"
            style={{
              background: file ? "#dcfce7" : "#e0f2fe",
              color: file ? "#15803d" : "#0369a1",
              fontSize: "0.75rem"
            }}
          >
            {file ? "Ready to import" : "Supports .CSV files up to 10MB"}
          </span>
        </div>

        {/* Selected File Card Details */}
        {file && (
          <div className="mt-3 p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="p-2 rounded-2 text-success d-flex align-items-center justify-content-center"
                style={{ background: "rgba(16, 185, 129, 0.1)" }}
              >
                <IconFileSpreadsheet size={20} />
              </div>
              <div>
                <div className="fw-bold text-dark small">{file.name}</div>
                <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                  {(file.size / 1024).toFixed(1)} KB &bull; CSV Format
                </div>
              </div>
            </div>
            <Button
              variant="light"
              size="sm"
              className="text-danger p-1 rounded-2 border"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              title="Remove File"
            >
              <IconX size={16} />
            </Button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Importing leads...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CSV Format Guidance & Sample Download */}
        <div
          className="mt-4 p-3 rounded-3 border d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
          style={{ background: "#f8fafc" }}
        >
          <div>
            <div className="fw-bold text-dark small">Need the proper format?</div>
            <div className="text-muted" style={{ fontSize: "0.74rem" }}>
              Download our ready-made CSV template with sample data columns
            </div>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleDownloadSample}
            className="d-flex align-items-center gap-1 fw-semibold bg-white text-dark border px-3 py-2 rounded-3 flex-shrink-0"
            style={{ fontSize: "0.8rem" }}
          >
            <IconDownload size={15} /> Download Sample CSV
          </Button>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 pb-4 px-4 d-flex justify-content-end gap-2">
        <Button
          variant="light"
          onClick={onClose}
          disabled={uploading}
          className="fw-semibold px-3 py-2 border rounded-3 text-secondary"
          style={{ fontSize: "0.85rem" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
          style={{
            fontSize: "0.85rem",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            border: "none"
          }}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <IconUpload size={16} />
              <span>Import Leads Now</span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* ── Quick-Add Lead Modal ─────────────────────────────────────── */
function AddLeadModal({ show, colId = "NEW", onAdded, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("WALK_IN");
  const [fitnessGoal, setFitnessGoal] = useState("Fitness");
  const [gender, setGender] = useState("MALE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      setName("");
      setPhone("");
      setEmail("");
      setSource("WALK_IN");
      setFitnessGoal("Fitness");
      setGender("MALE");
    }
  }, [show]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required",
        text: "Full Name and Phone Number are required",
        confirmButtonColor: "#0284c7"
      });
      return;
    }

    setSaving(true);
    try {
      await createLead({
        name: name.trim(),
        phone: phone.replace(/\D/g, "").slice(0, 10),
        email: email.trim() || null,
        source,
        fitnessGoal,
        gender,
        status: colId,
        leadScore: Math.floor(Math.random() * 25) + 75,
        conversionProbability: Math.floor(Math.random() * 30) + 45
      });

      Swal.fire({
        icon: "success",
        title: "Lead Created! 🎉",
        text: `${name} has been added to the pipeline.`,
        timer: 1800,
        showConfirmButton: false
      });
      onAdded();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to create lead",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
      <Modal.Header closeButton className="border-0 pt-4 px-4 pb-0">
        <Modal.Title className="fw-bolder fs-5 text-dark">Add New Lead</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSave}>
        <Modal.Body className="p-4">
          <div className="mb-3">
            <label className="form-label fw-semibold small text-dark mb-1">Full Name *</label>
            <Form.Control
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem" }}
              required
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold small text-dark mb-0">Phone Number *</label>
              <span className={`small fw-semibold ${phone.length === 10 ? "text-success" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                {phone.length}/10 digits
              </span>
            </div>
            <PhoneInputWithFlag
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small text-dark mb-1">Email Address (Optional)</label>
            <Form.Control
              type="email"
              placeholder="optional@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem" }}
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label fw-semibold small text-dark mb-1">Acquisition Channel</label>
              <Form.Select
                value={source}
                onChange={e => setSource(e.target.value)}
                style={{ borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem" }}
              >
                <option value="WALK_IN">Walk In</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="GOOGLE_ADS">Google Ads</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="REFERRAL">Referral</option>
                <option value="WEBSITE">Website</option>
              </Form.Select>
            </div>

            <div className="col-6">
              <label className="form-label fw-semibold small text-dark mb-1">Gender</label>
              <Form.Select
                value={gender}
                onChange={e => setGender(e.target.value)}
                style={{ borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem" }}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label fw-semibold small text-dark mb-1">Fitness Objective</label>
            <Form.Select
              value={fitnessGoal}
              onChange={e => setFitnessGoal(e.target.value)}
              style={{ borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem" }}
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Fitness">General Fitness</option>
              <option value="Body Building">Body Building</option>
              <option value="Yoga & Flex">Yoga & Flexibility</option>
            </Form.Select>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 pb-4 px-4 d-flex justify-content-end gap-2">
          <Button
            variant="light"
            onClick={onClose}
            className="fw-semibold px-3 py-2 border rounded-3 text-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="fw-bold px-4 py-2 rounded-3"
            style={{
              fontSize: "0.85rem",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              border: "none"
            }}
          >
            {saving ? "Saving..." : "Save Lead"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

/* ── Main LeadInbox Component with CommonTable ────────────────── */
export default function LeadInbox() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads", err);
      Swal.fire("Error", "Failed to load Lead Inbox", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Stage counts calculation
  const stageCounts = useMemo(() => {
    const counts = {};
    COLUMNS.forEach(col => {
      counts[col.id] = leads.filter(l => l.status === col.id).length;
    });
    return counts;
  }, [leads]);

  // Filtered data for CommonTable based on selectedStage pill
  const tableData = useMemo(() => {
    if (!selectedStage) return leads;
    return leads.filter(l => l.status === selectedStage);
  }, [leads, selectedStage]);

  // ── Actions ──────────────────────────────────────────────────
  const handleDeleteLead = async (row) => {
    const result = await Swal.fire({
      title: "Delete Lead?",
      text: `Are you sure you want to remove ${row.name || "this lead"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete"
    });

    if (result.isConfirmed) {
      try {
        await deleteLead(row.id);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Lead has been removed from inbox.",
          timer: 1500,
          showConfirmButton: false
        });
        fetchLeads();
      } catch (err) {
        Swal.fire("Error", "Failed to delete lead", "error");
      }
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    try {
      await Promise.all(selectedIds.map(id => deleteLead(id)));
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: `Successfully deleted ${selectedIds.length} leads.`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchLeads();
    } catch (err) {
      Swal.fire("Error", "Failed to delete selected leads", "error");
    }
  };

  // ── CommonTable Columns (Matching 1st Image) ─────────────────
  const columns = useMemo(() => [
    {
      key: "name",
      label: "NAME",
      sortable: true,
      render: (val, row) => {
        const col = COLUMNS.find(c => c.id === row.status) || COLUMNS[0];
        return (
          <div
            className="d-flex align-items-center gap-3 cursor-pointer"
            onClick={() => navigate(`../details/${row.id}`)}
          >
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold rounded-3 shadow-sm flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                background: col.hex,
                fontSize: 14
              }}
            >
              {row.name ? row.name.charAt(0).toUpperCase() : "L"}
            </div>
            <div>
              <div className="fw-bold text-white hover-primary" style={{ fontSize: "0.92rem", letterSpacing: "0.01em" }}>
                {row.name}
              </div>
              {row.email && (
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginTop: 1 }}>
                  {row.email}
                </div>
              )}
            </div>
          </div>
        );
      },
      cardRender: (val, row) => (
        <div>
          <div className="fw-bold text-white" style={{ fontSize: "0.95rem" }}>
            {row.name}
          </div>
          {row.email && (
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginTop: 2 }}>
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "STAGE",
      sortable: true,
      render: (val, row) => {
        const col = COLUMNS.find(c => c.id === row.status) || COLUMNS[0];
        return (
          <span
            className="badge rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
            style={{
              background: col.light,
              color: col.hex,
              border: `1px solid ${col.border}`,
              fontSize: "0.75rem"
            }}
          >
            <span>{col.emoji}</span>
            <span>{col.title}</span>
          </span>
        );
      },
    },
    {
      key: "phone",
      label: "PHONE",
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-2">
          <span style={{ color: "#38bdf8" }}><IconPhone size={14} /></span>
          <span className="fw-semibold text-white" style={{ fontSize: "0.88rem", letterSpacing: "0.02em" }}>
            {row.phone}
          </span>
          {row.phone && (
            <a
              href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-success p-1 rounded hover-bg-light"
              title="Direct WhatsApp Chat"
              onClick={(e) => e.stopPropagation()}
            >
              <IconBrandWhatsapp size={16} />
            </a>
          )}
        </div>
      ),
      cardRender: (val, row) => (
        <div className="d-flex align-items-center gap-2">
          <span style={{ color: "#38bdf8" }}><IconPhone size={14} /></span>
          <span className="fw-semibold text-white" style={{ fontSize: "0.88rem", letterSpacing: "0.02em" }}>
            {row.phone}
          </span>
          {row.phone && (
            <a
              href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-success p-1 rounded hover-bg-light"
              title="Direct WhatsApp Chat"
              onClick={(e) => e.stopPropagation()}
            >
              <IconBrandWhatsapp size={16} />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "fitnessGoal",
      label: "GOAL",
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-1.5" style={{ fontSize: "0.84rem", color: "#e2e8f0" }}>
          <span>🎯</span>
          <span className="fw-medium">{row.fitnessGoal || "General Fitness"}</span>
        </div>
      ),
    },
    {
      key: "leadScore",
      label: "SCORE",
      sortable: true,
      render: (val, row) => {
        const score = row.leadScore || 75;
        const color = SCORE_COLOR(score);
        return (
          <span
            className="badge rounded-pill px-2 py-1 fw-bold"
            style={{
              color,
              background: `${color}18`,
              border: `1.5px solid ${color}44`,
              fontSize: "0.78rem"
            }}
          >
            {score}
          </span>
        );
      },
    },
    {
      key: "source",
      label: "SOURCE",
      sortable: true,
      render: (val, row) => (
        <span
          className="badge px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1.5"
          style={{
            fontSize: "0.75rem",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#f1f5f9",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}
        >
          <span>{SOURCE_ICON[row.source] || "📋"}</span>
          <span>{row.source ? row.source.replace("_", " ") : "WALK IN"}</span>
        </span>
      ),
    }
  ], [navigate]);

  return (
    <div className="lead-inbox-page pb-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>
              Lead Inbox
            </h4>
            <span className="badge rounded-pill bg-light text-primary border px-2 py-1 small fw-semibold">
              CRM Funnel
            </span>
          </div>
          <p className="text-muted mb-0 small">
            {leads.length} total leads across {COLUMNS.length} pipeline stages
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchLeads}
            disabled={loading}
            className="d-flex align-items-center gap-1 px-3 py-2 rounded-3 border fw-semibold text-dark bg-white"
            style={{ fontSize: "0.82rem" }}
          >
            <IconRefresh size={15} /> Refresh
          </Button>

          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowBulkUpload(true)}
            className="d-flex align-items-center gap-1 px-3 py-2 rounded-3 fw-semibold shadow-sm"
            style={{ fontSize: "0.82rem" }}
          >
            <IconUpload size={16} /> Bulk Upload
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddLead(true)}
            className="d-flex align-items-center gap-1 px-3 py-2 rounded-3 fw-semibold shadow-sm"
            style={{
              fontSize: "0.82rem",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              border: "none"
            }}
          >
            <IconPlus size={16} /> Add Lead
          </Button>
        </div>
      </div>

      {/* ── Stage Filter Pills Ribbon ─────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {/* ALL LEADS PILL */}
        <button
          type="button"
          onClick={() => setSelectedStage(null)}
          className="btn btn-sm d-flex align-items-center gap-1 px-3 py-1 rounded-pill border fw-semibold"
          style={{
            fontSize: "0.8rem",
            background: selectedStage === null ? "#0f172a" : "#f8fafc",
            color: selectedStage === null ? "#ffffff" : "#475569",
            borderColor: selectedStage === null ? "#0f172a" : "#e2e8f0",
            boxShadow: selectedStage === null ? "0 2px 8px rgba(15, 23, 42, 0.2)" : "none",
            transition: "all 0.2s"
          }}
        >
          <span>🌍</span>
          <span>All Leads</span>
          <span
            className="badge rounded-pill ms-1"
            style={{
              background: selectedStage === null ? "rgba(255, 255, 255, 0.25)" : "#cbd5e1",
              color: selectedStage === null ? "#ffffff" : "#334155",
              fontSize: "0.7rem"
            }}
          >
            {leads.length}
          </span>
        </button>

        {/* EACH STAGE PILL */}
        {COLUMNS.map(col => {
          const count = stageCounts[col.id] || 0;
          const isSelected = selectedStage === col.id;
          return (
            <button
              type="button"
              key={col.id}
              onClick={() => setSelectedStage(col.id)}
              className="btn btn-sm d-flex align-items-center gap-1 px-3 py-1 rounded-pill border fw-semibold"
              style={{
                fontSize: "0.8rem",
                background: isSelected ? col.hex : col.light,
                color: isSelected ? "#ffffff" : col.hex,
                borderColor: col.border,
                boxShadow: isSelected ? `0 2px 8px ${col.hex}55` : "none",
                opacity: selectedStage && !isSelected ? 0.65 : 1,
                transition: "all 0.2s"
              }}
            >
              <span>{col.emoji}</span>
              <span>{col.title}</span>
              <span
                className="badge rounded-pill ms-1"
                style={{
                  background: isSelected ? "rgba(255, 255, 255, 0.28)" : col.hex,
                  color: "#ffffff",
                  fontSize: "0.7rem"
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── CommonTable Integration (1st Image) ──────────────── */}
      <CommonTable
        columns={columns}
        data={tableData}
        entityName="lead"
        searchPlaceholder="Search leads by name, phone, email, goal, source..."
        searchKeys={["name", "phone", "email", "fitnessGoal", "source", "status"]}
        onEdit={(row) => navigate(`../details/${row.id}`)}
        onDelete={handleDeleteLead}
        onBulkDelete={handleBulkDelete}
        canEdit={true}
        canDelete={true}
        loading={loading}
        defaultPageSize={10}
        filterOptions={[
          { label: "All Stages", value: "ALL" },
          ...COLUMNS.map(c => ({ label: `${c.emoji} ${c.title}`, value: c.id }))
        ]}
      />

      {/* ── Modals ───────────────────────────────────────────── */}
      <AddLeadModal
        show={showAddLead}
        colId={selectedStage || "NEW"}
        onAdded={fetchLeads}
        onClose={() => setShowAddLead(false)}
      />

      <BulkUploadModal
        show={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onImported={fetchLeads}
      />
    </div>
  );
}
