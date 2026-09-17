import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import {
  IconPhone, IconBrandWhatsapp, IconMail, IconWalk,
  IconCalendarEvent, IconCheck, IconClockExclamation,
  IconCalendarPlus, IconRefresh, IconAlertTriangle,
  IconCircleCheck, IconSend, IconX, IconMessageCircle,
  IconClock
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeads, updateLead } from "../../api/leadsApi";

/* ─── Helpers ────────────────────────────────────────────────── */
const now = new Date();

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const todayStart = startOfDay(now);
const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
const tomorrowEnd   = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

const isOverdue   = (l) => l.nextFollowUp && new Date(l.nextFollowUp) < todayStart && l.status !== "WON" && l.status !== "LOST" && l.status !== "ARCHIVED";
const isToday     = (l) => { if (!l.nextFollowUp) return false; const d = startOfDay(new Date(l.nextFollowUp)); return d.getTime() === todayStart.getTime(); };
const isTomorrow  = (l) => { if (!l.nextFollowUp) return false; const d = startOfDay(new Date(l.nextFollowUp)); return d >= tomorrowStart && d < tomorrowEnd; };
const isCompleted = (l) => ["WON","LOST","ARCHIVED"].includes(l.status);

const FOLLOW_UP_TYPES = [
  { id:"CALL",           label:"Call",           icon:<IconPhone size={16}/>,            color:"#6366f1", bg:"#ede9fe" },
  { id:"WHATSAPP",       label:"WhatsApp",       icon:<IconBrandWhatsapp size={16}/>,    color:"#16a34a", bg:"#dcfce7" },
  { id:"SMS",            label:"SMS",            icon:<IconMessageCircle size={16}/>,    color:"#8b5cf6", bg:"#f3e8ff" },
  { id:"EMAIL",          label:"Email",          icon:<IconMail size={16}/>,             color:"#0ea5e9", bg:"#e0f2fe" },
  { id:"VISIT",          label:"Visit",          icon:<IconWalk size={16}/>,             color:"#f59e0b", bg:"#fef9c3" },
  { id:"TRIAL_REMINDER", label:"Trial Reminder", icon:<IconCalendarEvent size={16}/>,    color:"#ec4899", bg:"#fce7f3" },
];

const STATUS_COLOR = {
  NEW:"#6366f1", CONTACTED:"#f59e0b", INTERESTED:"#0ea5e9",
  TRIAL_BOOKED:"#8b5cf6", TRIAL_COMPLETED:"#10b981",
  NEGOTIATION:"#ec4899", WON:"#16a34a", LOST:"#ef4444", ARCHIVED:"#94a3b8",
};

/* ─── Sidebar Tab ─────────────────────────────────────────────── */
function TabBtn({ icon, label, count, active, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10,
      width:"100%", padding:"11px 14px", marginBottom:4,
      background: active ? accent : "transparent",
      color: active ? "#fff" : "#64748b",
      border:"none", borderRadius:12, cursor:"pointer",
      fontWeight: active ? 700 : 500, fontSize:13.5,
      transition:"all 0.18s",
    }}>
      {icon}
      <span style={{flex:1, textAlign:"left"}}>{label}</span>
      {count !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.28)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
          borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700,
        }}>{count}</span>
      )}
    </button>
  );
}

/* ─── Follow-up Type Chip ─────────────────────────────────────── */
function TypeChip({ type }) {
  const t = FOLLOW_UP_TYPES.find(f => f.id === type) || FOLLOW_UP_TYPES[0];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      background: t.bg, color: t.color, fontSize:11, fontWeight:700,
    }}>
      {t.icon} {t.label}
    </span>
  );
}

/* ─── Follow-up Action Modal (inline panel) ──────────────────── */
function ActionPanel({ lead, onClose, onDone }) {
  const [type, setType]     = useState("CALL");
  const [note, setNote]     = useState("");
  const [next, setNext]     = useState("");
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!note.trim()) { Swal.fire("Required", "Please enter a follow-up note", "warning"); return; }
    setSaving(true);
    try {
      const timestamp = new Date().toLocaleString("en-IN");
      const updatedNotes = `${lead.notes || ""}\n[${timestamp}] ${type}: ${note}`;
      await updateLead(lead.id, {
        ...lead,
        status,
        notes: updatedNotes,
        nextFollowUp: next || null,
        conversionProbability: type === "CALL" || type === "VISIT"
          ? Math.min((lead.conversionProbability || 50) + 5, 95)
          : lead.conversionProbability,
      });
      Swal.fire({ icon:"success", title:"Follow-up Logged!", text:`${type} recorded for ${lead.name}`, timer:1500, showConfirmButton:false });
      onDone();
      onClose();
    } catch { Swal.fire("Error","Failed to save","error"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background:"#f8fafc", borderRadius:14, border:"1.5px solid #e2e8f0",
      padding:16, marginTop:10, marginBottom:4,
    }}>
      <div style={{fontWeight:700, fontSize:13, color:"#1e293b", marginBottom:12}}>📝 Log Follow-up Action</div>

      {/* Type selector */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {FOLLOW_UP_TYPES.map(f => (
          <button key={f.id} onClick={() => setType(f.id)} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"7px 14px", borderRadius:10,
            border:`2px solid ${type === f.id ? f.color : "#e2e8f0"}`,
            background: type === f.id ? f.bg : "#fff",
            color: type === f.id ? f.color : "#64748b",
            fontWeight:700, fontSize:12, cursor:"pointer", transition:"all 0.15s",
          }}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Note */}
      <textarea rows={2} placeholder={`What happened on this ${type.replace("_"," ")}?`}
        value={note} onChange={e => setNote(e.target.value)}
        style={{width:"100%", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"10px 12px", fontSize:13, resize:"none", outline:"none", marginBottom:10}}
      />

      <div className="d-flex gap-3 mb-3">
        {/* Next follow-up */}
        <div style={{flex:1}}>
          <label style={{fontSize:12, fontWeight:600, color:"#94a3b8", display:"block", marginBottom:4}}>📅 Schedule Next Follow-up</label>
          <input type="datetime-local" value={next} onChange={e => setNext(e.target.value)}
            style={{width:"100%", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"8px 12px", fontSize:13, outline:"none"}}
          />
        </div>
        {/* Update status */}
        <div style={{flex:1}}>
          <label style={{fontSize:12, fontWeight:600, color:"#94a3b8", display:"block", marginBottom:4}}>🔁 Update Lead Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{width:"100%", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"8px 12px", fontSize:13, outline:"none"}}>
            {["NEW","CONTACTED","INTERESTED","TRIAL_BOOKED","TRIAL_COMPLETED","NEGOTIATION","WON","LOST"].map(s => (
              <option key={s} value={s}>{s.replace(/_/g," ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button onClick={submit} disabled={saving} style={{
          flex:1, padding:"10px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
          color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
        }}>
          {saving ? "Saving…" : <><IconSend size={14}/> Log Follow-up</>}
        </button>
        <button onClick={onClose} style={{
          padding:"10px 16px", borderRadius:12,
          border:"1.5px solid #e2e8f0", background:"#fff",
          color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
        }}><IconX size={14}/></button>
      </div>
    </div>
  );
}

/* ─── Single Lead Follow-up Card ──────────────────────────────── */
function FollowUpCard({ lead, onRefresh, overdue = false }) {
  const [open, setOpen] = useState(false);

  const sc = STATUS_COLOR[lead.status] || "#94a3b8";
  const prob = lead.conversionProbability || 50;
  const probColor = prob >= 70 ? "#16a34a" : prob >= 40 ? "#f59e0b" : "#ef4444";

  // Parse last follow-up type from notes
  const lastNote = lead.notes?.split("\n").filter(Boolean).slice(-1)[0] || "";
  const lastType = FOLLOW_UP_TYPES.find(f => lastNote.includes(f.id))?.id;

  const quickAction = async (type) => {
    // Open the communication channel before asking to log it!
    if (type === "WHATSAPP") {
      window.open(`https://wa.me/${lead.phone}`, '_blank');
    } else if (type === "SMS") {
      window.open(`sms:${lead.phone}`, '_self');
    } else if (type === "EMAIL" && lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    } else if (type === "CALL") {
      window.open(`tel:${lead.phone}`, '_self');
    }

    const { value: note } = await Swal.fire({
      title: `${type} – ${lead.name}`,
      input: "textarea",
      inputPlaceholder: `Describe what happened on this ${type.replace("_"," ")}…`,
      showCancelButton: true,
      confirmButtonText: "Log It",
    });
    if (!note) return;
    try {
      const ts = new Date().toLocaleString("en-IN");
      await updateLead(lead.id, {
        ...lead,
        notes: `${lead.notes || ""}\n[${ts}] ${type}: ${note}`,
        status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      });
      Swal.fire({ icon:"success", title:"Logged!", timer:1200, showConfirmButton:false });
      onRefresh();
    } catch { Swal.fire("Error","Failed","error"); }
  };

  return (
    <div style={{
      background:"#fff", borderRadius:18,
      border: overdue ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
      overflow:"hidden", marginBottom:12,
      boxShadow: overdue ? "0 2px 12px #ef444420" : "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        height:4,
        background: overdue
          ? "linear-gradient(90deg,#ef4444,#f87171)"
          : `linear-gradient(90deg,${sc},${sc}99)`,
      }}/>

      <div className="p-4">
        {/* Header row */}
        <div className="d-flex align-items-start gap-3 mb-3">
          {/* Avatar */}
          <div style={{
            width:46, height:46, borderRadius:14, flexShrink:0,
            background: overdue ? "#ef4444" : sc,
            color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:19, fontWeight:800,
          }}>
            {lead.name?.charAt(0)?.toUpperCase()}
          </div>

          {/* Info */}
          <div style={{flex:1, minWidth:0}}>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fw-bold" style={{fontSize:15, color:"#1e293b"}}>{lead.name}</span>
              {overdue && (
                <span style={{padding:"2px 8px", borderRadius:20, background:"#fee2e2", color:"#ef4444", fontSize:11, fontWeight:700}}>
                  <IconAlertTriangle size={11}/> Overdue
                </span>
              )}
              <span style={{padding:"2px 8px", borderRadius:20, background: sc + "20", color:sc, fontSize:11, fontWeight:700}}>
                {lead.status?.replace(/_/g," ")}
              </span>
            </div>
            <div className="d-flex flex-wrap gap-3 mt-1" style={{fontSize:12, color:"#64748b"}}>
              <span><IconPhone size={12}/> {lead.phone}</span>
              {lead.fitnessGoal && <span>🎯 {lead.fitnessGoal}</span>}
              {lead.preferredTime && <span>⏰ {lead.preferredTime}</span>}
            </div>
          </div>

          {/* Conversion prob */}
          <div style={{textAlign:"center", padding:"8px 12px", borderRadius:12, background: probColor + "15", border:`1.5px solid ${probColor}33`, flexShrink:0}}>
            <div className="fw-bold" style={{fontSize:17, color:probColor}}>{prob}%</div>
            <div style={{fontSize:10, color:probColor, fontWeight:600}}>Conv.</div>
          </div>
        </div>

        {/* Next Follow-up date */}
        {lead.nextFollowUp && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 mb-3 rounded-3" style={{
            background: overdue ? "#fee2e2" : "#f8fafc",
            border: `1.5px solid ${overdue ? "#fca5a5" : "#e2e8f0"}`,
            fontSize:13,
          }}>
            <IconClock size={15} color={overdue ? "#ef4444" : "#94a3b8"}/>
            <span style={{color: overdue ? "#ef4444" : "#475569", fontWeight:600}}>
              {overdue ? "Was due: " : "Scheduled: "}
              {new Date(lead.nextFollowUp).toLocaleString("en-IN", {dateStyle:"medium", timeStyle:"short"})}
            </span>
          </div>
        )}

        {/* Last note */}
        {lastNote && (
          <div style={{
            background:"#f8fafc", borderRadius:10, padding:"8px 14px",
            fontSize:12, color:"#64748b", marginBottom:12,
            border:"1px solid #f1f5f9",
          }}>
            <span className="fw-semibold" style={{color:"#475569"}}>📝 Last: </span>
            {lastNote.length > 100 ? lastNote.slice(0, 100) + "…" : lastNote}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="d-flex flex-wrap gap-2 mb-2">
          {FOLLOW_UP_TYPES.map(f => (
            <button key={f.id} onClick={() => quickAction(f.id)} style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"7px 13px", borderRadius:10,
              border:`1.5px solid ${f.color}55`,
              background: f.bg, color: f.color,
              fontWeight:700, fontSize:12, cursor:"pointer", transition:"all 0.15s",
            }}>
              {f.icon} {f.label}
            </button>
          ))}

          <button onClick={() => setOpen(v => !v)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"7px 14px", borderRadius:10,
            border:"1.5px solid #6366f1",
            background: open ? "#6366f1" : "#fff",
            color: open ? "#fff" : "#6366f1",
            fontWeight:700, fontSize:12, cursor:"pointer", marginLeft:"auto",
          }}>
            <IconCalendarPlus size={14}/> {open ? "Close" : "Full Log"}
          </button>
        </div>

        {/* Full log panel */}
        {open && (
          <ActionPanel lead={lead} onClose={() => setOpen(false)} onDone={onRefresh} />
        )}
      </div>
    </div>
  );
}

/* ─── Batch Action Bar ────────────────────────────────────────── */
function BatchBar({ count, type, color, bg, onSend }) {
  return count > 0 ? (
    <div className="d-flex align-items-center justify-content-between px-4 py-3 mb-4 rounded-3" style={{background:bg, border:`1.5px solid ${color}44`}}>
      <span style={{fontWeight:700, fontSize:13.5, color}}>
        {count} leads pending {type} outreach
      </span>
      <button onClick={onSend} style={{
        padding:"9px 20px", borderRadius:12, border:"none",
        background:color, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
      }}>
        <IconSend size={14} style={{marginRight:6}}/> Send All {type}s
      </button>
    </div>
  ) : null;
}

/* ─── Empty State ─────────────────────────────────────────────── */
function Empty({ emoji, message }) {
  return (
    <div style={{background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:48, textAlign:"center"}}>
      <div style={{fontSize:56}}>{emoji}</div>
      <p className="mt-3 fw-semibold" style={{fontSize:15, color:"#94a3b8"}}>{message}</p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function FollowupCalendar() {
  const [tab, setTab]       = useState("today");
  const [leads, setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch { console.error("Failed to load leads"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  /* ── Categorise ─────────────────────────────────────────── */
  const activeLeads = leads.filter(l => !["WON","LOST","ARCHIVED"].includes(l.status));

  // Helper to check if notes include a timestamp from today
  const todayStr = new Date().toLocaleDateString("en-IN");
  const contactedToday = (l) => l.notes && (l.notes.includes(`[${todayStr}`) || l.notes.includes(todayStr));

  const todaysCalls   = leads.filter(l => isToday(l) && !contactedToday(l));
  const tomorrowLeads = leads.filter(isTomorrow);
  const overdueLeads  = leads.filter(l => isOverdue(l) && !contactedToday(l));
  const completedLeads = leads.filter(isCompleted);

  // Queues: leads with no nextFollowUp set yet (needs outreach)
  const whatsappQueue = activeLeads.filter(l => !l.nextFollowUp && l.status === "NEW" && !contactedToday(l));
  const smsQueue      = activeLeads.filter(l => !l.nextFollowUp && l.status === "CONTACTED" && !contactedToday(l));
  const emailQueue    = activeLeads.filter(l => !l.nextFollowUp && l.status === "INTERESTED" && !contactedToday(l));

  const TABS = [
    { id:"today",     label:"Today's Calls",    icon:<IconPhone size={18}/>,           count:todaysCalls.length,   accent:"#6366f1" },
    { id:"tomorrow",  label:"Tomorrow",          icon:<IconCalendarEvent size={18}/>,   count:tomorrowLeads.length, accent:"#0ea5e9" },
    { id:"overdue",   label:"Overdue",           icon:<IconClockExclamation size={18}/>,count:overdueLeads.length,  accent:"#ef4444" },
    { id:"whatsapp",  label:"WhatsApp Queue",    icon:<IconBrandWhatsapp size={18}/>,   count:whatsappQueue.length, accent:"#16a34a" },
    { id:"sms",       label:"SMS Queue",         icon:<IconMessageCircle size={18}/>,   count:smsQueue.length,      accent:"#8b5cf6" },
    { id:"email",     label:"Email Queue",       icon:<IconMail size={18}/>,            count:emailQueue.length,    accent:"#f59e0b" },
    { id:"completed", label:"Completed",         icon:<IconCircleCheck size={18}/>,     count:completedLeads.length,accent:"#10b981" },
  ];

  const activeTabMeta = TABS.find(t => t.id === tab);
  const accentHex     = activeTabMeta?.accent || "#6366f1";

  const currentItems = {
    today:    todaysCalls,
    tomorrow: tomorrowLeads,
    overdue:  overdueLeads,
    whatsapp: whatsappQueue,
    sms:      smsQueue,
    email:    emailQueue,
    completed:completedLeads,
  }[tab] || [];

  const handleBatchSend = (type) => {
    Swal.fire({
      icon:"info",
      title:`Bulk ${type} — Coming Soon`,
      text:`Bulk ${type} integration is planned for Phase 3 (Automation module). Individual quick-actions are available on each card.`,
    });
  };

  /* ── Stats summary ──────────────────────────────────────── */
  const totalPending = todaysCalls.length + overdueLeads.length;
  const convRate = leads.length > 0
    ? ((leads.filter(l => l.status === "WON").length / leads.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="themebody-wrap">
      <div className="theme-body" style={{display:"flex", gap:20, minHeight:"70vh"}}>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div style={{
        width:235, flexShrink:0, background:"#fff",
        borderRadius:18, border:"1.5px solid #e2e8f0",
        padding:16, alignSelf:"flex-start",
        position:"sticky", top:0,
      }}>
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{fontSize:14, color:"#1e293b"}}>📅 Follow-up Calendar</div>
          <div className="text-muted" style={{fontSize:11}}>Track & action every lead follow-up</div>
        </div>

        {TABS.map(t => (
          <TabBtn key={t.id} icon={t.icon} label={t.label} count={t.count}
            active={tab === t.id} onClick={() => setTab(t.id)} accent={t.accent} />
        ))}

        <div className="mt-3 pt-3" style={{borderTop:"1px solid #f1f5f9"}}>
          <button onClick={loadLeads} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"9px", borderRadius:12, border:"1.5px solid #e2e8f0",
            background:"#f8fafc", color:"#64748b", fontSize:12, cursor:"pointer",
          }}>
            <IconRefresh size={14}/> Refresh
          </button>
        </div>

        {/* Priority KPIs */}
        <div className="mt-3 p-3 rounded-3" style={{background:"linear-gradient(135deg,#ef4444,#f97316)"}}>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600}}>URGENT TODAY</div>
          <div style={{fontSize:28, fontWeight:800, color:"#fff"}}>{totalPending}</div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.65)"}}>
            {todaysCalls.length} today · {overdueLeads.length} overdue
          </div>
        </div>

        <div className="mt-2 p-3 rounded-3" style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600}}>CONVERSION RATE</div>
          <div style={{fontSize:28, fontWeight:800, color:"#fff"}}>{convRate}%</div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.65)"}}>Leads to Members</div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div style={{flex:1, minWidth:0}}>

        {/* Page header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{
            width:52, height:52, borderRadius:16,
            background: accentHex + "20", color:accentHex,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            {activeTabMeta?.icon}
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{color:"#1e293b"}}>{activeTabMeta?.label}</h5>
            <p className="text-muted mb-0" style={{fontSize:13}}>
              {currentItems.length} leads · Every follow-up: Call · WhatsApp · Email · Visit · Trial Reminder
            </p>
          </div>

          {/* Legend chips */}
          <div className="ms-auto d-flex flex-wrap gap-2">
            {FOLLOW_UP_TYPES.map(f => (
              <span key={f.id} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"4px 11px", borderRadius:20,
                background:f.bg, color:f.color, fontSize:11, fontWeight:600,
              }}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Batch action bar for queue tabs */}
        {tab === "whatsapp" && (
          <BatchBar count={whatsappQueue.length} type="WhatsApp" color="#16a34a" bg="#dcfce7" onSend={() => handleBatchSend("WhatsApp")}/>
        )}
        {tab === "sms" && (
          <BatchBar count={smsQueue.length} type="SMS" color="#8b5cf6" bg="#f3e8ff" onSend={() => handleBatchSend("SMS")}/>
        )}
        {tab === "email" && (
          <BatchBar count={emailQueue.length} type="Email" color="#f59e0b" bg="#fef9c3" onSend={() => handleBatchSend("Email")}/>
        )}

        {/* Today's time slots view */}
        {tab === "today" && todaysCalls.length > 0 && (
          <div className="mb-4 px-4 py-3 rounded-3 d-flex align-items-center gap-3" style={{background:"#ede9fe", border:"1.5px solid #c4b5fd"}}>
            <IconPhone size={22} color="#6366f1"/>
            <div>
              <div className="fw-bold" style={{color:"#6366f1", fontSize:14}}>{todaysCalls.length} calls scheduled for today</div>
              <div style={{fontSize:12, color:"#7c3aed"}}>Work through them in order — each card below has quick-dial buttons</div>
            </div>
          </div>
        )}

        {/* Overdue warning */}
        {tab === "overdue" && overdueLeads.length > 0 && (
          <div className="mb-4 px-4 py-3 rounded-3 d-flex align-items-center gap-3" style={{background:"#fee2e2", border:"1.5px solid #fca5a5"}}>
            <IconAlertTriangle size={22} color="#ef4444"/>
            <div>
              <div className="fw-bold" style={{color:"#ef4444", fontSize:14}}>{overdueLeads.length} overdue follow-ups need immediate attention!</div>
              <div style={{fontSize:12, color:"#dc2626"}}>These leads missed their scheduled contact window. Risk of losing them is high.</div>
            </div>
          </div>
        )}

        {/* Lead Cards */}
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight:300}}>
            <Spinner animation="border" variant="primary" style={{width:44, height:44, borderWidth:4}}/>
            <p className="mt-3 text-muted fw-semibold">Loading follow-ups…</p>
          </div>
        ) : currentItems.length === 0 ? (
          <Empty
            emoji={tab==="today" ? "📞" : tab==="tomorrow" ? "📅" : tab==="overdue" ? "⏰" : tab==="whatsapp" ? "💬" : tab==="sms" ? "📱" : tab==="email" ? "📧" : "✅"}
            message={
              tab==="today"     ? "No calls scheduled for today. Set follow-up dates in Lead Inbox." :
              tab==="tomorrow"  ? "Nothing scheduled for tomorrow. Plan your day from Lead Inbox." :
              tab==="overdue"   ? "No overdue follow-ups! 🎉 Great job staying on top of your leads." :
              tab==="whatsapp"  ? "No new leads pending WhatsApp outreach." :
              tab==="sms"       ? "No contacted leads pending SMS follow-up." :
              tab==="email"     ? "No interested leads pending Email outreach." :
              "No completed leads yet. Keep pushing!"
            }
          />
        ) : (
          <div>
            {currentItems.map(lead => (
              <FollowUpCard
                key={lead.id}
                lead={lead}
                onRefresh={loadLeads}
                overdue={tab === "overdue"}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
