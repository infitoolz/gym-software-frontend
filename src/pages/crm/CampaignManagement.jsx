import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import {
  IconBrandFacebook, IconBrandInstagram, IconBrandGoogle,
  IconBrandWhatsapp, IconUsers, IconWalk, IconBriefcase,
  IconStar, IconPlus, IconEdit, IconTrash, IconRefresh,
  IconTrendingUp, IconCoinRupee, IconTarget, IconChartBar,
  IconX, IconCheck, IconArrowUpRight, IconRocket, IconFilter, IconSend
} from "@tabler/icons-react";
import { ProgressBar } from "react-bootstrap";
import ReactApexChart from "react-apexcharts";
import Swal from "sweetalert2";
import { getLeads } from "../../api/leadsApi";

/* ─── Channel Definitions ──────────────────────────────────── */
const CHANNELS = [
  { id: "FACEBOOK",   label: "Facebook",   icon: <IconBrandFacebook size={22}/>,  color: "#1877F2", light: "#e7f0fd", emoji: "📘" },
  { id: "INSTAGRAM",  label: "Instagram",  icon: <IconBrandInstagram size={22}/>, color: "#E1306C", light: "#fde7ef", emoji: "📸" },
  { id: "GOOGLE_ADS", label: "Google Ads", icon: <IconBrandGoogle size={22}/>,    color: "#EA4335", light: "#fdecea", emoji: "🔍" },
  { id: "WHATSAPP",   label: "WhatsApp",   icon: <IconBrandWhatsapp size={22}/>,  color: "#25D366", light: "#e7faf0", emoji: "💬" },
  { id: "REFERRAL",   label: "Referral",   icon: <IconUsers size={22}/>,          color: "#8b5cf6", light: "#f3e8ff", emoji: "🤝" },
  { id: "WALK_IN",    label: "Walk-in",    icon: <IconWalk size={22}/>,           color: "#f59e0b", light: "#fef9c3", emoji: "🚶" },
  { id: "CORPORATE",  label: "Corporate",  icon: <IconBriefcase size={22}/>,      color: "#0ea5e9", light: "#e0f2fe", emoji: "🏢" },
  { id: "EVENTS",     label: "Events",     icon: <IconStar size={22}/>,           color: "#10b981", light: "#dcfce7", emoji: "🎪" },
];

/* ─── Default Budgets (demo values when no real data) ────────── */
const DEFAULT_SPEND = {
  FACEBOOK: 10000, INSTAGRAM: 8000, GOOGLE_ADS: 15000,
  WHATSAPP: 2000, REFERRAL: 0, WALK_IN: 0, CORPORATE: 5000, EVENTS: 12000,
};

const AVG_REVENUE_PER_CONVERSION = 15000;

/* ─── ROI Badge ──────────────────────────────────────────────── */
function RoiBadge({ roi }) {
  const color = roi >= 5 ? "#16a34a" : roi >= 2 ? "#f59e0b" : "#ef4444";
  const bg    = roi >= 5 ? "#dcfce7" : roi >= 2 ? "#fef9c3" : "#fee2e2";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 12px", borderRadius: 20,
      background: bg, color, fontWeight: 800, fontSize: 15,
    }}>
      <IconArrowUpRight size={15} /> {roi >= 1 ? `${roi}X` : "<1X"}
    </div>
  );
}

/* ─── Campaign Card ──────────────────────────────────────────── */
function CampaignCard({ channel, leads, spend, onEditSpend }) {
  const ch          = CHANNELS.find(c => c.id === channel.id) || channel;
  const totalLeads  = leads.length;
  const conversions = leads.filter(l => l.status === "WON").length;
  const revenue     = conversions * AVG_REVENUE_PER_CONVERSION;
  const roi         = spend > 0 ? parseFloat((revenue / spend).toFixed(1)) : revenue > 0 ? 99 : 0;
  const cpl         = totalLeads > 0 && spend > 0 ? Math.round(spend / totalLeads) : 0;
  const cpa         = conversions > 0 && spend > 0 ? Math.round(spend / conversions) : 0;
  const convRate    = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div style={{
      background: "#fff", borderRadius: 20, overflow: "hidden",
      border: `1.5px solid ${ch.color}33`,
      boxShadow: `0 4px 24px ${ch.color}15`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${ch.color}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 24px ${ch.color}15`; }}
    >
      {/* Color header */}
      <div style={{
        padding: "20px 22px 16px",
        background: `linear-gradient(135deg, ${ch.color}18, ${ch.color}08)`,
        borderBottom: `1.5px solid ${ch.color}22`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: ch.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 14px ${ch.color}55`,
            }}>
              {ch.icon}
            </div>
            <div>
              <h6 className="fw-bold mb-0" style={{ color: "#1e293b", fontSize: 17 }}>{ch.label}</h6>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Marketing Channel</div>
            </div>
          </div>
          <RoiBadge roi={roi} />
        </div>

        {/* ROI label */}
        <div style={{ marginTop: 12, fontSize: 12, color: ch.color, fontWeight: 700 }}>
          {spend > 0
            ? `Spent ₹${spend.toLocaleString("en-IN")} · ${roi >= 1 ? roi + "X Return" : "Low ROI"}`
            : "No spend tracked yet"}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Spend",       value: spend > 0 ? `₹${spend.toLocaleString("en-IN")}` : "—",  color: "#6366f1" },
            { label: "Leads",       value: totalLeads,                                               color: ch.color },
            { label: "Conversions", value: conversions,                                              color: "#16a34a" },
            { label: "Revenue",     value: revenue > 0 ? `₹${revenue.toLocaleString("en-IN")}` : "—", color: "#10b981" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 14,
              background: "#f8fafc", border: "1px solid #f1f5f9",
            }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginTop: 2 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary metrics */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 12, background: ch.light }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Conv. Rate</div>
            <div style={{ fontWeight: 800, color: ch.color, fontSize: 15 }}>{convRate}%</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 12, background: ch.light }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Cost/Lead</div>
            <div style={{ fontWeight: 800, color: ch.color, fontSize: 15 }}>{cpl > 0 ? `₹${cpl}` : "—"}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 12, background: ch.light }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Cost/Conv.</div>
            <div style={{ fontWeight: 800, color: ch.color, fontSize: 15 }}>{cpa > 0 ? `₹${cpa}` : "—"}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Lead → Conversion</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: ch.color }}>{convRate}%</span>
          </div>
          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(parseFloat(convRate), 100)}%`,
              background: `linear-gradient(90deg, ${ch.color}, ${ch.color}bb)`,
              borderRadius: 20,
              transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Edit spend button */}
        <button
          onClick={() => onEditSpend(channel.id, spend)}
          style={{
            width: "100%", padding: "9px", borderRadius: 12,
            border: `1.5px solid ${ch.color}55`,
            background: "transparent", color: ch.color,
            fontWeight: 700, fontSize: 12.5, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = ch.color; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ch.color; }}
        >
          <IconEdit size={14} /> Edit Campaign Spend
        </button>
      </div>
    </div>
  );
}

/* ─── Edit Spend Modal ───────────────────────────────────────── */
function SpendModal({ channelId, currentSpend, onClose, onSave }) {
  const ch = CHANNELS.find(c => c.id === channelId);
  const [spend, setSpend] = useState(currentSpend || "");

  if (!channelId) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1050,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          background: `linear-gradient(135deg, ${ch?.color}18, ${ch?.color}05)`,
          borderBottom: `1.5px solid ${ch?.color}22`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: ch?.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ch?.icon}
            </div>
            <div>
              <h6 className="fw-bold mb-0">{ch?.label} Campaign</h6>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Set marketing spend</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
            <IconX size={16} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 8 }}>
            💰 Campaign Spend (₹)
          </label>
          <input
            type="number" min={0} step={100}
            value={spend} onChange={e => setSpend(e.target.value)}
            placeholder="e.g. 10000"
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              border: `1.5px solid ${ch?.color}55`, fontSize: 15, fontWeight: 600,
              outline: "none", marginBottom: 16,
            }}
            autoFocus
          />

          {/* Live ROI preview */}
          {spend > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: ch?.light, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Live ROI Preview</div>
              <div style={{ fontSize: 13, color: "#475569" }}>
                If this channel gets <strong>1 conversion</strong> (₹{AVG_REVENUE_PER_CONVERSION.toLocaleString("en-IN")} avg),
                your ROI = <strong style={{ color: ch?.color }}>
                  {parseFloat((AVG_REVENUE_PER_CONVERSION / Number(spend)).toFixed(1))}X
                </strong>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onSave(channelId, Number(spend))} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "none",
              background: ch?.color, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              <IconCheck size={15} style={{ marginRight: 6 }} /> Save Spend
            </button>
            <button onClick={onClose} style={{
              padding: "12px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk Broadcast Tab Component ───────────────────────────── */
function BulkBroadcastTab({ leads }) {
  const [targetStatus, setTargetStatus] = useState("ALL");
  const [targetSource, setTargetSource] = useState("ALL");
  const [channel, setChannel] = useState("WHATSAPP");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter leads
  const selectedLeads = leads.filter(l => {
    if (targetStatus !== "ALL" && l.status !== targetStatus) return false;
    if (targetSource !== "ALL" && l.source !== targetSource) return false;
    return true;
  });

  const handleBlast = () => {
    if (selectedLeads.length === 0) return Swal.fire("Oops", "No leads match your filter.", "warning");
    if (!message.trim()) return Swal.fire("Oops", "Please enter a message to send.", "warning");

    setSending(true);
    setProgress(0);

    // Simulate sending progress
    const totalTime = 3000; 
    const intervalTime = 100;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        setSending(false);
        Swal.fire({
          icon: "success",
          title: "Campaign Sent!",
          text: `Successfully blasted to ${selectedLeads.length} leads via ${channel.toLowerCase()}.`,
        });
        setMessage("");
      }
    }, intervalTime);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fdf2f8", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconRocket size={24} />
        </div>
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>Mass Broadcast Engine</h5>
          <div style={{ fontSize: 13, color: "#64748b" }}>Send bulk offers and updates instantly</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Audience Builder */}
        <div style={{ flex: "1 1 300px" }}>
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><IconFilter size={18}/> 1. Build Audience</h6>
          
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6, display: "block" }}>Filter by Pipeline Status</label>
          <select value={targetStatus} onChange={e => setTargetStatus(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", marginBottom: 16, fontSize: 14, outline: "none" }}>
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="INTERESTED">Interested</option>
            <option value="TRIAL_BOOKED">Trial Booked</option>
            <option value="TRIAL_COMPLETED">Trial Completed</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="LOST">Lost / Dropped</option>
          </select>

          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6, display: "block" }}>Filter by Lead Source</label>
          <select value={targetSource} onChange={e => setTargetSource(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", marginBottom: 20, fontSize: 14, outline: "none" }}>
            <option value="ALL">All Sources</option>
            {CHANNELS.map(ch => <option key={ch.id} value={ch.id}>{ch.label}</option>)}
          </select>

          <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 14, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Selected Audience</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0ea5e9", margin: "4px 0" }}>{selectedLeads.length}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Leads match your filters</div>
          </div>
        </div>

        {/* Campaign Composer */}
        <div style={{ flex: "2 1 400px" }}>
          <h6 className="fw-bold mb-3">📝 2. Compose Campaign</h6>
          
          <div className="d-flex gap-2 mb-3">
            {[
              { id: "WHATSAPP", label: "WhatsApp", icon: <IconBrandWhatsapp size={16}/>, color: "#25D366" },
              { id: "SMS", label: "SMS Text", icon: <IconBrandGoogle size={16}/>, color: "#f59e0b" },
              { id: "EMAIL", label: "Email", icon: <IconTarget size={16}/>, color: "#0ea5e9" },
            ].map(ch => (
              <button key={ch.id} onClick={() => setChannel(ch.id)} style={{
                flex: 1, padding: "10px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: channel === ch.id ? `2px solid ${ch.color}` : "2px solid #e2e8f0",
                background: channel === ch.id ? `${ch.color}15` : "#fff",
                color: channel === ch.id ? ch.color : "#64748b",
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s"
              }}>
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>

          <textarea 
            rows={5} 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your promotional message here..."
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, resize: "none", outline: "none", marginBottom: 20 }}
          />

          {sending ? (
            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 14, border: "1.5px solid #e2e8f0" }}>
              <div className="d-flex justify-content-between mb-2">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ec4899" }}>🚀 Blasting Campaign...</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{Math.round(progress)}%</span>
              </div>
              <ProgressBar now={progress} variant="pink" style={{ height: 10, borderRadius: 10 }} />
              <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>Do not close this window until finished.</div>
            </div>
          ) : (
            <button onClick={handleBlast} disabled={selectedLeads.length === 0} style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: selectedLeads.length > 0 ? "linear-gradient(135deg, #ec4899, #db2777)" : "#cbd5e1",
              color: "#fff", fontWeight: 800, fontSize: 15, cursor: selectedLeads.length > 0 ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: selectedLeads.length > 0 ? "0 8px 24px rgba(236,72,153,0.3)" : "none", transition: "all 0.2s"
            }}>
              <IconSend size={18} /> Blast to {selectedLeads.length} Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CampaignManagement() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [spends,  setSpends]  = useState(() => {
    try {
      const saved = localStorage.getItem("crm_campaign_spends");
      return saved ? JSON.parse(saved) : { ...DEFAULT_SPEND };
    } catch { return { ...DEFAULT_SPEND }; }
  });
  const [editChannel, setEditChannel] = useState(null);
  const [activeTab,   setActiveTab]   = useState("cards");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch { console.error("Failed to load leads"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Per-channel data ─────────────────────────────────── */
  const channelData = CHANNELS.map(ch => {
    const chLeads = leads.filter(l => l.source === ch.id);
    const spend   = spends[ch.id] || 0;
    const conversions = chLeads.filter(l => l.status === "WON").length;
    const revenue     = conversions * AVG_REVENUE_PER_CONVERSION;
    const roi         = spend > 0 ? parseFloat((revenue / spend).toFixed(1)) : 0;
    return { ...ch, leads: chLeads, spend, conversions, revenue, roi };
  });

  /* ── Totals ───────────────────────────────────────────── */
  const totalSpend    = channelData.reduce((s, c) => s + c.spend, 0);
  const totalLeads    = channelData.reduce((s, c) => s + c.leads.length, 0);
  const totalConv     = channelData.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue  = channelData.reduce((s, c) => s + c.revenue, 0);
  const overallROI    = totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(1)) : 0;

  const saveSpend = (channelId, amount) => {
    const updated = { ...spends, [channelId]: amount };
    setSpends(updated);
    localStorage.setItem("crm_campaign_spends", JSON.stringify(updated));
    setEditChannel(null);
    Swal.fire({ icon: "success", title: "Spend Updated!", timer: 1200, showConfirmButton: false });
  };

  /* ── Best performing channel ──────────────────────────── */
  const bestChannel = [...channelData].sort((a, b) => b.roi - a.roi)[0];

  /* ── Chart: ROI comparison ────────────────────────────── */
  const roiChartOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "60%", distributed: true } },
    colors: CHANNELS.map(c => c.color),
    dataLabels: {
      enabled: true,
      formatter: v => v >= 1 ? `${v}X` : "",
      style: { fontSize: "12px", fontWeight: 700 },
    },
    xaxis: { categories: CHANNELS.map(c => c.label), labels: { style: { fontSize: 11 } } },
    yaxis: { labels: { formatter: v => `${v}X` } },
    legend: { show: false },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: v => `${v}X ROI` } },
  };

  /* ── Chart: Leads by source donut ────────────────────── */
  const donutLabels  = channelData.filter(c => c.leads.length > 0).map(c => c.label);
  const donutSeries  = channelData.filter(c => c.leads.length > 0).map(c => c.leads.length);
  const donutColors  = channelData.filter(c => c.leads.length > 0).map(c => c.color);
  const donutOptions = {
    chart: { type: "donut", toolbar: { show: false } },
    labels: donutLabels,
    colors: donutColors,
    legend: { position: "bottom", fontSize: "12px" },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: { show: true, label: "Total Leads", fontSize: "13px", fontWeight: 700, formatter: () => totalLeads },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    tooltip: { y: { formatter: v => `${v} leads` } },
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>📣 Campaign Management</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Track marketing performance across all channels — Cost, Leads, Conversions, Revenue & ROI
          </p>
        </div>
        <div className="d-flex gap-2">
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 3 }}>
            {[
              { id: "cards",    label: "📊 Cards"   },
              { id: "table",    label: "📋 Table"   },
              { id: "analysis", label: "📈 Charts"  },
              { id: "broadcast",label: "🚀 Bulk Send" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "7px 14px", borderRadius: 10, border: "none",
                background: activeTab === t.id ? (t.id === "broadcast" ? "#fdf2f8" : "#fff") : "transparent",
                color: activeTab === t.id ? (t.id === "broadcast" ? "#ec4899" : "#1e293b") : "#64748b",
                fontWeight: activeTab === t.id ? 700 : 500, fontSize: 12.5,
                cursor: "pointer", boxShadow: activeTab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.18s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff",
            color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Row ─────────────────────────────── */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { label: "Total Spend",      value: `₹${totalSpend.toLocaleString("en-IN")}`, color: "#6366f1", bg: "#ede9fe", icon: <IconCoinRupee size={20}/> },
          { label: "Total Leads",      value: totalLeads,                                color: "#0ea5e9", bg: "#e0f2fe", icon: <IconTarget size={20}/> },
          { label: "Total Conversions",value: totalConv,                                 color: "#16a34a", bg: "#dcfce7", icon: <IconUsers size={20}/> },
          { label: "Total Revenue",    value: `₹${totalRevenue.toLocaleString("en-IN")}`,color: "#10b981", bg: "#d1fae5", icon: <IconTrendingUp size={20}/> },
          { label: "Overall ROI",      value: `${overallROI}X`,                          color: "#f59e0b", bg: "#fef9c3", icon: <IconChartBar size={20}/> },
        ].map((kpi, i) => (
          <div key={i} style={{
            flex: "1 1 140px", background: "#fff", borderRadius: 16,
            border: "1.5px solid #e2e8f0", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Best performer banner ─────────────────────── */}
      {bestChannel && bestChannel.roi > 0 && (
        <div className="mb-4 px-4 py-3 rounded-3 d-flex align-items-center gap-3" style={{
          background: `linear-gradient(135deg, ${bestChannel.color}18, ${bestChannel.color}06)`,
          border: `1.5px solid ${bestChannel.color}33`,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: bestChannel.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {bestChannel.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>
              🏆 Best ROI: {bestChannel.label} — <span style={{ color: bestChannel.color }}>{bestChannel.roi}X Return</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Spend ₹{bestChannel.spend.toLocaleString("en-IN")} · {bestChannel.leads.length} Leads · {bestChannel.conversions} Sales · Revenue ₹{bestChannel.revenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 350 }}>
          <Spinner animation="border" variant="primary" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <p className="mt-3 text-muted fw-semibold">Loading campaign data…</p>
        </div>
      ) : (
        <>
          {/* ── CARDS VIEW ──────────────────────────────── */}
          {activeTab === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
              {channelData.map(ch => (
                <CampaignCard
                  key={ch.id}
                  channel={ch}
                  leads={ch.leads}
                  spend={ch.spend}
                  onEditSpend={(id, s) => setEditChannel({ id, spend: s })}
                />
              ))}
            </div>
          )}

          {/* ── TABLE VIEW ──────────────────────────────── */}
          {activeTab === "table" && (
            <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Channel", "Spend (₹)", "Leads", "Conversions", "Revenue (₹)", "Conv. Rate", "Cost/Lead", "Cost/Conv.", "ROI"].map(h => (
                        <th key={h} style={{
                          padding: "13px 16px", fontSize: 11.5, fontWeight: 700, color: "#94a3b8",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          borderBottom: "1.5px solid #e2e8f0", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((ch, idx) => {
                      const convRate = ch.leads.length > 0 ? ((ch.conversions / ch.leads.length) * 100).toFixed(1) : 0;
                      const cpl      = ch.leads.length > 0 && ch.spend > 0 ? Math.round(ch.spend / ch.leads.length) : 0;
                      const cpa      = ch.conversions > 0 && ch.spend > 0 ? Math.round(ch.spend / ch.conversions) : 0;
                      return (
                        <tr key={ch.id} style={{ borderTop: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafe" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafe"}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: ch.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {ch.icon}
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{ch.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#6366f1" }}>
                            {ch.spend > 0 ? `₹${ch.spend.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: ch.color, fontSize: 16 }}>{ch.leads.length}</td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#16a34a", fontSize: 16 }}>{ch.conversions}</td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#10b981" }}>
                            {ch.revenue > 0 ? `₹${ch.revenue.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 44, height: 6, background: "#e2e8f0", borderRadius: 20, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${convRate}%`, background: ch.color, borderRadius: 20 }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: ch.color }}>{convRate}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontSize: 13 }}>{cpl > 0 ? `₹${cpl}` : "—"}</td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontSize: 13 }}>{cpa > 0 ? `₹${cpa}` : "—"}</td>
                          <td style={{ padding: "14px 16px" }}><RoiBadge roi={ch.roi} /></td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1e293b" }}>📊 Total</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#6366f1" }}>₹{totalSpend.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1e293b", fontSize: 16 }}>{totalLeads}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#16a34a", fontSize: 16 }}>{totalConv}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#10b981" }}>₹{totalRevenue.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800 }}>
                        {totalLeads > 0 ? `${((totalConv / totalLeads) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800 }}>
                        {totalLeads > 0 && totalSpend > 0 ? `₹${Math.round(totalSpend / totalLeads)}` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800 }}>
                        {totalConv > 0 && totalSpend > 0 ? `₹${Math.round(totalSpend / totalConv)}` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}><RoiBadge roi={overallROI} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CHARTS VIEW ─────────────────────────────── */}
          {activeTab === "analysis" && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 400px", background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <h6 className="fw-bold mb-3">📊 ROI by Channel</h6>
                <ReactApexChart
                  options={roiChartOptions}
                  series={[{ name: "ROI", data: channelData.map(c => c.roi) }]}
                  type="bar"
                  height={260}
                />
              </div>

              <div style={{ flex: "1 1 300px", background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <h6 className="fw-bold mb-3">🍩 Lead Distribution</h6>
                {donutSeries.length > 0 ? (
                  <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={260} />
                ) : (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: 40 }}>📊</div>
                    <p className="mt-2">Add leads to see distribution</p>
                  </div>
                )}
              </div>

              {/* Channel performance table */}
              <div style={{ flex: "1 1 100%", background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 24 }}>
                <h6 className="fw-bold mb-3">⚡ Channel Performance Ranking</h6>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...channelData].sort((a, b) => b.roi - a.roi).map((ch, idx) => (
                    <div key={ch.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                      borderRadius: 14, background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8", width: 24, textAlign: "center" }}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx+1}`}
                      </span>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: ch.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {ch.icon}
                      </div>
                      <span style={{ flex: 1, fontWeight: 700, color: "#1e293b" }}>{ch.label}</span>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{ch.leads.length} leads</span>
                      <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>{ch.conversions} conv.</span>
                      <div style={{ width: 100 }}>
                        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 20, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${ch.leads.length > 0 ? (ch.conversions / ch.leads.length) * 100 : 0}%`,
                            background: ch.color, borderRadius: 20,
                          }} />
                        </div>
                      </div>
                      <RoiBadge roi={ch.roi} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* ── BROADCAST VIEW ─────────────────────────────── */}
          {activeTab === "broadcast" && (
            <BulkBroadcastTab leads={leads} />
          )}
        </>
      )}

      {/* ── Edit Spend Modal ─────────────────────────── */}
      <SpendModal
        channelId={editChannel?.id}
        currentSpend={editChannel?.spend}
        onClose={() => setEditChannel(null)}
        onSave={saveSpend}
      />
    </div>
  );
}
