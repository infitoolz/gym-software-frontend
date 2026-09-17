import React, { useState, useEffect, useCallback } from "react";
import { Spinner, Badge } from "react-bootstrap";
import {
  IconCalendarEvent, IconCalendarTime, IconCalendarX,
  IconTrophy, IconClockOff, IconRefresh, IconCheck, IconX,
  IconUser, IconPhone, IconTarget, IconStar, IconMessageCircle,
  IconChartBar, IconBrandWhatsapp, IconArrowRight
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeads, updateLead } from "../../api/leadsApi";
import { getTrainers } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";

/* ─── Helpers ───────────────────────────────────────────────── */
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const isToday     = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); };
const isFuture    = (d) => new Date(d) > tomorrow;
const isMissed    = (l) => l.status === "TRIAL_BOOKED" && l.trialDate && new Date(l.trialDate) < today;

const GOAL_EMOJI = { "Weight Loss":"🔥","Muscle Gain":"💪","Fitness":"🏃","Body Building":"🏋️","Yoga & Flex":"🧘","Sports Perf.":"⚽" };

const WORKOUT_PLANS = ["Full Body Intro", "Cardio Blast", "Upper Body Power", "Lower Body Strength", "Core & Flexibility", "HIIT Starter", "Yoga Basics", "Strength & Conditioning"];

const SCORE_COLOR = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#f59e0b" : "#ef4444";
const SCORE_BG    = (s) => s >= 75 ? "#dcfce7" : s >= 50 ? "#fef9c3" : "#fee2e2";

/* ─── Sidebar Tab ────────────────────────────────────────────── */
function TabBtn({ icon, label, count, active, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10,
      width:"100%", padding:"11px 14px", marginBottom:4,
      background: active ? accent || "#6366f1" : "transparent",
      color: active ? "#fff" : "#64748b",
      border:"none", borderRadius:12, cursor:"pointer",
      fontWeight: active ? 700 : 500, fontSize:13.5,
      transition:"all 0.18s",
    }}>
      {icon}
      <span style={{flex:1, textAlign:"left"}}>{label}</span>
      {count !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.25)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
          borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700,
        }}>{count}</span>
      )}
    </button>
  );
}

/* ─── Trial Card (shared) ─────────────────────────────────────── */
function TrialCard({ lead, trainers, onRefresh, accentHex, showActions = true }) {
  const [showWorkout, setShowWorkout]     = useState(false);
  const [showTrainer, setShowTrainer]     = useState(false);
  const [showFeedback, setShowFeedback]   = useState(false);
  const [feedback, setFeedback]           = useState("");
  const [rating, setRating]              = useState(0);
  const [saving, setSaving]              = useState(false);

  const prob = lead.conversionProbability || 50;
  const score = lead.leadScore || 60;

  const markAttendance = async (attended) => {
    setSaving(true);
    try {
      await updateLead(lead.id, {
        ...lead,
        status: attended ? "TRIAL_COMPLETED" : "LOST",
        notes: `${lead.notes || ""}\nTrial ${attended ? "Attended ✅" : "Missed ❌"} on ${new Date().toLocaleString()}`,
        conversionProbability: attended ? Math.min(prob + 15, 95) : Math.max(prob - 20, 5),
      });
      
      if (attended) {
        Swal.fire({
          icon: "success",
          title: "Trial Attended! 🎉",
          text: `Automated WhatsApp feedback request sent to ${lead.phone}`,
          timer: 2500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({ icon: "success", title: "Marked as Missed", timer: 1500, showConfirmButton: false });
      }
      
      onRefresh();
    } catch { Swal.fire("Error", "Failed to update", "error"); }
    finally { setSaving(false); }
  };

  const assignWorkout = async (plan) => {
    setSaving(true);
    try {
      await updateLead(lead.id, {
        ...lead,
        notes: `${lead.notes || ""}\n📋 Workout Assigned: ${plan} on ${new Date().toLocaleDateString()}`,
        conversionProbability: Math.min(prob + 5, 95),
      });
      setShowWorkout(false);
      Swal.fire({ icon: "success", title: "Workout Assigned!", text: plan, timer: 1500, showConfirmButton: false });
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  const assignTrainer = async (trainer) => {
    setSaving(true);
    try {
      await updateLead(lead.id, {
        ...lead,
        notes: `${lead.notes || ""}\n🏋️ Trainer: ${trainer.account?.name}`,
        conversionProbability: Math.min(prob + 8, 95),
      });
      setShowTrainer(false);
      Swal.fire({ icon: "success", title: "Trainer Assigned!", text: trainer.account?.name, timer: 1500, showConfirmButton: false });
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  const submitFeedback = async () => {
    if (!feedback.trim() || rating === 0) { Swal.fire("Required", "Please add rating and feedback", "warning"); return; }
    setSaving(true);
    try {
      await updateLead(lead.id, {
        ...lead,
        notes: `${lead.notes || ""}\n⭐ Rating: ${rating}/5 | Feedback: ${feedback} [${new Date().toLocaleDateString()}]`,
        conversionProbability: rating >= 4 ? Math.min(prob + 20, 95) : rating >= 3 ? Math.min(prob + 10, 95) : prob,
      });
      setShowFeedback(false); setFeedback(""); setRating(0);
      Swal.fire({ icon: "success", title: "Feedback Saved!", timer: 1500, showConfirmButton: false });
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div style={{
      background:"#fff", borderRadius:18,
      border: `1.5px solid ${accentHex}33`,
      overflow:"hidden", marginBottom:16,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
    }}>
      {/* Top bar */}
      <div style={{ height:4, background: `linear-gradient(90deg, ${accentHex}, ${accentHex}99)` }} />

      <div className="p-4">
        {/* Row 1 — identity */}
        <div className="d-flex align-items-start gap-3 mb-4">
          <div style={{
            width:52, height:52, borderRadius:16,
            background: accentHex, color:"#fff", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, fontWeight:800,
          }}>{lead.name?.charAt(0)?.toUpperCase()}</div>

          <div style={{flex:1, minWidth:0}}>
            <div className="fw-bold" style={{fontSize:16, color:"#1e293b"}}>{lead.name}</div>
            <div className="d-flex flex-wrap gap-2 mt-1">
              <span style={{fontSize:12, color:"#64748b"}}><IconPhone size={12} className="me-1"/>{lead.phone}</span>
              {lead.age && <span style={{fontSize:12, color:"#64748b"}}>· {lead.age} yrs · {lead.gender}</span>}
              {lead.preferredTime && (
                <span style={{fontSize:11, padding:"2px 8px", borderRadius:20, background:"#ede9fe", color:"#6366f1", fontWeight:600}}>
                  ⏰ {lead.preferredTime}
                </span>
              )}
            </div>
          </div>

          {/* AI Lead Score */}
          <div style={{
            textAlign:"center", padding:"8px 14px", borderRadius:14,
            background: SCORE_BG(score), border:`1.5px solid ${SCORE_COLOR(score)}33`,
          }}>
            <div className="fw-bold" style={{fontSize:20, color: SCORE_COLOR(score)}}>{score}</div>
            <div style={{fontSize:10, color: SCORE_COLOR(score), fontWeight:600}}>AI Score</div>
          </div>
        </div>

        {/* Row 2 — 5 Feature Tiles */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {/* Fitness Goal */}
          <div style={{flex:"1 1 130px", padding:"10px 14px", borderRadius:12, background:"#f8fafc", border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em"}}>🎯 Fitness Goal</div>
            <div style={{fontWeight:700, fontSize:13, marginTop:4, color:"#1e293b"}}>
              {GOAL_EMOJI[lead.fitnessGoal] || "🏃"} {lead.fitnessGoal || "General Fitness"}
            </div>
          </div>

          {/* Workout Assigned */}
          <div
            onClick={() => showActions && setShowWorkout(v => !v)}
            style={{
              flex:"1 1 130px", padding:"10px 14px", borderRadius:12,
              background: showWorkout ? accentHex : "#f8fafc",
              border:`1.5px solid ${showWorkout ? accentHex : "#e2e8f0"}`,
              cursor: showActions ? "pointer" : "default",
              transition:"all 0.18s",
            }}
          >
            <div style={{fontSize:10, color: showWorkout ? "rgba(255,255,255,0.7)" : "#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em"}}>
              📋 Workout
            </div>
            <div style={{fontWeight:700, fontSize:13, marginTop:4, color: showWorkout ? "#fff" : "#1e293b"}}>
              {lead.notes?.match(/Workout Assigned: (.+)/)?.[1]?.split("\n")[0] || "Tap to Assign"}
            </div>
          </div>

          {/* Trainer Assigned */}
          <div
            onClick={() => showActions && setShowTrainer(v => !v)}
            style={{
              flex:"1 1 130px", padding:"10px 14px", borderRadius:12,
              background: showTrainer ? "#8b5cf6" : "#f8fafc",
              border:`1.5px solid ${showTrainer ? "#8b5cf6" : "#e2e8f0"}`,
              cursor: showActions ? "pointer" : "default",
              transition:"all 0.18s",
            }}
          >
            <div style={{fontSize:10, color: showTrainer ? "rgba(255,255,255,0.7)" : "#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em"}}>
              🏋️ Trainer
            </div>
            <div style={{fontWeight:700, fontSize:13, marginTop:4, color: showTrainer ? "#fff" : "#1e293b"}}>
              {lead.notes?.match(/Trainer: (.+)/)?.[1]?.split("\n")[0] || "Tap to Assign"}
            </div>
          </div>

          {/* Attendance */}
          <div style={{flex:"1 1 130px", padding:"10px 14px", borderRadius:12, background:"#f8fafc", border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em"}}>✅ Attendance</div>
            <div style={{fontWeight:700, fontSize:13, marginTop:4}}>
              {lead.status === "TRIAL_COMPLETED"
                ? <span style={{color:"#16a34a"}}>✅ Attended</span>
                : lead.status === "LOST"
                ? <span style={{color:"#ef4444"}}>❌ Missed</span>
                : <span style={{color:"#f59e0b"}}>⏳ Pending</span>}
            </div>
          </div>

          {/* Conversion Probability */}
          <div style={{flex:"1 1 130px", padding:"10px 14px", borderRadius:12, background:"#f8fafc", border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em"}}>📈 Conv. Prob.</div>
            <div style={{marginTop:6}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{flex:1, height:6, borderRadius:20, background:"#e2e8f0", overflow:"hidden"}}>
                  <div style={{
                    height:"100%", width:`${prob}%`,
                    background: SCORE_COLOR(prob),
                    borderRadius:20, transition:"width 0.5s ease",
                  }}/>
                </div>
                <span style={{fontSize:13, fontWeight:800, color: SCORE_COLOR(prob)}}>{prob}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable: Workout Plan picker */}
        {showWorkout && (
          <div style={{background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0"}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:10, color:"#1e293b"}}>📋 Select Workout Plan</div>
            <div className="d-flex flex-wrap gap-2">
              {WORKOUT_PLANS.map(wp => (
                <button key={wp} onClick={() => assignWorkout(wp)} disabled={saving} style={{
                  padding:"7px 14px", borderRadius:10, border:"1.5px solid #6366f1",
                  background:"#fff", color:"#6366f1", fontWeight:600, fontSize:12,
                  cursor:"pointer", transition:"all 0.15s",
                }}>
                  {wp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expandable: Trainer picker */}
        {showTrainer && (
          <div style={{background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0"}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:10, color:"#1e293b"}}>🏋️ Select Trainer</div>
            {trainers.length === 0 ? (
              <p className="text-muted small">No trainers available. Add trainers in Staff Management.</p>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {trainers.map(t => (
                  <button key={t.account?.id} onClick={() => assignTrainer(t)} disabled={saving} style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"8px 14px", borderRadius:10, border:"1.5px solid #8b5cf6",
                    background:"#fff", color:"#8b5cf6", fontWeight:600, fontSize:12,
                    cursor:"pointer",
                  }}>
                    <div style={{width:24, height:24, borderRadius:8, background:"#8b5cf6", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700}}>
                      {t.account?.name?.charAt(0)}
                    </div>
                    {t.account?.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expandable: Feedback form */}
        {showFeedback && (
          <div style={{background:"#fffbeb", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #fde68a"}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:10, color:"#1e293b"}}>⭐ Trial Feedback</div>
            <div className="d-flex gap-2 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{
                  width:36, height:36, borderRadius:10, border:"1.5px solid #fde68a",
                  background: rating >= s ? "#f59e0b" : "#fff",
                  color: rating >= s ? "#fff" : "#94a3b8",
                  fontSize:18, cursor:"pointer", fontWeight:700,
                }}>★</button>
              ))}
              {rating > 0 && <span style={{fontSize:13, color:"#f59e0b", fontWeight:700, alignSelf:"center"}}>{rating}/5</span>}
            </div>
            <textarea
              rows={3} placeholder="How was the trial experience? Any suggestions?"
              value={feedback} onChange={e => setFeedback(e.target.value)}
              style={{width:"100%", borderRadius:10, border:"1.5px solid #e2e8f0", padding:"10px", fontSize:13, resize:"none", outline:"none"}}
            />
            <div className="d-flex gap-2 mt-2">
              <button onClick={submitFeedback} disabled={saving} style={{
                flex:1, padding:"9px", borderRadius:10, border:"none",
                background:"#f59e0b", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
              }}>
                {saving ? "Saving…" : "✅ Save Feedback"}
              </button>
              <button onClick={() => setShowFeedback(false)} style={{
                padding:"9px 16px", borderRadius:10, border:"1.5px solid #e2e8f0",
                background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Notes excerpt */}
        {lead.notes && (
          <div style={{background:"#f8fafc", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#64748b"}}>
            <span className="fw-bold">📝 Notes: </span>{lead.notes.split("\n").slice(-1)[0]}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="d-flex flex-wrap gap-2">
            {lead.status === "TRIAL_BOOKED" && (
              <>
                <button onClick={() => markAttendance(true)} disabled={saving} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                  borderRadius:12, border:"none", background:"#dcfce7", color:"#16a34a",
                  fontWeight:700, fontSize:13, cursor:"pointer",
                }}>
                  <IconCheck size={16} /> Mark Attended
                </button>
                <button onClick={() => markAttendance(false)} disabled={saving} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                  borderRadius:12, border:"none", background:"#fee2e2", color:"#ef4444",
                  fontWeight:700, fontSize:13, cursor:"pointer",
                }}>
                  <IconX size={16} /> Mark Missed
                </button>
              </>
            )}
            <button onClick={() => setShowFeedback(v => !v)} style={{
              display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
              borderRadius:12, border:"1.5px solid #fde68a", background:"#fffbeb",
              color:"#f59e0b", fontWeight:700, fontSize:13, cursor:"pointer",
            }}>
              <IconStar size={15} /> Feedback
            </button>
            <button onClick={() => Swal.fire("WhatsApp", `Send trial reminder to ${lead.phone}`, "info")} style={{
              display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
              borderRadius:12, border:"1.5px solid #dcfce7", background:"#f0fdf4",
              color:"#16a34a", fontWeight:700, fontSize:13, cursor:"pointer",
            }}>
              <IconBrandWhatsapp size={15} /> Remind
            </button>
            {lead.status === "TRIAL_COMPLETED" && (
              <button onClick={() => Swal.fire("Convert", `Convert ${lead.name} to member from the Lead Inbox.`, "info")} style={{
                display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
              }}>
                <IconArrowRight size={15} /> Convert to Member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────── */
function Empty({ emoji, message }) {
  return (
    <div className="text-center py-5" style={{ color: "#94a3b8" }}>
      <div style={{ fontSize: 56 }}>{emoji}</div>
      <p className="mt-3 fw-semibold" style={{ fontSize: 15 }}>{message}</p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function TrialMembers() {
  const { user } = useAuth();
  const [tab, setTab]           = useState("today");
  const [leads, setLeads]       = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, trainerList] = await Promise.all([
        getLeads(),
        getTrainers(user?.userId || user?.id),
      ]);
      setLeads(Array.isArray(data) ? data : []);
      setTrainers(trainerList || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Categorise ────────────────────────────────────────── */
  const allTrials = leads.filter(l =>
    ["TRIAL_BOOKED", "TRIAL_COMPLETED"].includes(l.status) || isMissed(l)
  );

  const todaysTrials    = leads.filter(l => l.status === "TRIAL_BOOKED" && l.trialDate && isToday(l.trialDate));
  const upcomingTrials  = leads.filter(l => l.status === "TRIAL_BOOKED" && l.trialDate && isFuture(l.trialDate));
  const missedTrials    = leads.filter(l => isMissed(l) || l.status === "LOST");
  const convertedTrials = leads.filter(l => l.status === "WON");
  const expiredTrials   = leads.filter(l => l.status === "TRIAL_COMPLETED" && !convertedTrials.find(c => c.id === l.id));
  // Fallback: if no trialDate set, show TRIAL_BOOKED in Today's tab
  const todaysFallback  = todaysTrials.length === 0
    ? leads.filter(l => l.status === "TRIAL_BOOKED")
    : todaysTrials;

  const TABS = [
    { id:"today",     label:"Today's Trial",   icon:<IconCalendarEvent size={18}/>, count: todaysFallback.length,  accent:"#6366f1" },
    { id:"upcoming",  label:"Upcoming Trial",   icon:<IconCalendarTime  size={18}/>, count: upcomingTrials.length,  accent:"#0ea5e9" },
    { id:"missed",    label:"Missed Trial",     icon:<IconCalendarX     size={18}/>, count: missedTrials.length,    accent:"#ef4444" },
    { id:"converted", label:"Converted",        icon:<IconTrophy        size={18}/>, count: convertedTrials.length, accent:"#16a34a" },
    { id:"expired",   label:"Expired Trial",    icon:<IconClockOff      size={18}/>, count: expiredTrials.length,   accent:"#94a3b8" },
  ];

  const activeTab   = TABS.find(t => t.id === tab);
  const accentHex   = activeTab?.accent || "#6366f1";

  /* ── Stats for header ──────────────────────────────────── */
  const convRate = allTrials.length > 0
    ? ((convertedTrials.length / allTrials.length) * 100).toFixed(1)
    : 0;

  const currentItems = {
    today:     todaysFallback,
    upcoming:  upcomingTrials,
    missed:    missedTrials,
    converted: convertedTrials,
    expired:   expiredTrials,
  }[tab] || [];

  return (
    <div className="themebody-wrap">
      <div className="theme-body" style={{ display:"flex", gap:20, minHeight:"70vh" }}>

      {/* ── Left sidebar ──────────────────────────────── */}
      <div style={{
        width:230, flexShrink:0,
        background:"#fff", borderRadius:18,
        border:"1.5px solid #e2e8f0",
        padding:16, alignSelf:"flex-start",
        position:"sticky", top:0,
      }}>
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{fontSize:14, color:"#1e293b"}}>🎟️ Trial Members</div>
          <div className="text-muted" style={{fontSize:11}}>Manage all trial sessions</div>
        </div>

        {TABS.map(t => (
          <TabBtn
            key={t.id}
            icon={t.icon}
            label={t.label}
            count={t.count}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
            accent={t.accent}
          />
        ))}

        <div className="mt-3 pt-3" style={{borderTop:"1px solid #f1f5f9"}}>
          <button onClick={loadAll} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"9px", borderRadius:12, border:"1.5px solid #e2e8f0",
            background:"#f8fafc", color:"#64748b", fontSize:12, cursor:"pointer",
          }}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>

        {/* Mini stats panel */}
        <div className="mt-3 p-3 rounded-3" style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, marginBottom:6}}>CONVERSION RATE</div>
          <div style={{fontSize:28, fontWeight:800, color:"#fff"}}>{convRate}%</div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.65)"}}>
            {convertedTrials.length} of {allTrials.length} trials converted
          </div>
        </div>
      </div>

      {/* ── Right content ─────────────────────────────── */}
      <div style={{flex:1, minWidth:0}}>

        {/* Page header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{
            width:52, height:52, borderRadius:16,
            background: accentHex + "20",
            display:"flex", alignItems:"center", justifyContent:"center",
            color: accentHex, flexShrink:0,
          }}>
            {activeTab?.icon}
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{color:"#1e293b"}}>{activeTab?.label}</h5>
            <p className="text-muted mb-0" style={{fontSize:13}}>
              {currentItems.length} records · Each trial gets Workout, Trainer, Attendance, Feedback & AI Score
            </p>
          </div>

          {/* KPI chips */}
          <div className="ms-auto d-flex flex-wrap gap-2">
            {[
              { label:"Today", count: todaysFallback.length, color:"#6366f1", bg:"#ede9fe" },
              { label:"Upcoming", count: upcomingTrials.length, color:"#0ea5e9", bg:"#e0f2fe" },
              { label:"Converted", count: convertedTrials.length, color:"#16a34a", bg:"#dcfce7" },
            ].map((kpi, i) => (
              <div key={i} style={{
                padding:"5px 12px", borderRadius:20,
                background: kpi.bg, color: kpi.color,
                fontSize:12, fontWeight:700,
              }}>
                {kpi.label}: {kpi.count}
              </div>
            ))}
          </div>
        </div>

        {/* Feature legend */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {[
            { label:"📋 Workout Assigned", color:"#6366f1", bg:"#ede9fe" },
            { label:"🏋️ Trainer Assigned", color:"#8b5cf6", bg:"#f3e8ff" },
            { label:"✅ Attendance",        color:"#16a34a", bg:"#dcfce7" },
            { label:"⭐ Feedback",          color:"#f59e0b", bg:"#fef9c3" },
            { label:"📈 Conv. Probability", color:"#0ea5e9", bg:"#e0f2fe" },
          ].map((f, i) => (
            <div key={i} style={{
              padding:"4px 12px", borderRadius:20,
              background: f.bg, color: f.color,
              fontSize:11.5, fontWeight:600,
            }}>{f.label}</div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight:300}}>
            <Spinner animation="border" variant="primary" style={{width:44, height:44, borderWidth:4}} />
            <p className="mt-3 text-muted fw-semibold">Loading trial members…</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div style={{background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:40}}>
            <Empty
              emoji={tab==="today" ? "📅" : tab==="upcoming" ? "⏳" : tab==="missed" ? "😔" : tab==="converted" ? "🏆" : "⌛"}
              message={
                tab==="today"     ? "No trials scheduled for today. Book from Lead Inbox → Trial Booked." :
                tab==="upcoming"  ? "No upcoming trials. Set a trial date in Lead Inbox." :
                tab==="missed"    ? "No missed trials! Great follow-up." :
                tab==="converted" ? "No conversions yet. Mark trial attended then convert from Lead Inbox." :
                "No expired trials."
              }
            />
          </div>
        ) : (
          <div>
            {currentItems.map(lead => (
              <TrialCard
                key={lead.id}
                lead={lead}
                trainers={trainers}
                onRefresh={loadAll}
                accentHex={accentHex}
                showActions={tab !== "converted" && tab !== "expired"}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
