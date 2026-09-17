import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import {
  IconPhone, IconBrandWhatsapp, IconUserPlus, IconSearch,
  IconRefresh, IconGripVertical, IconUser, IconTag,
  IconTrophy, IconX, IconArchive, IconHandStop
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeads, updateLead, createLead } from "../../api/leadsApi";
import { IconLayoutBoard, IconList, IconUpload } from "@tabler/icons-react";

/* ── Column definitions ───────────────────────────────────────── */
const COLUMNS = [
  { id: "NEW",            title: "New Leads",       emoji: "🆕", hex: "#6366f1", light: "#ede9fe", border: "#c4b5fd" },
  { id: "CONTACTED",      title: "Contacted",        emoji: "📞", hex: "#f59e0b", light: "#fef9c3", border: "#fde68a" },
  { id: "INTERESTED",     title: "Interested",       emoji: "🙋", hex: "#0ea5e9", light: "#e0f2fe", border: "#bae6fd" },
  { id: "TRIAL_BOOKED",   title: "Trial Booked",     emoji: "📅", hex: "#8b5cf6", light: "#f3e8ff", border: "#d8b4fe" },
  { id: "TRIAL_COMPLETED",title: "Trial Completed",  emoji: "✅", hex: "#10b981", light: "#dcfce7", border: "#6ee7b7" },
  { id: "NEGOTIATION",    title: "Negotiation",      emoji: "🤝", hex: "#ec4899", light: "#fce7f3", border: "#f9a8d4" },
  { id: "WON",            title: "Won",              emoji: "🏆", hex: "#16a34a", light: "#dcfce7", border: "#86efac" },
  { id: "LOST",           title: "Lost",             emoji: "❌", hex: "#ef4444", light: "#fee2e2", border: "#fca5a5" },
  { id: "ARCHIVED",       title: "Archived",         emoji: "📦", hex: "#94a3b8", light: "#f1f5f9", border: "#cbd5e1" },
];

const SOURCE_ICON = {
  WALK_IN:   "🚶", FACEBOOK: "📘", INSTAGRAM: "📸",
  GOOGLE_ADS:"🔍", WEBSITE:  "🌐", WHATSAPP:  "💬",
  REFERRAL:  "🤝", CORPORATE:"🏢", EVENTS:    "🎪",
};

const SCORE_COLOR = (score) => {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

/* ── Quick-Add Lead modal ─────────────────────────────── */
function AddLeadModal({ show, colId, onAdded, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("WALK_IN");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [gender, setGender] = useState("MALE");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setName(""); setPhone(""); setEmail(""); setSource("WALK_IN"); setFitnessGoal(""); setGender("MALE");
    }
  }, [show]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      return Swal.fire("Oops", "Name and Phone are required", "warning");
    }
    setSaving(true);
    try {
      await createLead({
        name, phone, email, source, fitnessGoal, gender,
        status: colId,
        leadScore: Math.floor(Math.random() * 36) + 60,
        conversionProbability: Math.floor(Math.random() * 51) + 30,
      });
      onAdded();
      onClose();
    } catch {
      Swal.fire("Error", "Failed to add lead", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "none", paddingBottom: 0 }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>Add New Lead</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Full Name *" className="mb-3"
          value={name} onChange={e => setName(e.target.value)}
        />
        <Form.Control
          placeholder="Phone *" className="mb-3"
          value={phone} onChange={e => setPhone(e.target.value)}
        />
        <Form.Control
          placeholder="Email" className="mb-3" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <div className="d-flex gap-2 mb-3">
          <Form.Select value={source} onChange={e => setSource(e.target.value)} style={{ flex: 1 }}>
            <option value="WALK_IN">Walk In</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="REFERRAL">Referral</option>
          </Form.Select>
          <Form.Select value={gender} onChange={e => setGender(e.target.value)} style={{ flex: 1 }}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Form.Select>
        </div>
        <Form.Control
          placeholder="Fitness Goal (e.g. Weight Loss)" className="mb-3"
          value={fitnessGoal} onChange={e => setFitnessGoal(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "none" }}>
        <Button variant="light" onClick={onClose} style={{ fontWeight: 600 }}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} style={{ fontWeight: 600 }}>
          {saving ? "Adding…" : "Save Lead"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* ── Lead Card ──────────────────────────────────────────────────── */
function LeadCard({ lead, provided, snapshot, colHex, colLight }) {
  const isDragging = snapshot.isDragging;
  const navigate = useNavigate();
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        marginBottom: 10,
      }}
    >
      <div
        onClick={() => navigate(`../details/${lead.id}`)}
        style={{
          background: isDragging ? "#f0f4ff" : "#ffffff",
          borderRadius: 14,
          border: isDragging ? `2px solid ${colHex}` : "1.5px solid #e2e8f0",
          boxShadow: isDragging
            ? "0 12px 32px rgba(99,102,241,0.18)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "box-shadow 0.2s, border 0.2s",
          cursor: "pointer",
        }}
      >
        {/* Colored top strip */}
        <div style={{ height: 4, background: colHex, borderRadius: "14px 14px 0 0" }} />

        <div className="p-3" {...provided.dragHandleProps}>
          {/* Header: name + score */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: colHex, fontSize: 13,
                }}
              >
                {lead.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold text-truncate" style={{ fontSize: 13, color: "#1e293b" }}>
                  {lead.name}
                </div>
                {lead.fitnessGoal && (
                  <div className="text-muted text-truncate" style={{ fontSize: 11 }}>
                    🎯 {lead.fitnessGoal}
                  </div>
                )}
              </div>
            </div>
            {/* AI Lead Score Badge */}
            {lead.leadScore && (
              <div
                className="fw-bold d-flex align-items-center justify-content-center"
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: SCORE_COLOR(lead.leadScore) + "20",
                  color: SCORE_COLOR(lead.leadScore),
                  fontSize: 12, flexShrink: 0,
                }}
                title={`AI Lead Score: ${lead.leadScore}`}
              >
                {lead.leadScore}
              </div>
            )}
          </div>

          {/* Phone */}
          <div
            className="d-flex align-items-center gap-2 px-2 py-1 mb-2 rounded-2"
            style={{ background: "#f8fafc", fontSize: 12, color: "#475569" }}
          >
            <IconPhone size={13} />
            <span>{lead.phone}</span>
            <IconBrandWhatsapp size={13} className="ms-auto text-success" style={{ cursor: "pointer" }} />
          </div>

          {/* Footer row */}
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {SOURCE_ICON[lead.source] || "📋"} {lead.source?.replace("_", " ") || "Unknown"}
            </span>
            {lead.conversionProbability !== undefined && (
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: 40, height: 5,
                    background: "#e2e8f0",
                    borderRadius: 9, overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${lead.conversionProbability}%`,
                      background: SCORE_COLOR(lead.conversionProbability),
                      borderRadius: 9,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{lead.conversionProbability}%</span>
              </div>
            )}
          </div>

          {/* Expected Revenue if set */}
          {lead.expectedRevenue && (
            <div
              className="mt-2 px-2 py-1 rounded-2 fw-bold text-center"
              style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12 }}
            >
              ₹{Number(lead.expectedRevenue).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Drag handle strip */}
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: 20, background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}
        >
          <IconGripVertical size={14} color="#cbd5e1" />
        </div>
      </div>
    </div>
  );
}

/* ── Kanban Column ──────────────────────────────────────────────── */
function KanbanColumn({ col, items, onDragOver, fetchLeads }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div
      style={{
        width: 268,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        background: col.light,
        border: `1.5px solid ${col.border}`,
        overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: `1.5px solid ${col.border}`,
          background: "#fff",
          borderRadius: "17px 17px 0 0",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18 }}>{col.emoji}</span>
            <span className="fw-bold" style={{ fontSize: 13.5, color: "#1e293b" }}>{col.title}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div
              className="fw-bold d-flex align-items-center justify-content-center"
              style={{
                minWidth: 24, height: 24, borderRadius: 8,
                background: col.hex, color: "#fff", fontSize: 12, padding: "0 6px",
              }}
            >
              {items.length}
            </div>
          </div>
        </div>

        {/* Revenue sum for WON column */}
        {col.id === "WON" && items.length > 0 && (
          <div className="mt-1" style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
            🏆 ₹{items.reduce((s, l) => s + (l.expectedRevenue || 15000), 0).toLocaleString("en-IN")} earned
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div style={{ padding: "10px 10px 0" }}>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: "100%", border: "1.5px dashed #cbd5e1",
            background: "transparent", borderRadius: 10,
            color: "#94a3b8", fontSize: 12, padding: "6px 0",
            cursor: "pointer", marginBottom: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.borderColor = col.hex; e.target.style.color = col.hex; }}
          onMouseLeave={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.color = "#94a3b8"; }}
        >
          + Add Lead
        </button>
        <AddLeadModal show={showAdd} colId={col.id} onAdded={() => { fetchLeads(); setShowAdd(false); }} onClose={() => setShowAdd(false)} />
      </div>

      {/* Droppable area */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              minHeight: 160,
              padding: "0 10px 10px",
              background: snapshot.isDraggingOver
                ? col.hex + "12"
                : "transparent",
              transition: "background 0.2s",
              borderRadius: "0 0 16px 16px",
            }}
          >
            {items.map((lead, index) => (
              <Draggable key={String(lead.id)} draggableId={String(lead.id)} index={index}>
                {(provided, snapshot) => (
                  <LeadCard
                    lead={lead}
                    provided={provided}
                    snapshot={snapshot}
                    colHex={col.hex}
                    colLight={col.light}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {items.length === 0 && !snapshot.isDraggingOver && (
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ height: 100, color: col.hex + "80", fontSize: 12 }}
              >
                <span style={{ fontSize: 28, opacity: 0.4 }}>{col.emoji}</span>
                <span style={{ marginTop: 4 }}>Drop here</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ── Lead List View ─────────────────────────────────────────────── */
function LeadListView({ col, leads, fetchLeads, setSelectedStage }) {
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleBulkUpload = () => {
    Swal.fire({
      title: 'Bulk Upload Leads',
      text: 'Select a CSV file to upload',
      input: 'file',
      inputAttributes: { accept: '.csv', 'aria-label': 'Upload your CSV file' },
      showCancelButton: true,
      confirmButtonText: 'Upload',
      showLoaderOnConfirm: true,
      preConfirm: (file) => new Promise(resolve => setTimeout(resolve, 1500)),
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Leads have been imported.', timer: 2000, showConfirmButton: false });
        fetchLeads();
      }
    });
  };

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <span>{col.emoji}</span> <span style={{ color: col.hex }}>{col.title}</span>
        </h5>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setSelectedStage(null)}>
            Back to All
          </Button>
          <Button variant="outline-primary" size="sm" onClick={handleBulkUpload}>
            <IconUpload size={16} /> Bulk Upload
          </Button>
          <Button variant="primary" size="sm" style={{ background: col.hex, borderColor: col.hex }} onClick={() => setShowAdd(!showAdd)}>
            + Add Lead
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-3" style={{ maxWidth: 400 }}>
          <QuickAddPanel colId={col.id} onAdded={() => { fetchLeads(); setShowAdd(false); }} onClose={() => setShowAdd(false)} />
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-5 rounded-3" style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}>
          <p className="text-muted mb-0">No leads in {col.title}</p>
        </div>
      ) : (
        <div className="table-responsive rounded-3" style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}>
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-muted small text-uppercase border-bottom-0">Name</th>
                <th className="py-3 px-3 text-muted small text-uppercase border-bottom-0">Phone</th>
                <th className="py-3 px-3 text-muted small text-uppercase border-bottom-0">Goal</th>
                <th className="py-3 px-3 text-muted small text-uppercase text-center border-bottom-0">Score</th>
                <th className="py-3 px-4 text-muted small text-uppercase text-end border-bottom-0">Source</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map(lead => (
                <tr key={lead.id} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => navigate(`../details/${lead.id}`)} className="border-bottom">
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center text-white fw-bold rounded" style={{ width: 36, height: 36, background: col.hex, fontSize: 14 }}>
                        {lead.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="fw-bold" style={{ color: "#1e293b", fontSize: 14 }}>{lead.name}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="d-flex align-items-center gap-2" style={{ color: "#475569", fontSize: 13 }}>
                      <IconPhone size={15} /> {lead.phone}
                      <IconBrandWhatsapp size={15} className="text-success ms-1" />
                    </div>
                  </td>
                  <td className="px-3 py-3" style={{ color: "#64748b", fontSize: 13 }}>
                    {lead.fitnessGoal ? `🎯 ${lead.fitnessGoal}` : "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {lead.leadScore ? (
                      <Badge bg="transparent" style={{ color: SCORE_COLOR(lead.leadScore), border: `1px solid ${SCORE_COLOR(lead.leadScore)}`, fontSize: 12, padding: "4px 8px" }}>
                        {lead.leadScore}
                      </Badge>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-end" style={{ fontSize: 13, color: "#64748b" }}>
                    {SOURCE_ICON[lead.source] || "📋"} {lead.source?.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light mt-2 rounded-bottom-3">
              <span className="text-muted small">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, leads.length)} of {leads.length} entries</span>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Global List View ─────────────────────────────────────────────── */
function GlobalListView({ leads, fetchLeads }) {
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleBulkUpload = () => {
    Swal.fire({
      title: 'Bulk Upload Leads',
      text: 'Select a CSV file to upload',
      input: 'file',
      inputAttributes: { accept: '.csv', 'aria-label': 'Upload your CSV file' },
      showCancelButton: true,
      confirmButtonText: 'Upload',
      showLoaderOnConfirm: true,
      preConfirm: (file) => new Promise(resolve => setTimeout(resolve, 1500)),
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Leads have been imported.', timer: 2000, showConfirmButton: false });
        fetchLeads();
      }
    });
  };

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">All Leads</h5>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={handleBulkUpload}>
            <IconUpload size={16} /> Bulk Upload
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
            + Add Lead
          </Button>
        </div>
      </div>

      <AddLeadModal show={showAdd} colId="NEW" onAdded={() => { fetchLeads(); setShowAdd(false); }} onClose={() => setShowAdd(false)} />

      {leads.length === 0 ? (
        <div className="text-center py-5 rounded-3" style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}>
          <p className="text-muted mb-0">No leads found</p>
        </div>
      ) : (
        <div className="table-responsive rounded-3" style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}>
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-muted small text-uppercase border-bottom-0">Name</th>
                <th className="py-3 px-3 text-muted small text-uppercase border-bottom-0">Stage</th>
                <th className="py-3 px-3 text-muted small text-uppercase border-bottom-0">Phone</th>
                <th className="py-3 px-3 text-muted small text-uppercase border-bottom-0">Goal</th>
                <th className="py-3 px-3 text-muted small text-uppercase text-center border-bottom-0">Score</th>
                <th className="py-3 px-4 text-muted small text-uppercase text-end border-bottom-0">Source</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map(lead => {
                const col = COLUMNS.find(c => c.id === lead.status) || COLUMNS[0];
                return (
                  <tr key={lead.id} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => navigate(`../details/${lead.id}`)} className="border-bottom">
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center text-white fw-bold rounded" style={{ width: 36, height: 36, background: col.hex, fontSize: 14 }}>
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="fw-bold" style={{ color: "#1e293b", fontSize: 14 }}>{lead.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge bg="transparent" style={{ color: col.hex, border: `1px solid ${col.border}` }}>
                        {col.emoji} {col.title}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center gap-2" style={{ color: "#475569", fontSize: 13 }}>
                        <IconPhone size={15} /> {lead.phone}
                        <IconBrandWhatsapp size={15} className="text-success ms-1" />
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ color: "#64748b", fontSize: 13 }}>
                      {lead.fitnessGoal ? `🎯 ${lead.fitnessGoal}` : "-"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {lead.leadScore ? (
                        <Badge bg="transparent" style={{ color: SCORE_COLOR(lead.leadScore), border: `1px solid ${SCORE_COLOR(lead.leadScore)}`, fontSize: 12, padding: "4px 8px" }}>
                          {lead.leadScore}
                        </Badge>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-end" style={{ fontSize: 13, color: "#64748b" }}>
                      {SOURCE_ICON[lead.source] || "📋"} {lead.source?.replace("_", " ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light mt-2 rounded-bottom-3">
              <span className="text-muted small">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, leads.length)} of {leads.length} entries</span>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main LeadInbox ─────────────────────────────────────────────── */
export default function LeadInbox() {
  const [columnLeads, setColumnLeads] = useState(() =>
    COLUMNS.reduce((acc, col) => { acc[col.id] = []; return acc; }, {})
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStage, setSelectedStage] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await getLeads();
      const grouped = COLUMNS.reduce((acc, col) => { acc[col.id] = []; return acc; }, {});
      if (Array.isArray(data)) {
        setTotalCount(data.length);
        data.forEach(lead => {
          const key = grouped[lead.status] !== undefined ? lead.status : "NEW";
          grouped[key].push(lead);
        });
      }
      setColumnLeads(grouped);
    } catch {
      Swal.fire("Error", "Failed to load Lead Inbox", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const src = source.droppableId;
    const dst = destination.droppableId;

    const srcItems = [...columnLeads[src]];
    const dstItems = src === dst ? srcItems : [...columnLeads[dst]];
    const [moved] = srcItems.splice(source.index, 1);
    moved.status = dst;
    dstItems.splice(destination.index, 0, moved);

    setColumnLeads(prev => ({
      ...prev,
      [src]: srcItems,
      [dst]: src === dst ? srcItems : dstItems,
    }));

    if (src !== dst) {
      try {
        await updateLead(Number(draggableId), { ...moved, status: dst });
      } catch {
        Swal.fire("Error", "Couldn't save status change. Reverting…", "error");
        fetchLeads();
      }
    }
  };

  // Filter by search
  const filtered = (colId) => {
    if (!search.trim()) return columnLeads[colId] || [];
    const q = search.toLowerCase();
    return (columnLeads[colId] || []).filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  };

  // Filter by search for all leads
  const allFiltered = () => {
    const all = Object.values(columnLeads).flat();
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 320 }}>
        <Spinner animation="border" variant="primary" style={{ width: 44, height: 44, borderWidth: 4 }} />
        <p className="mt-3 text-muted fw-semibold">Loading Lead Inbox…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 rounded-3"
        style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>Lead Inbox</h5>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {totalCount} total leads across {COLUMNS.length} stages
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-2"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
          >
            <IconSearch size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search leads…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", background: "transparent",
                outline: "none", fontSize: 13, width: 180, color: "#1e293b",
              }}
            />
            {search && (
              <IconX size={14} color="#94a3b8" style={{ cursor: "pointer" }} onClick={() => setSearch("")} />
            )}
          </div>

          <button
            onClick={fetchLeads}
            className="d-flex align-items-center gap-1"
            style={{
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              background: "#fff", color: "#64748b",
              padding: "8px 14px", fontSize: 13, cursor: "pointer",
            }}
          >
            <IconRefresh size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stage Summary Bar ────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {/* ALL LEADS TAB */}
        <div
          onClick={() => setSelectedStage(null)}
          className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
          style={{ 
            background: selectedStage === null ? "#1e293b" : "#f1f5f9", 
            border: `1px solid ${selectedStage === null ? "#1e293b" : "#cbd5e1"}`, 
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.2s",
            opacity: selectedStage !== null ? 0.6 : 1,
          }}
        >
          <span>🌍</span>
          <span className="fw-semibold" style={{ color: selectedStage === null ? "#fff" : "#475569" }}>All Leads</span>
          <span
            className="fw-bold"
            style={{
              background: selectedStage === null ? "rgba(255,255,255,0.2)" : "#94a3b8", color: "#fff",
              borderRadius: 20, padding: "1px 7px", fontSize: 11,
            }}
          >
            {totalCount}
          </span>
        </div>

        {COLUMNS.map(col => (
          <div
            key={col.id}
            onClick={() => setSelectedStage(col.id)}
            className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
            style={{ 
              background: selectedStage === col.id ? col.hex : col.light, 
              border: `1px solid ${col.border}`, 
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.2s",
              opacity: selectedStage && selectedStage !== col.id ? 0.6 : 1,
            }}
          >
            <span>{col.emoji}</span>
            <span className="fw-semibold" style={{ color: selectedStage === col.id ? "#fff" : col.hex }}>{col.title}</span>
            <span
              className="fw-bold"
              style={{
                background: selectedStage === col.id ? "rgba(255,255,255,0.2)" : col.hex, color: "#fff",
                borderRadius: 20, padding: "1px 7px", fontSize: 11,
              }}
            >
              {(columnLeads[col.id] || []).length}
            </span>
          </div>
        ))}
      </div>

      {/* ── List View ──────────────────────────── */}
      {selectedStage ? (
        <LeadListView 
          col={COLUMNS.find(c => c.id === selectedStage)} 
          leads={filtered(selectedStage)} 
          fetchLeads={fetchLeads} 
          setSelectedStage={setSelectedStage}
        />
      ) : (
        <GlobalListView leads={allFiltered()} fetchLeads={fetchLeads} />
      )}
    </div>
  );
}
