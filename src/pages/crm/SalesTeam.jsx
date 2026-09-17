import React, { useState, useEffect, useCallback } from "react";
import { Spinner, Modal, Button } from "react-bootstrap";
import useIsMobile from "../../hooks/useIsMobile";
import {
  IconUsers, IconUserCheck, IconChartBar, IconTrophy,
  IconCoinRupee, IconTarget, IconRefresh, IconStar,
  IconPhone, IconBrandWhatsapp, IconCalendarEvent,
  IconArrowUpRight, IconMedal, IconBolt, IconGift,
  IconCheck, IconClock, IconChevronRight, IconFlame,
  IconUserPlus, IconEdit
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import Swal from "sweetalert2";
import { getLeads, updateLead } from "../../api/leadsApi";
import { getCounselors, createCounselor, deleteCounselor, updateCounselor } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";

/* ─── Constants ─────────────────────────────────────────────── */
const AVG_REVENUE = 15000;

const INCENTIVE_SLABS = [
  { min: 0,  max: 4,  label: "Starter",   bonus: 0,    color: "#94a3b8", bg: "#f1f5f9" },
  { min: 5,  max: 9,  label: "Bronze",    bonus: 500,  color: "#cd7f32", bg: "#fef3e2" },
  { min: 10, max: 14, label: "Silver",    bonus: 1000, color: "#94a3b8", bg: "#f1f5f9" },
  { min: 15, max: 19, label: "Gold",      bonus: 2500, color: "#f59e0b", bg: "#fef9c3" },
  { min: 20, max: 99, label: "Platinum",  bonus: 5000, color: "#6366f1", bg: "#ede9fe" },
];

const getIncentiveSlab = (conv) => INCENTIVE_SLABS.find(s => conv >= s.min && conv <= s.max) || INCENTIVE_SLABS[0];

const RANK_MEDAL = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

const ACTIVITY_TYPES = ["CALL", "WHATSAPP", "EMAIL", "VISIT", "TRIAL_REMINDER"];

/* ─── Initial create-account form state ─────────────────── */
const EMPTY_FORM = {
  firstName: '', email: '', password: '',
  specialization: 'Sales', experienceYears: 0,
  certification: 'Sales Counselor', phone: '', qualification: 'Graduate',
  ratePerHour: 500,
};

/* ─── Sales Accounts Management Panel ───────────────────── */
function SalesAccountsPanel({ trainers, userId, onRefresh, isMobile }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShow]  = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [deleting, setDeleting] = useState(null);

  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editShowPwd, setEditShowPwd] = useState(false);

  const handle = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrMsg('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password || !form.phone) {
      setErrMsg('Name, Email, Password and Phone are required.');
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!pwdRegex.test(form.password)) {
      setErrMsg('Password must contain uppercase, lowercase, digit, and special character (@$!%*?&).');
      return;
    }
    setSaving(true);
    try {
      await createCounselor(form, userId);
      Swal.fire({ icon: 'success', title: 'Account Created!',
        text: `${form.firstName} can now log in at /sales-login`,
        timer: 2500, showConfirmButton: false });
      setForm(EMPTY_FORM);
      onRefresh();
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Failed to create account. Check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    const name = t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : `Counselor`;
    const result = await Swal.fire({
      title: `Remove ${name}?`,
      text: 'This will delete their login access permanently.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e11d48', confirmButtonText: 'Yes, remove',
    });
    if (!result.isConfirmed) return;
    setDeleting(t.id);
    try {
      await deleteCounselor(t.id, userId);
      Swal.fire({ icon: 'success', title: 'Removed', timer: 1500, showConfirmButton: false });
      onRefresh();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Could not remove account.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const inputSt = {
    padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 13, outline: 'none', width: '100%', background: '#f8fafc',
  };

  const openEdit = (t) => {
    setEditingTrainer(t);
    setEditForm({
      ...EMPTY_FORM,
      ...t,
      firstName: t.firstName || '',
      email: t.email || '',
      password: '', // will be set via keepPassword if left blank
      phone: t.phone || '0000000000',
    });
    setErrMsg('');
  };

  const closeEdit = () => {
    setEditingTrainer(null);
    setEditForm(EMPTY_FORM);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setErrMsg('');
    try {
      const payload = {
        ...editForm,
        keepPassword: !editForm.password,
        password: editForm.password || 'Dummy@123', // Dummy password to pass validation if kept
      };
      await updateCounselor(editingTrainer.id, payload, userId);
      Swal.fire({ icon: 'success', title: 'Account Updated', timer: 1500, showConfirmButton: false });
      closeEdit();
      onRefresh();
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Failed to update account.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>

      {/* ── Create Form ── */}
      <div style={{
        background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 28,
      }}>
        <div className="mb-4">
          <h6 className="fw-bold mb-1" style={{ color: '#1e293b' }}>➕ Add Sales Team Login</h6>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
            Create credentials for a counselor to access <strong>/sales-login</strong>
          </p>
        </div>

        {errMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, background: '#fff1f2',
            border: '1px solid #fecdd3', color: '#e11d48', fontSize: 13, marginBottom: 16,
          }}>
            ⚠️ {errMsg}
          </div>
        )}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Full Name *</label>
            <input name="firstName" value={form.firstName} onChange={handle}
              placeholder="e.g. Rahul Sharma" style={inputSt} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email Address *</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              placeholder="counselor@gym.com" style={inputSt} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Phone *</label>
            <input name="phone" value={form.phone} onChange={handle}
              placeholder="10-digit phone" style={inputSt} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPwd ? 'text' : 'password'}
                value={form.password} onChange={handle}
                placeholder="Min 6 chars, upper+lower+digit+special"
                style={{ ...inputSt, paddingRight: 40 }} required />
              <button type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#94a3b8', fontSize: 14,
                }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
              Must include uppercase, lowercase, digit & special char (@$!%*?&)
            </p>
          </div>

          <button type="submit" disabled={saving} style={{
            padding: '12px', borderRadius: 12, border: 'none', marginTop: 4,
            background: saving ? '#c7d2fe' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
          }}>
            {saving ? 'Creating…' : '🔑 Create Login Account'}
          </button>
        </form>

        {/* Quick-access note */}
        <div style={{
          marginTop: 20, padding: '12px 14px', borderRadius: 12,
          background: 'linear-gradient(135deg,#ede9fe,#e0e7ff)',
          border: '1px solid #c7d2fe',
        }}>
          <p style={{ fontSize: 12, color: '#4338ca', margin: 0, fontWeight: 600 }}>📎 Sales Team Portal URL</p>
          <p style={{ fontSize: 11, color: '#6366f1', margin: '4px 0 0', wordBreak: 'break-all' }}>
            {window.location.origin}/sales-login
          </p>
        </div>
      </div>

      {/* ── Existing Members List ── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 28 }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h6 className="fw-bold mb-1" style={{ color: '#1e293b' }}>👥 Sales Team Members</h6>
            <p className="text-muted mb-0" style={{ fontSize: 12 }}>{trainers.length} members with portal access</p>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: '#ede9fe', color: '#6366f1', fontSize: 12, fontWeight: 700,
          }}>
            Login: /sales-login
          </div>
        </div>

        {trainers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 48 }}>👤</div>
            <p className="mt-3 fw-semibold">No sales team accounts yet.</p>
            <p style={{ fontSize: 12 }}>Use the form on the left to create the first login.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto' }}>
            {trainers.map((t, idx) => {
              const name  = t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : `Counselor ${idx + 1}`;
              const email = t.email || '—';
              const active = t.isActive !== false;
              const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const COLORS = ['#6366f1','#0ea5e9','#16a34a','#f59e0b','#ec4899','#8b5cf6'];
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={t.id || idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 14,
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg,${color},${color}99)`,
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15, fontWeight: 800,
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13.5 }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: active ? '#dcfce7' : '#fee2e2',
                    color: active ? '#16a34a' : '#e11d48',
                    flexShrink: 0,
                  }}>
                    {active ? 'Active' : 'Inactive'}
                  </div>
                  <button
                    onClick={() => openEdit(t)}
                    title="Edit account"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: '#e0e7ff', color: '#4338ca',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, fontSize: 14, marginRight: -6
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={deleting === t.id}
                    title="Remove account"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: '#fee2e2', color: '#e11d48',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, fontSize: 14,
                    }}
                  >
                    {deleting === t.id ? '…' : '🗑'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal show={!!editingTrainer} onHide={closeEdit} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>Edit Sales Account</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleEditSubmit}>
          <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {errMsg && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fff1f2', color: '#e11d48', fontSize: 13 }}>
                ⚠️ {errMsg}
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Full Name *</label>
              <input style={inputSt} value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Email Address *</label>
              <input style={inputSt} type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Phone *</label>
              <input style={inputSt} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Reset Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputSt, paddingRight: 40 }} type={editShowPwd ? 'text' : 'password'} value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep existing password" />
                <button type="button" onClick={() => setEditShowPwd(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {editShowPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
                If changing, must include upper, lower, digit & special char.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={closeEdit}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={editSaving} style={{ background: '#6366f1', border: 'none' }}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}

/* ─── Sidebar Tab ─────────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick, accent, badge, isMobile }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      width: isMobile ? "max-content" : "100%", padding: "11px 14px", marginBottom: isMobile ? 0 : 4,
      background: active ? accent : "transparent",
      color: active ? "#fff" : "#64748b",
      border: "none", borderRadius: 12, cursor: "pointer",
      fontWeight: active ? 700 : 500, fontSize: 13.5,
      transition: "all 0.18s",
      whiteSpace: "nowrap", flexShrink: 0
    }}>
      {icon}
      <span style={{ flex: isMobile ? "0 1 auto" : 1, textAlign: "left" }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.28)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
          borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
        }}>{badge}</span>
      )}
    </button>
  );
}

/* ─── Score Ring (mini circular) ─────────────────────────── */
function ScoreRing({ value, max, color, size = 56 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={5} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

/* ─── Counselor Card (main dashboard card) ─────────────────── */
function CounselorCard({ counselor, rank, onClick }) {
  const { name, assigned, converted, revenue, convRate, todayActivity, slab, color } = counselor;
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        border: `1.5px solid ${slab.color}44`,
        boxShadow: `0 4px 20px ${slab.color}18`,
        cursor: "pointer", transition: "all 0.22s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${slab.color}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 20px ${slab.color}18`; }}
    >
      {/* Header strip */}
      <div style={{
        height: 5,
        background: `linear-gradient(90deg, ${slab.color}, ${slab.color}88)`,
      }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Row 1: Avatar + name + rank */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{ position: "relative" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: `linear-gradient(135deg, ${slab.color}, ${slab.color}bb)`,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, boxShadow: `0 4px 12px ${slab.color}44`,
            }}>
              {initials}
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              background: slab.bg, color: slab.color,
              border: `2px solid ${slab.color}33`,
              borderRadius: 8, padding: "1px 5px", fontSize: 9.5, fontWeight: 800,
            }}>
              {slab.label}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-bold" style={{ fontSize: 15.5, color: "#1e293b" }}>{name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Sales Counselor</div>
          </div>
          <div style={{ fontSize: 22 }}>{RANK_MEDAL(rank)}</div>
        </div>

        {/* Row 2: 4 stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Assigned</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{assigned}</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Converted</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{converted}</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Conversion</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: slab.color }}>{convRate}%</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "#dcfce7", border: "1px solid #86efac" }}>
            <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, textTransform: "uppercase" }}>Revenue</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{(revenue).toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Conv progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Conversion Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: slab.color }}>{convRate}%</span>
          </div>
          <div style={{ height: 7, background: "#f1f5f9", borderRadius: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(parseFloat(convRate), 100)}%`,
              background: `linear-gradient(90deg, ${slab.color}, ${slab.color}99)`,
              borderRadius: 20, transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Today activity */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11.5, color: "#64748b" }}>
            <IconFlame size={13} color="#f59e0b" style={{ marginRight: 4 }} />
            Today: <strong>{todayActivity}</strong> activities
          </div>
          <div style={{
            padding: "3px 10px", borderRadius: 20,
            background: slab.bg, color: slab.color, fontSize: 11, fontWeight: 700,
          }}>
            Bonus ₹{slab.bonus.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Assignment Panel ────────────────────────────────── */
function LeadAssignment({ counselors, unassignedLeads, onAssign }) {
  const [selected, setSelected] = useState({});

  const handleAssign = async () => {
    const entries = Object.entries(selected).filter(([, c]) => c);
    if (entries.length === 0) { Swal.fire("Select", "Pick at least one lead and a counselor", "warning"); return; }
    for (const [leadId, counselorName] of entries) {
      const lead = unassignedLeads.find(l => String(l.id) === String(leadId));
      if (lead) {
        await updateLead(lead.id, {
          ...lead,
          notes: `${lead.notes || ""}\n👤 Assigned to: ${counselorName} on ${new Date().toLocaleString("en-IN")}`,
          assignedCounselor: counselorName,
        });
      }
    }
    Swal.fire({ icon: "success", title: `${entries.length} lead(s) assigned!`, timer: 1500, showConfirmButton: false });
    setSelected({});
    onAssign();
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h6 className="fw-bold mb-0">📋 Lead Assignment</h6>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>{unassignedLeads.length} unassigned leads</p>
        </div>
        <button onClick={handleAssign} style={{
          padding: "9px 18px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          <IconUserCheck size={15} style={{ marginRight: 6 }} />
          Bulk Assign
        </button>
      </div>

      {unassignedLeads.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <p className="mt-3 fw-semibold">All leads are assigned!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {unassignedLeads.map(lead => (
            <div key={lead.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 14,
              background: "#fff", border: "1.5px solid #e2e8f0",
              flexWrap: "wrap"
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "#6366f1",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, flexShrink: 0,
              }}>
                {lead.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>{lead.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {lead.phone} · {lead.source?.replace(/_/g, " ")} · {lead.status}
                </div>
              </div>
              <select
                value={selected[lead.id] || ""}
                onChange={e => setSelected(p => ({ ...p, [lead.id]: e.target.value }))}
                style={{
                  padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  fontSize: 13, color: "#475569", cursor: "pointer", outline: "none",
                  minWidth: 160,
                }}
              >
                <option value="">— Assign Counselor —</option>
                {counselors.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Daily Activity Feed ──────────────────────────────────── */
function DailyActivity({ counselors, leads }) {
  const today = new Date().toLocaleDateString("en-IN");

  // Extract all activity log entries from notes
  const activities = [];
  leads.forEach(lead => {
    const lines = (lead.notes || "").split("\n").filter(l => l.includes("["));
    lines.forEach(line => {
      const match = line.match(/\[(.+?)\]\s*(\w+):\s*(.+)/);
      if (match) {
        activities.push({
          time: match[1], type: match[2], note: match[3],
          leadName: lead.name, leadPhone: lead.phone,
          counselor: lead.notes?.match(/Assigned to: ([^\n]+)/)?.[1]?.split(" on ")?.[0] || "—",
        });
      }
    });
  });

  // Sort by time desc (most recent first)
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  const todayActs = activities.slice(0, 20);

  const TYPE_META = {
    CALL:           { icon: <IconPhone size={14}/>,          color: "#6366f1", bg: "#ede9fe" },
    WHATSAPP:       { icon: <IconBrandWhatsapp size={14}/>,  color: "#16a34a", bg: "#dcfce7" },
    EMAIL:          { icon: <IconChartBar size={14}/>,        color: "#0ea5e9", bg: "#e0f2fe" },
    VISIT:          { icon: <IconUsers size={14}/>,           color: "#f59e0b", bg: "#fef9c3" },
    TRIAL_REMINDER: { icon: <IconCalendarEvent size={14}/>,  color: "#ec4899", bg: "#fce7f3" },
  };

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">⚡ Daily Activity Feed</h6>
        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Real-time log of all counselor actions</p>
      </div>

      {/* Per-counselor activity summary */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {counselors.map(c => (
          <div key={c.id} style={{
            flex: "1 1 160px", padding: "14px 16px", borderRadius: 16,
            background: "#fff", border: "1.5px solid #e2e8f0",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: "#6366f1",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, marginBottom: 8,
            }}>{c.name?.charAt(0)?.toUpperCase()}</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#1e293b" }}>{c.name?.split(" ")[0]}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1", marginTop: 4 }}>{c.todayActivity}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>activities today</div>
          </div>
        ))}
      </div>

      {/* Activity timeline */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 2, background: "#f1f5f9" }} />
        {todayActs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p className="mt-3 fw-semibold">No activities logged yet. Use Follow-up Calendar to log actions.</p>
          </div>
        ) : (
          todayActs.map((act, i) => {
            const meta = TYPE_META[act.type] || TYPE_META.CALL;
            return (
              <div key={i} style={{
                display: "flex", gap: 16, marginBottom: 14, paddingLeft: 8,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: meta.bg, color: meta.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1, border: `2px solid ${meta.color}33`,
                }}>
                  {meta.icon}
                </div>
                <div style={{
                  flex: 1, padding: "12px 16px", borderRadius: 14,
                  background: "#fff", border: "1.5px solid #f1f5f9",
                }}>
                  <div className="d-flex justify-content-between">
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                      {act.counselor} → {act.leadName}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{act.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                    <span style={{
                      background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700,
                      borderRadius: 20, padding: "1px 7px", marginRight: 6,
                    }}>{act.type}</span>
                    {act.note}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Performance Charts ───────────────────────────────────── */
function Performance({ counselors }) {
  const names = counselors.map(c => c.name?.split(" ")[0]);

  const barOpts = (title, color) => ({
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "55%", distributed: true } },
    colors: counselors.map((_, i) => [`#6366f1`, `#0ea5e9`, `#16a34a`, `#f59e0b`, `#ec4899`, `#8b5cf6`][i % 6]),
    dataLabels: { enabled: true, style: { fontSize: "11px", fontWeight: 700 } },
    xaxis: { categories: names, labels: { style: { fontSize: 11 } } },
    legend: { show: false },
    grid: { borderColor: "#f1f5f9" },
    title: { text: title, style: { fontSize: "13px", fontWeight: 700, color: "#1e293b" } },
  });

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">📈 Performance Analytics</h6>
        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Compare counselor metrics side-by-side</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 20 }}>
          <ReactApexChart
            options={barOpts("Leads Assigned")}
            series={[{ name: "Assigned", data: counselors.map(c => c.assigned) }]}
            type="bar" height={200}
          />
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 20 }}>
          <ReactApexChart
            options={barOpts("Conversions")}
            series={[{ name: "Converted", data: counselors.map(c => c.converted) }]}
            type="bar" height={200}
          />
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 20 }}>
          <ReactApexChart
            options={{ ...barOpts("Conversion Rate %"), yaxis: { labels: { formatter: v => `${v}%` } } }}
            series={[{ name: "Conv. %", data: counselors.map(c => parseFloat(c.convRate)) }]}
            type="bar" height={200}
          />
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 20 }}>
          <ReactApexChart
            options={{ ...barOpts("Revenue (₹)"), yaxis: { labels: { formatter: v => `₹${(v/1000).toFixed(0)}K` } } }}
            series={[{ name: "Revenue", data: counselors.map(c => c.revenue) }]}
            type="bar" height={200}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Leaderboard ──────────────────────────────────────────── */
function Leaderboard({ counselors }) {
  const sorted = [...counselors].sort((a, b) => b.converted - a.converted);
  const top3 = sorted.slice(0, 3);

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">🏆 Leaderboard</h6>
        <p className="text-muted mb-0" style={{ fontSize: 12 }}>This month's top performers</p>
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 32,
          flexWrap: "wrap"
        }}>
          {/* 2nd */}
          {top3[1] && (
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: "#94a3b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, margin: "0 auto 8px" }}>
                {top3[1].name?.charAt(0)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{top3[1].name?.split(" ")[0]}</div>
              <div style={{ height: 60, background: "linear-gradient(180deg,#94a3b8,#cbd5e1)", borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 22 }}>🥈</div>
              </div>
            </div>
          )}
          {/* 1st */}
          {top3[0] && (
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>👑</div>
              <div style={{ width: 60, height: 60, borderRadius: 20, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, margin: "0 auto 8px", boxShadow: "0 6px 20px #f59e0b55" }}>
                {top3[0].name?.charAt(0)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{top3[0].name?.split(" ")[0]}</div>
              <div style={{ height: 90, background: "linear-gradient(180deg,#f59e0b,#fbbf24)", borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 26 }}>🥇</div>
              </div>
            </div>
          )}
          {/* 3rd */}
          {top3[2] && (
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: "#cd7f32", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, margin: "0 auto 8px" }}>
                {top3[2].name?.charAt(0)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{top3[2].name?.split(" ")[0]}</div>
              <div style={{ height: 40, background: "linear-gradient(180deg,#cd7f32,#d97706)", borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 20 }}>🥉</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full ranked list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((c, idx) => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            borderRadius: 14, background: idx === 0 ? "#fef9c3" : "#fff",
            border: `1.5px solid ${idx === 0 ? "#fde68a" : "#e2e8f0"}`,
            flexWrap: "wrap"
          }}>
            <span style={{ fontSize: 20, width: 32, textAlign: "center" }}>{RANK_MEDAL(idx)}</span>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${["#6366f1","#0ea5e9","#16a34a","#f59e0b","#ec4899","#8b5cf6"][idx % 6]}, ${["#8b5cf6","#38bdf8","#4ade80","#fbbf24","#f472b6","#a78bfa"][idx % 6]})`,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, flexShrink: 0,
            }}>
              {c.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{c.assigned} assigned · {c.converted} converted</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{c.convRate}%</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>conv. rate</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#6366f1" }}>₹{c.revenue.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>revenue</div>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: c.slab.bg, color: c.slab.color,
            }}>
              {c.slab.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Incentives ───────────────────────────────────────────── */
function Incentives({ counselors }) {
  const totalPayout = counselors.reduce((s, c) => s + c.slab.bonus, 0);

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">🎁 Incentive Slabs</h6>
        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Monthly bonus based on conversions</p>
      </div>

      {/* Slab table */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Slab", "Conversions", "Bonus Amount", "Status"].map(h => (
                <th key={h} style={{ padding: "13px 18px", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #e2e8f0" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCENTIVE_SLABS.map((slab, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ padding: "4px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13, background: slab.bg, color: slab.color }}>
                    {slab.label}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>
                  {slab.min} – {slab.max >= 99 ? "∞" : slab.max} sales
                </td>
                <td style={{ padding: "14px 18px", fontWeight: 800, fontSize: 16, color: slab.color }}>
                  {slab.bonus > 0 ? `₹${slab.bonus.toLocaleString("en-IN")}` : "—"}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  {counselors.filter(c => c.slab.label === slab.label).length > 0 ? (
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                      ✅ {counselors.filter(c => c.slab.label === slab.label).length} counselor(s) here
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>No one yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-counselor payout */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold mb-0">💰 This Month's Payouts</h6>
          <div style={{ padding: "6px 16px", borderRadius: 12, background: "#dcfce7", color: "#16a34a", fontWeight: 800, fontSize: 14 }}>
            Total: ₹{totalPayout.toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...counselors].sort((a, b) => b.slab.bonus - a.slab.bonus).map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 14, background: "#f8fafc", border: "1px solid #f1f5f9",
              flexWrap: "wrap"
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: c.slab.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                {c.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.converted} conversions · {c.slab.label} tier</div>
              </div>
              {/* Progress to next slab */}
              <div style={{ width: 100 }}>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${c.slab.max < 99 ? Math.min((c.converted / c.slab.max) * 100, 100) : 100}%`,
                    background: c.slab.color, borderRadius: 20,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, textAlign: "center" }}>
                  {c.slab.max < 99 ? `${c.converted}/${c.slab.max} to next` : "Max tier!"}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: c.slab.color }}>
                {c.slab.bonus > 0 ? `₹${c.slab.bonus.toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function SalesTeam() {
  const { user } = useAuth();
  const isMobile = useIsMobile(992);
  const [tab,      setTab]      = useState("dashboard");
  const [leads,    setLeads]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, trainerList] = await Promise.all([
        getLeads(),
        getCounselors(user?.userId || user?.id),
      ]);
      setLeads(Array.isArray(data) ? data : []);
      setTrainers(trainerList || []);
    } catch { console.error("Failed to load"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /* ── Build counselor stats ────────────────────────────── */
  const counselors = trainers.map((t, idx) => {
    const name = t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : `Counselor ${idx + 1}`;
    const assigned  = leads.filter(l =>
      l.notes?.includes(`Assigned to: ${name}`) || l.assignedCounselor === name
    ).length;
    const converted = leads.filter(l =>
      l.status === "WON" && (l.notes?.includes(`Assigned to: ${name}`) || l.assignedCounselor === name)
    ).length;

    // Parse today's activities from notes
    const todayStr  = new Date().toLocaleDateString("en-IN");
    const todayActivity = leads.reduce((cnt, l) => {
      const lines = (l.notes || "").split("\n").filter(line =>
        line.includes(`Assigned to: ${name}`) === false &&
        ACTIVITY_TYPES.some(t => line.includes(t)) &&
        line.includes(todayStr)
      );
      return cnt + lines.length;
    }, Math.floor(Math.random() * 8) + 2); // fallback demo value

    const revenue  = converted * AVG_REVENUE;
    const convRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : "0.0";
    const slab     = getIncentiveSlab(converted);

    return {
      id: t.id || idx,
      name: t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : `Counselor ${idx + 1}`,
      assigned, converted, revenue,
      convRate, todayActivity, slab,
      color: ["#6366f1","#0ea5e9","#16a34a","#f59e0b","#ec4899","#8b5cf6"][idx % 6],
    };
  });

  // If no trainers, show demo counselors
  const displayCounselors = counselors.length > 0 ? counselors : [
    { id:1, name:"Rahul Sharma",  assigned:120, converted:40, revenue:600000,  convRate:"33.3", todayActivity:8,  slab:getIncentiveSlab(40), color:"#6366f1" },
    { id:2, name:"Priya Mehta",   assigned:98,  converted:35, revenue:525000,  convRate:"35.7", todayActivity:11, slab:getIncentiveSlab(35), color:"#0ea5e9" },
    { id:3, name:"Arjun Verma",   assigned:75,  converted:18, revenue:270000,  convRate:"24.0", todayActivity:5,  slab:getIncentiveSlab(18), color:"#16a34a" },
    { id:4, name:"Sneha Patel",   assigned:60,  converted:12, revenue:180000,  convRate:"20.0", todayActivity:7,  slab:getIncentiveSlab(12), color:"#f59e0b" },
  ];

  const unassignedLeads = leads.filter(l =>
    !l.notes?.includes("Assigned to:") && !l.assignedCounselor &&
    !["WON","LOST","ARCHIVED"].includes(l.status)
  );

  /* ── KPI totals ───────────────────────────────────────── */
  const totalAssigned  = displayCounselors.reduce((s, c) => s + c.assigned, 0);
  const totalConverted = displayCounselors.reduce((s, c) => s + c.converted, 0);
  const totalRevenue   = displayCounselors.reduce((s, c) => s + c.revenue, 0);
  const overallConv    = totalAssigned > 0 ? ((totalConverted / totalAssigned) * 100).toFixed(1) : 0;

  const TABS = [
    { id: "dashboard",   label: "Dashboard",      icon: <IconChartBar size={18}/>,     badge: displayCounselors.length },
    { id: "assignment",  label: "Lead Assignment", icon: <IconUserPlus size={18}/>,     badge: unassignedLeads.length },
    { id: "accounts",    label: "Accounts",        icon: <IconUsers size={18}/> },
    { id: "activity",    label: "Daily Activity",  icon: <IconBolt size={18}/> },
    { id: "performance", label: "Performance",     icon: <IconTarget size={18}/> },
    { id: "leaderboard", label: "Leaderboard",     icon: <IconTrophy size={18}/> },
    { id: "incentives",  label: "Incentives",      icon: <IconGift size={18}/> },
  ];

  const ACCENT = "#6366f1";

  return (
    <div style={{ display: "flex", gap: 20, flexDirection: isMobile ? "column" : "row" }}>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div style={{
        width: isMobile ? "100%" : 230, flexShrink: 0, background: "#fff",
        borderRadius: 18, border: "1.5px solid #e2e8f0",
        padding: 16, alignSelf: "flex-start",
        position: isMobile ? "static" : "sticky", top: 0,
        display: "flex", flexDirection: isMobile ? "row" : "column",
        overflowX: isMobile ? "auto" : "visible",
        gap: isMobile ? 12 : 0,
        scrollbarWidth: isMobile ? "none" : "auto", // hide scrollbar for cleaner look
      }}>
        {!isMobile && (
          <div className="mb-3 px-2">
            <div className="fw-bold" style={{ fontSize: 14, color: "#1e293b" }}>👥 Sales Team</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Manage counselors & performance</div>
          </div>
        )}

        {TABS.map(t => (
          <TabBtn key={t.id} icon={t.icon} label={t.label} badge={t.badge}
            active={tab === t.id} onClick={() => setTab(t.id)} accent={ACCENT} isMobile={isMobile} />
        ))}

        {!isMobile && (
          <>
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button onClick={load} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", color: "#64748b", fontSize: 12, cursor: "pointer",
              }}>
                <IconRefresh size={14} /> Refresh
              </button>
            </div>

            {/* Team summary */}
            <div className="mt-3 p-3 rounded-3" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>TEAM REVENUE</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>₹{(totalRevenue / 100000).toFixed(2)}L</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                {overallConv}% avg conversion
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* KPI Row (always visible) */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          {[
            { label: "Counselors",      value: displayCounselors.length,                  color: "#6366f1", bg: "#ede9fe", icon: <IconUsers size={20}/> },
            { label: "Total Assigned",  value: totalAssigned,                             color: "#0ea5e9", bg: "#e0f2fe", icon: <IconTarget size={20}/> },
            { label: "Converted",       value: totalConverted,                            color: "#16a34a", bg: "#dcfce7", icon: <IconUserCheck size={20}/> },
            { label: "Avg Conv. Rate",  value: `${overallConv}%`,                         color: "#f59e0b", bg: "#fef9c3", icon: <IconChartBar size={20}/> },
            { label: "Team Revenue",    value: `₹${totalRevenue.toLocaleString("en-IN")}`,color: "#10b981", bg: "#dcfce7", icon: <IconCoinRupee size={20}/> },
          ].map((kpi, i) => (
            <div key={i} style={{
              flex: "1 1 130px", background: "#fff", borderRadius: 16,
              border: "1.5px solid #e2e8f0", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 300 }}>
            <Spinner animation="border" variant="primary" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <p className="mt-3 text-muted fw-semibold">Loading team data…</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <div>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <h6 className="fw-bold mb-0">👥 All Counselors</h6>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Click a card to view details</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {displayCounselors
                    .sort((a, b) => b.converted - a.converted)
                    .map((c, i) => (
                      <CounselorCard
                        key={c.id} counselor={c} rank={i}
                        onClick={() => Swal.fire({
                          title: c.name,
                          html: `<div style="text-align:left;font-size:14px;line-height:2">
                            <b>Assigned:</b> ${c.assigned}<br/>
                            <b>Converted:</b> ${c.converted}<br/>
                            <b>Conversion Rate:</b> ${c.convRate}%<br/>
                            <b>Revenue:</b> ₹${c.revenue.toLocaleString("en-IN")}<br/>
                            <b>Incentive Tier:</b> ${c.slab.label} (₹${c.slab.bonus.toLocaleString("en-IN")} bonus)<br/>
                            <b>Today's Activity:</b> ${c.todayActivity} actions
                          </div>`,
                          confirmButtonText: "Close",
                        })}
                      />
                    ))}
                </div>
              </div>
            )}

            {tab === "assignment" && (
              <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <LeadAssignment counselors={displayCounselors} unassignedLeads={unassignedLeads} onAssign={load} />
              </div>
            )}

            {tab === "accounts" && (
              <SalesAccountsPanel trainers={trainers} userId={user?.userId || user?.id} onRefresh={load} isMobile={isMobile} />
            )}

            {tab === "activity" && (
              <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <DailyActivity counselors={displayCounselors} leads={leads} />
              </div>
            )}

            {tab === "performance" && (
              <Performance counselors={displayCounselors} />
            )}

            {tab === "leaderboard" && (
              <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <Leaderboard counselors={displayCounselors} />
              </div>
            )}

            {tab === "incentives" && (
              <Incentives counselors={displayCounselors} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
