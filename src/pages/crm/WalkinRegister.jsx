import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Form, Badge, Spinner } from "react-bootstrap";
import {
  IconUserPlus, IconClipboardList, IconId, IconHistory,
  IconTrendingUp, IconCheck, IconPhone, IconCalendar,
  IconUser, IconClock, IconTarget, IconSearch, IconRefresh,
  IconCircleCheckFilled, IconCircleXFilled, IconAlertCircle
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { createLead, getLeads, updateLead } from "../../api/leadsApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { getTrainers } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";

/* ─── Constants ───────────────────────────────────────── */
const FITNESS_GOALS = [
  { value: "Weight Loss",   emoji: "🔥", color: "#ef4444", bg: "#fee2e2" },
  { value: "Muscle Gain",   emoji: "💪", color: "#6366f1", bg: "#ede9fe" },
  { value: "Fitness",       emoji: "🏃", color: "#0ea5e9", bg: "#e0f2fe" },
  { value: "Body Building", emoji: "🏋️", color: "#f59e0b", bg: "#fef9c3" },
  { value: "Yoga & Flex",   emoji: "🧘", color: "#10b981", bg: "#dcfce7" },
  { value: "Sports Perf.",  emoji: "⚽", color: "#8b5cf6", bg: "#f3e8ff" },
];

const TIMES = [
  { value: "Early Morning", label: "Early Morning", sub: "5 AM – 7 AM", emoji: "🌅" },
  { value: "Morning",       label: "Morning",       sub: "7 AM – 10 AM", emoji: "☀️" },
  { value: "Afternoon",     label: "Afternoon",     sub: "10 AM – 4 PM", emoji: "🌤️" },
  { value: "Evening",       label: "Evening",       sub: "4 PM – 8 PM", emoji: "🌆" },
  { value: "Night",         label: "Night",         sub: "8 PM – 10 PM", emoji: "🌙" },
];

const STATUS_META = {
  NEW:             { label: "New",             color: "#6366f1", bg: "#ede9fe" },
  CONTACTED:       { label: "Contacted",       color: "#f59e0b", bg: "#fef9c3" },
  INTERESTED:      { label: "Interested",      color: "#0ea5e9", bg: "#e0f2fe" },
  TRIAL_BOOKED:    { label: "Trial Booked",    color: "#8b5cf6", bg: "#f3e8ff" },
  TRIAL_COMPLETED: { label: "Trial Done",      color: "#10b981", bg: "#dcfce7" },
  WON:             { label: "Converted ✅",    color: "#16a34a", bg: "#dcfce7" },
  LOST:            { label: "Lost",            color: "#ef4444", bg: "#fee2e2" },
  NEGOTIATION:     { label: "Negotiation",     color: "#ec4899", bg: "#fce7f3" },
};

/* ─── Sidebar Tab Button ──────────────────────────────── */
function TabBtn({ icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "11px 16px",
        background: active ? "#6366f1" : "transparent",
        color: active ? "#fff" : "#64748b",
        border: "none", borderRadius: 12, cursor: "pointer",
        fontWeight: active ? 700 : 500, fontSize: 13.5,
        transition: "all 0.18s", marginBottom: 4,
      }}
    >
      {icon}
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {count !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.25)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
          borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );
}

/* ─── Goal Pill Selector ─────────────────────────────── */
function GoalPill({ goal, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 14, cursor: "pointer",
        background: selected ? goal.color : goal.bg,
        border: `2px solid ${selected ? goal.color : "transparent"}`,
        color: selected ? "#fff" : goal.color,
        fontWeight: 600, fontSize: 13.5,
        transition: "all 0.18s",
        boxShadow: selected ? `0 4px 14px ${goal.color}44` : "none",
      }}
    >
      <span style={{ fontSize: 20 }}>{goal.emoji}</span>
      {goal.value}
      {selected && <IconCheck size={16} />}
    </div>
  );
}

/* ─── Time Pill Selector ─────────────────────────────── */
function TimePill({ time, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: "center", padding: "12px 16px", borderRadius: 14,
        cursor: "pointer", minWidth: 110,
        background: selected ? "#6366f1" : "#f8fafc",
        border: `2px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
        color: selected ? "#fff" : "#475569",
        fontWeight: 600, fontSize: 12,
        transition: "all 0.18s",
        boxShadow: selected ? "0 4px 14px #6366f144" : "none",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{time.emoji}</div>
      <div>{time.label}</div>
      <div style={{ fontWeight: 400, fontSize: 10.5, opacity: 0.75 }}>{time.sub}</div>
    </div>
  );
}

/* ─── Section: New Walk-in Form ──────────────────────── */
function NewWalkinForm({ plans, trainers, onSaved }) {
  const EMPTY = {
    name: "", phone: "", email: "", age: "", gender: "Male",
    fitnessGoal: "Fitness", interestedPackage: "",
    preferredTime: "Morning", assignedCounselorId: "", notes: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      Swal.fire("Required", "Name and Phone are mandatory", "warning"); return;
    }
    setSaving(true);
    try {
      await createLead({
        ...form,
        age: form.age ? Number(form.age) : null,
        status: "NEW",
        source: "WALK_IN",
        leadScore: Math.floor(Math.random() * 36) + 60,
        conversionProbability: Math.floor(Math.random() * 51) + 30,
      });
      Swal.fire({ icon: "success", title: "Registered! 🎉", text: `${form.name} added to Lead Inbox`, timer: 2000, showConfirmButton: false });
      setForm(EMPTY);
      onSaved?.();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to register", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconUserPlus size={26} color="#6366f1" />
        </div>
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>New Walk-in</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Capture visitor details quickly and add to the Lead Inbox</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Details card */}
        <div className="p-4 mb-4 rounded-3" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
          <h6 className="fw-bold mb-3" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            👤 Personal Details
          </h6>
          <Row className="g-3">
            <Col md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Full Name <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0" style={{ borderRadius: "10px 0 0 10px" }}>
                  <IconUser size={16} color="#94a3b8" />
                </span>
                <input
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 10px 10px 0" }}
                  placeholder="e.g. Rahul Sharma"
                  value={form.name} onChange={e => set("name", e.target.value)} required
                />
              </div>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Phone Number <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0" style={{ borderRadius: "10px 0 0 10px" }}>
                  <IconPhone size={16} color="#94a3b8" />
                </span>
                <input
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 10px 10px 0" }}
                  placeholder="9876543210"
                  value={form.phone} onChange={e => set("phone", e.target.value)} required
                />
              </div>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email Address</label>
              <input className="form-control" style={{ borderRadius: 10 }} placeholder="optional@email.com"
                value={form.email} onChange={e => set("email", e.target.value)} />
            </Col>
            <Col md={3}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Age</label>
              <input type="number" className="form-control" style={{ borderRadius: 10 }} placeholder="e.g. 25"
                value={form.age} onChange={e => set("age", e.target.value)} min={10} max={100} />
            </Col>
            <Col md={3}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Gender</label>
              <select className="form-select" style={{ borderRadius: 10 }}
                value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Col>
          </Row>
        </div>

        {/* Fitness Goal card */}
        <div className="p-4 mb-4 rounded-3" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
          <h6 className="fw-bold mb-3" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🎯 Fitness Goal
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {FITNESS_GOALS.map(g => (
              <GoalPill key={g.value} goal={g} selected={form.fitnessGoal === g.value} onClick={() => set("fitnessGoal", g.value)} />
            ))}
          </div>
        </div>

        {/* Package + Time card */}
        <div className="p-4 mb-4 rounded-3" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
          <h6 className="fw-bold mb-3" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📦 Interested Package
          </h6>
          {plans.length > 0 ? (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => set("interestedPackage", plan.code)}
                  style={{
                    padding: "12px 20px", borderRadius: 14, cursor: "pointer",
                    background: form.interestedPackage === plan.code ? "#6366f1" : "#f8fafc",
                    border: `2px solid ${form.interestedPackage === plan.code ? "#6366f1" : "#e2e8f0"}`,
                    color: form.interestedPackage === plan.code ? "#fff" : "#1e293b",
                    fontWeight: 600, fontSize: 13, transition: "all 0.18s",
                    boxShadow: form.interestedPackage === plan.code ? "0 4px 14px #6366f144" : "none",
                    textAlign: "center",
                  }}
                >
                  <div>{plan.name}</div>
                  <div style={{ fontWeight: 400, fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    ₹{plan.price?.toLocaleString("en-IN")}/mo
                  </div>
                  {form.interestedPackage === plan.code && (
                    <div style={{ marginTop: 4 }}><IconCheck size={14} /></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted small mb-4">No plans available. Add plans in Membership Settings.</p>
          )}

          <h6 className="fw-bold mb-3" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ⏰ Preferred Workout Time
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {TIMES.map(t => (
              <TimePill key={t.value} time={t} selected={form.preferredTime === t.value} onClick={() => set("preferredTime", t.value)} />
            ))}
          </div>
        </div>

        {/* Counselor + Notes card */}
        <div className="p-4 mb-4 rounded-3" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
          <h6 className="fw-bold mb-3" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🧑‍💼 Assigned Counselor & Notes
          </h6>
          <Row className="g-3">
            <Col md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Assign Counselor / Trainer</label>
              <select className="form-select" style={{ borderRadius: 10 }}
                value={form.assignedCounselorId} onChange={e => set("assignedCounselorId", e.target.value)}>
                <option value="">— Not Assigned —</option>
                {trainers.map(t => (
                  <option key={t.account?.id} value={t.account?.id}>{t.account?.name}</option>
                ))}
              </select>
            </Col>
            <Col md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Quick Notes</label>
              <textarea
                className="form-control" rows={3} style={{ borderRadius: 10, resize: "none" }}
                placeholder="Health conditions, referral, queries…"
                value={form.notes} onChange={e => set("notes", e.target.value)}
              />
            </Col>
          </Row>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={saving}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: saving ? "#a5b4fc" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff", fontWeight: 700, fontSize: 16, cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px #6366f144", transition: "all 0.2s",
          }}
        >
          {saving ? "⏳ Registering…" : "✅ Complete Walk-in Registration"}
        </button>
      </form>
    </div>
  );
}

/* ─── Section: Visitor Log ───────────────────────────── */
function VisitorLog({ leads, loading }) {
  const [search, setSearch] = useState("");
  const walkins = leads.filter(l => l.source === "WALK_IN");
  const filtered = walkins.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconClipboardList size={26} color="#0ea5e9" />
        </div>
        <div>
          <h5 className="fw-bold mb-0">Visitor Log</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>{walkins.length} total walk-in visitors recorded</p>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2 px-3 py-2 rounded-2" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
          <IconSearch size={15} color="#94a3b8" />
          <input
            placeholder="Search visitor…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: 160 }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <IconClipboardList size={48} style={{ opacity: 0.2 }} />
          <p className="mt-2">No walk-in visitors yet. Register one from "New Walk-in".</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((lead, idx) => {
            const sm = STATUS_META[lead.status] || { label: lead.status, color: "#64748b", bg: "#f1f5f9" };
            return (
              <div
                key={lead.id}
                style={{
                  background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0",
                  overflow: "hidden", transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ height: 3, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                <div className="p-4 d-flex flex-wrap gap-3 align-items-center">
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, background: "#6366f1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0,
                  }}>
                    {lead.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div className="fw-bold" style={{ color: "#1e293b", fontSize: 15 }}>{lead.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      <IconPhone size={12} className="me-1" />{lead.phone}
                      {lead.age && <span className="ms-2">· {lead.age} yrs · {lead.gender}</span>}
                    </div>
                  </div>
                  {/* Goal */}
                  {lead.fitnessGoal && (
                    <div style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: "#ede9fe", color: "#6366f1", fontWeight: 600 }}>
                      🎯 {lead.fitnessGoal}
                    </div>
                  )}
                  {/* Time */}
                  {lead.preferredTime && (
                    <div style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: "#e0f2fe", color: "#0ea5e9", fontWeight: 600 }}>
                      ⏰ {lead.preferredTime}
                    </div>
                  )}
                  {/* Status */}
                  <div style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: sm.bg, color: sm.color, fontWeight: 600 }}>
                    {sm.label}
                  </div>
                  {/* Date */}
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    <IconCalendar size={12} className="me-1" />
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Trial Pass ────────────────────────────── */
function TrialPass({ leads, onRefresh }) {
  const trials = leads.filter(l => l.status === "TRIAL_BOOKED");

  const handleIssuePass = (lead) => {
    Swal.fire({
      title: `🎫 Trial Pass`,
      html: `
        <div style="text-align:left;line-height:2;">
          <b>Name:</b> ${lead.name}<br/>
          <b>Phone:</b> ${lead.phone}<br/>
          <b>Goal:</b> ${lead.fitnessGoal || "—"}<br/>
          <b>Time:</b> ${lead.preferredTime || "—"}<br/>
          <b>Pass Valid:</b> Today Only<br/>
          <hr/>
          <i>Present this pass at reception for free trial access.</i>
        </div>`,
      confirmButtonText: "Print / Share",
      showCancelButton: true,
      cancelButtonText: "Close",
    });
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconId size={26} color="#8b5cf6" />
        </div>
        <div>
          <h5 className="fw-bold mb-0">Trial Pass</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>{trials.length} active trial bookings</p>
        </div>
      </div>

      {trials.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <IconId size={48} style={{ opacity: 0.2 }} />
          <p className="mt-2">No trial bookings. Move a lead to "Trial Booked" in the Lead Inbox.</p>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {trials.map(lead => (
            <div
              key={lead.id}
              style={{
                width: 260, borderRadius: 20, overflow: "hidden",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow: "0 8px 24px #6366f133",
              }}
            >
              <div className="p-4 text-white">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.1em", textTransform: "uppercase" }}>Trial Pass</span>
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>1 Day</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{lead.name?.split(" ")[0]}</div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>{lead.name}</div>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, opacity: 0.85 }}>
                  <span>📞 {lead.phone}</span>
                  <span>🎯 {lead.fitnessGoal || "—"}</span>
                  <span>⏰ {lead.preferredTime || "Anytime"}</span>
                </div>
                <button
                  onClick={() => handleIssuePass(lead)}
                  style={{
                    width: "100%", marginTop: 16, padding: "9px", borderRadius: 12,
                    border: "2px solid rgba(255,255,255,0.5)",
                    background: "transparent", color: "#fff", fontWeight: 700,
                    fontSize: 13, cursor: "pointer",
                  }}
                >
                  🎫 View / Print Pass
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Check-in History ─────────────────────── */
function CheckinHistory({ leads }) {
  const all = [...leads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .filter(l => l.source === "WALK_IN")
    .slice(0, 20);

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconHistory size={26} color="#10b981" />
        </div>
        <div>
          <h5 className="fw-bold mb-0">Check-in History</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Recent walk-in activity log</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
        <table className="table mb-0 align-middle">
          <thead style={{ background: "#f8fafc", fontSize: 12 }}>
            <tr>
              <th className="ps-4 py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>#</th>
              <th className="py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>Visitor</th>
              <th className="py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>Goal</th>
              <th className="py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>Time Pref.</th>
              <th className="py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>Date</th>
              <th className="pe-4 py-3 border-0 text-uppercase fw-bold" style={{ letterSpacing: "0.05em", color: "#94a3b8" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-5 text-muted">No history yet.</td></tr>
            ) : all.map((lead, idx) => {
              const sm = STATUS_META[lead.status] || { label: lead.status, color: "#64748b", bg: "#f1f5f9" };
              return (
                <tr key={lead.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td className="ps-4 text-muted" style={{ fontSize: 13 }}>{idx + 1}</td>
                  <td>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>{lead.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{lead.phone}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{lead.fitnessGoal || "—"}</td>
                  <td style={{ fontSize: 13 }}>{lead.preferredTime || "—"}</td>
                  <td style={{ fontSize: 12, color: "#94a3b8" }}>
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="pe-4">
                    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: sm.bg, color: sm.color, fontWeight: 600 }}>
                      {sm.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Section: Conversion Status ────────────────────── */
function ConversionStatus({ leads }) {
  const walkins = leads.filter(l => l.source === "WALK_IN");
  const converted = walkins.filter(l => l.status === "WON").length;
  const lost = walkins.filter(l => l.status === "LOST").length;
  const inProgress = walkins.filter(l => !["WON", "LOST", "ARCHIVED"].includes(l.status)).length;
  const total = walkins.length;
  const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

  const stages = [
    { label: "New Visitors",      count: walkins.filter(l => l.status === "NEW").length,             color: "#6366f1" },
    { label: "Contacted",         count: walkins.filter(l => l.status === "CONTACTED").length,        color: "#f59e0b" },
    { label: "Interested",        count: walkins.filter(l => l.status === "INTERESTED").length,       color: "#0ea5e9" },
    { label: "Trial Booked",      count: walkins.filter(l => l.status === "TRIAL_BOOKED").length,     color: "#8b5cf6" },
    { label: "Trial Completed",   count: walkins.filter(l => l.status === "TRIAL_COMPLETED").length,  color: "#10b981" },
    { label: "Converted (Won)",   count: converted,                                                    color: "#16a34a" },
    { label: "Lost",              count: lost,                                                         color: "#ef4444" },
  ];
  const maxVal = Math.max(...stages.map(s => s.count), 1);

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconTrendingUp size={26} color="#10b981" />
        </div>
        <div>
          <h5 className="fw-bold mb-0">Conversion Status</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Walk-in to member funnel analytics</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { label: "Total Walk-ins", value: total, color: "#6366f1", bg: "#ede9fe", icon: <IconUser size={20} /> },
          { label: "Converted", value: converted, color: "#16a34a", bg: "#dcfce7", icon: <IconCircleCheckFilled size={20} /> },
          { label: "In Progress", value: inProgress, color: "#f59e0b", bg: "#fef9c3", icon: <IconAlertCircle size={20} /> },
          { label: "Lost", value: lost, color: "#ef4444", bg: "#fee2e2", icon: <IconCircleXFilled size={20} /> },
          { label: "Conversion %", value: `${convRate}%`, color: "#0ea5e9", bg: "#e0f2fe", icon: <IconTrendingUp size={20} /> },
        ].map((kpi, idx) => (
          <div key={idx} style={{ flex: "1 1 140px", background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: 20, color: kpi.color }}>{kpi.value}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel bars */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 24 }}>
        <h6 className="fw-bold mb-4" style={{ color: "#475569", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          📊 Conversion Funnel
        </h6>
        <div className="d-flex flex-column gap-3">
          {stages.map((s, idx) => (
            <div key={idx} className="d-flex align-items-center gap-3">
              <div style={{ width: 130, fontSize: 13, color: "#475569", flexShrink: 0, fontWeight: 500 }}>{s.label}</div>
              <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 20, height: 22, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max((s.count / maxVal) * 100, s.count > 0 ? 5 : 0)}%`,
                    background: s.color, borderRadius: 20,
                    transition: "width 0.6s ease",
                    display: "flex", alignItems: "center", paddingLeft: 8,
                  }}
                >
                  {s.count > 0 && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{s.count}</span>}
                </div>
              </div>
              <div style={{ width: 30, textAlign: "right", fontWeight: 700, fontSize: 14, color: s.color }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function WalkinRegister() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [leads, setLeads] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, plansData, trainersData] = await Promise.all([
        getLeads(),
        getMembershipPlans({ activeOnly: true }),
        getTrainers(user?.userId || user?.id),
      ]);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setPlans(plansData || []);
      setTrainers(trainersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const walkinCount = leads.filter(l => l.source === "WALK_IN").length;
  const trialCount  = leads.filter(l => l.source === "WALK_IN" && l.status === "TRIAL_BOOKED").length;

  const TABS = [
    { id: "new",        label: "New Walk-in",       icon: <IconUserPlus size={18} /> },
    { id: "log",        label: "Visitor Log",        icon: <IconClipboardList size={18} />, count: walkinCount },
    { id: "trial",      label: "Trial Pass",         icon: <IconId size={18} />,            count: trialCount },
    { id: "history",    label: "Check-in History",   icon: <IconHistory size={18} /> },
    { id: "conversion", label: "Conversion Status",  icon: <IconTrendingUp size={18} /> },
  ];

  return (
    <div className="themebody-wrap">
      <div className="theme-body" style={{ display: "flex", gap: 20, minHeight: "70vh" }}>
      {/* ── Sidebar ── */}
      <div
        style={{
          width: 230, flexShrink: 0,
          background: "#fff", borderRadius: 18,
          border: "1.5px solid #e2e8f0",
          padding: 16, alignSelf: "flex-start",
          position: "sticky", top: 0,
        }}
      >
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{ fontSize: 14, color: "#1e293b" }}>🚶 Walk-in Register</div>
          <div className="text-muted" style={{ fontSize: 11 }}>Every gym receives walk-ins</div>
        </div>
        {TABS.map(tab => (
          <TabBtn
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            count={tab.count}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={loadData}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px", borderRadius: 12, border: "1.5px solid #e2e8f0",
              background: "#f8fafc", color: "#64748b", fontSize: 12, cursor: "pointer",
            }}
          >
            <IconRefresh size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "new" && (
          <NewWalkinForm plans={plans} trainers={trainers} onSaved={loadData} />
        )}
        {activeTab === "log" && (
          <VisitorLog leads={leads} loading={loading} />
        )}
        {activeTab === "trial" && (
          <TrialPass leads={leads} onRefresh={loadData} />
        )}
        {activeTab === "history" && (
          <CheckinHistory leads={leads} />
        )}
        {activeTab === "conversion" && (
          <ConversionStatus leads={leads} />
        )}
      </div>
      </div>
    </div>
  );
}
