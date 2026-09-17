import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import {
  IconUser, IconHistory, IconNote, IconActivity, IconCalendarEvent,
  IconReceipt, IconCreditCard, IconFileText, IconChecklist,
  IconArrowLeft, IconPhone, IconBrandWhatsapp, IconMail, IconEdit,
  IconClock, IconPlus, IconCheck, IconDownload, IconUpload,
  IconSparkles, IconTrendingUp, IconMessageChatbot, IconPhoneCall, IconWand
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeads, generateAiReply, updateLead } from "../../api/leadsApi";
import { uploadLeadDocument, getLeadDocuments, getDocumentDownloadUrl } from "../../api/leadDocumentsApi";

/* ─── Mock Data for Demo ────────────────────────────────────── */
// We simulate the 360 view data since the backend Lead entity doesn't have all these nested collections natively.
const MOCK_TIMELINE = [
  { id: 1, date: "2026-06-22 10:30 AM", title: "Lead Created", type: "system", desc: "Added via Walk-in Register" },
  { id: 2, date: "2026-06-22 11:15 AM", title: "Welcome WhatsApp Sent", type: "whatsapp", desc: "Automated greeting sent." },
  { id: 3, date: "2026-06-23 09:00 AM", title: "Follow-up Call", type: "call", desc: "Discussed fitness goals. Interested in weight loss." },
  { id: 4, date: "2026-06-23 09:15 AM", title: "Trial Booked", type: "event", desc: "Trial scheduled for 2026-06-24 07:00 AM." },
];

const MOCK_NOTES = [
  { id: 1, date: "2026-06-23 09:05 AM", author: "Rahul (Counselor)", text: "Very enthusiastic. Has previous lower back injury, mentioned to assign a careful trainer." },
];

const MOCK_ACTIVITIES = [
  { id: 1, type: "CALL", date: "2026-06-23 09:00 AM", details: "Outbound Call - Answered (3m 12s)" },
  { id: 2, type: "WHATSAPP", date: "2026-06-22 11:15 AM", details: "Template: Welcome Message" },
];

const MOCK_TASKS = [
  { id: 1, title: "Send diet plan brochure", due: "2026-06-24", status: "PENDING" },
  { id: 2, title: "Confirm trial attendance", due: "2026-06-23", status: "COMPLETED" },
];

/* ─── Shared UI ─────────────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px", marginBottom:4,
      background: active ? "#6366f1" : "transparent",
      color: active ? "#fff" : "#64748b",
      border:"none", borderRadius:12, cursor:"pointer",
      fontWeight: active ? 700 : 500, fontSize:13.5, transition:"all 0.18s",
    }}>
      {icon}
      <span style={{ flex:1, textAlign:"left" }}>{label}</span>
    </button>
  );
}

/* ─── Content Panels ────────────────────────────────────────── */
function OverviewPanel({ lead }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>👤 Personal Info</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Phone</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{lead.phone}</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Email</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{lead.email || "—"}</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Source</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{lead.source}</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Created At</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{new Date(lead.createdAt).toLocaleDateString()}</div></div>
        </div>
      </div>
      <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>🎯 Fitness Profile</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Fitness Goal</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{lead.fitnessGoal || "—"}</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Experience</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>{lead.fitnessExperience || "Beginner"}</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>Preferred Time</div><div style={{ fontWeight:600, fontSize:14, color:"#1e293b" }}>Morning</div></div>
          <div><div style={{ fontSize:11.5, color:"#94a3b8" }}>AI Score</div><div style={{ fontWeight:800, fontSize:14, color:"#f59e0b" }}>{lead.score || 85}%</div></div>
        </div>
      </div>
    </div>
  );
}

function TimelinePanel() {
  return (
    <div style={{ paddingLeft:20, position:"relative" }}>
      <div style={{ position:"absolute", left:26, top:10, bottom:10, width:2, background:"#e2e8f0" }}/>
      {MOCK_TIMELINE.map((evt, i) => (
        <div key={evt.id} style={{ position:"relative", marginBottom: i<MOCK_TIMELINE.length-1 ? 24 : 0 }}>
          <div style={{ position:"absolute", left:-11, top:4, width:14, height:14, borderRadius:"50%", background:"#fff", border:"3px solid #6366f1", zIndex:2 }}/>
          <div style={{ marginLeft:24, background:"#f8fafc", borderRadius:12, padding:"14px 16px", border:"1px solid #f1f5f9" }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontWeight:700, color:"#1e293b", fontSize:14 }}>{evt.title}</span>
              <span style={{ fontSize:11.5, color:"#94a3b8" }}>{evt.date}</span>
            </div>
            <div style={{ fontSize:13, color:"#64748b" }}>{evt.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPanel() {
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [text, setText] = useState("");

  const addNote = () => {
    if(!text.trim()) return;
    setNotes([{ id:Date.now(), date: new Date().toLocaleString(), author:"Admin", text }, ...notes]);
    setText("");
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <textarea className="form-control" rows={3} placeholder="Write a note about this lead..." value={text} onChange={e=>setText(e.target.value)} style={{ borderRadius:12, resize:"none", fontSize:13 }}/>
        <div className="text-end mt-2">
          <button onClick={addNote} style={{ background:"#6366f1", color:"#fff", border:"none", padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:600 }}>Add Note</button>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {notes.map(n => (
          <div key={n.id} style={{ background:"#fcfcfc", border:"1px solid #e2e8f0", borderRadius:12, padding:14 }}>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ fontWeight:700, fontSize:12, color:"#6366f1" }}>{n.author}</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>{n.date}</span>
            </div>
            <div style={{ fontSize:13, color:"#475569" }}>{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrialSessionPanel({ lead, onRefresh }) {
  const isBooked = ["TRIAL_BOOKED","TRIAL_COMPLETED"].includes(lead.status);

  const handleSchedule = async () => {
    const { value: dateStr } = await Swal.fire({
      title: 'Schedule Trial',
      html: '<input type="datetime-local" id="swal-input1" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => document.getElementById('swal-input1').value
    });

    if (dateStr) {
      try {
        Swal.fire({ title: "Saving...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await updateLead(lead.id, {
          ...lead,
          status: "TRIAL_BOOKED",
          trialDate: new Date(dateStr).toISOString()
        });
        Swal.fire("Scheduled!", "Trial has been booked.", "success");
        if (onRefresh) onRefresh();
      } catch {
        Swal.fire("Error", "Failed to schedule trial.", "error");
      }
    }
  };

  return (
    <div>
      {isBooked ? (
        <div style={{ background:"#fff", border:"1.5px solid #8b5cf655", borderRadius:16, padding:24, boxShadow:"0 4px 20px #8b5cf615" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="fw-bold mb-0" style={{ color:"#8b5cf6" }}>🏋️ Free Trial Session</h6>
            <span style={{ background:"#ede9fe", color:"#8b5cf6", padding:"4px 12px", borderRadius:20, fontSize:11.5, fontWeight:700 }}>
              {lead.status === "TRIAL_COMPLETED" ? "COMPLETED" : "SCHEDULED"}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={{ background:"#f8fafc", padding:12, borderRadius:12 }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Date & Time</div>
              <div style={{ fontSize:14, fontWeight:700 }}>
                {lead.trialDate ? new Date(lead.trialDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Pending"}
              </div>
            </div>
            <div style={{ background:"#f8fafc", padding:12, borderRadius:12 }}><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Assigned Trainer</div><div style={{ fontSize:14, fontWeight:700 }}>{lead.notes?.match(/Trainer: (.+)/)?.[1]?.split("\n")[0] || "Pending"}</div></div>
            <div style={{ background:"#f8fafc", padding:12, borderRadius:12 }}><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Focus Area</div><div style={{ fontSize:14, fontWeight:700 }}>{lead.fitnessGoal || "Weight Loss"}</div></div>
            <div style={{ background:"#f8fafc", padding:12, borderRadius:12 }}><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Feedback</div><div style={{ fontSize:14, fontWeight:700, color:"#f59e0b" }}>{lead.notes?.includes("⭐ Rating:") ? "Received" : "Pending"}</div></div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:40, background:"#f8fafc", borderRadius:16, border:"1.5px dashed #cbd5e1" }}>
          <IconCalendarEvent size={40} color="#94a3b8" />
          <h6 className="fw-bold mt-3 text-muted">No Trial Booked</h6>
          <button onClick={handleSchedule} style={{ marginTop:10, background:"#8b5cf6", color:"#fff", border:"none", padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:600 }}>Schedule Trial</button>
        </div>
      )}
    </div>
  );
}

function QuotePanel() {
  return (
    <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:20 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">📄 Membership Quotes</h6>
        <button style={{ background:"#f8fafc", color:"#6366f1", border:"1px solid #e2e8f0", padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600 }}><IconPlus size={14}/> Create Quote</button>
      </div>
      <div style={{ background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:12, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14 }}>Annual Premium Plan</div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>Sent on 2026-06-23 · Valid for 7 days</div>
        </div>
        <div className="text-end">
          <div style={{ fontSize:16, fontWeight:800, color:"#10b981" }}>₹14,999</div>
          <span style={{ fontSize:10, background:"#fef9c3", color:"#f59e0b", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>NEGOTIATING</span>
        </div>
      </div>
    </div>
  );
}

function AiInsightsPanel({ lead }) {
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      const generatedText = await generateAiReply(lead.id);
      setDraft(generatedText);
    } catch (err) {
      Swal.fire("Error", "Failed to generate AI reply.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = () => {
    if (!draft) return Swal.fire("Oops", "Please generate a draft first.", "warning");
    Swal.fire({
      title: 'Sending...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    setTimeout(() => {
      Swal.fire("Sent!", "Message sent to WhatsApp successfully.", "success");
    }, 800);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Metrics Row */}
      <div className="d-flex gap-3 flex-wrap">
        <div style={{ flex:1, background:"linear-gradient(135deg, #f8fafc, #f1f5f9)", border:"1px solid #e2e8f0", borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>LEAD SCORE</span>
            <IconTrendingUp size={16} color="#10b981"/>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"#10b981" }}>{lead.leadScore || 85}<span style={{ fontSize:14, color:"#94a3b8" }}>/100</span></div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Highly engaged recently</div>
        </div>
        <div style={{ flex:1, background:"linear-gradient(135deg, #f8fafc, #f1f5f9)", border:"1px solid #e2e8f0", borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>CONVERSION PROBABILITY</span>
            <IconSparkles size={16} color="#8b5cf6"/>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"#8b5cf6" }}>{lead.conversionProbability || 65}%</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Based on demographic similarity</div>
        </div>
        <div style={{ flex:1, background:"linear-gradient(135deg, #f8fafc, #f1f5f9)", border:"1px solid #e2e8f0", borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>BEST FOLLOW-UP TIME</span>
            <IconPhoneCall size={16} color="#0ea5e9"/>
          </div>
          <div style={{ fontSize:24, fontWeight:800, color:"#0ea5e9", marginTop:4 }}>06:30 PM</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Historical 85% answer rate</div>
        </div>
      </div>

      {/* AI Suggestions & Summaries */}
      <div className="d-flex gap-3 flex-wrap">
        <div style={{ flex:2, background:"#fff", border:"1px solid #fcd34d", borderRadius:16, overflow:"hidden" }}>
          <div style={{ background:"#fef3c7", padding:"12px 16px", fontWeight:700, color:"#d97706", display:"flex", gap:8, alignItems:"center", fontSize:13 }}>
            <IconWand size={16}/> AI Sales Suggestions
          </div>
          <div style={{ padding:16, fontSize:13, color:"#475569", lineHeight:1.6 }}>
            <ul className="mb-0 ps-3">
              <li className="mb-2">Lead mentioned back pain previously. Recommend <strong>Yoga</strong> or <strong>Personal Training</strong> instead of heavy lifting.</li>
              <li className="mb-2">They typically respond to WhatsApp within 10 minutes. Prefer text over calls.</li>
              <li>Hesitant on price. Mention the upcoming <em>Summer Flash Sale</em>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Comm Drafts */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden" }}>
        <div style={{ background:"#f8fafc", padding:"12px 16px", fontWeight:700, color:"#1e293b", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, borderBottom:"1px solid #e2e8f0" }}>
          <div className="d-flex align-items-center gap-2">
            <IconMessageChatbot size={16} className="text-success"/> AI WhatsApp Reply Draft
          </div>
          <button onClick={handleGenerateDraft} disabled={generating} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
            <IconSparkles size={14} /> {generating ? "Generating..." : "Generate AI Draft"}
          </button>
        </div>
        <div style={{ padding:16 }}>
          <textarea 
            className="form-control mb-3" 
            rows={5} 
            style={{ fontSize:13, resize:"none" }} 
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Click 'Generate AI Draft' to create a custom contextual message for this lead..."
          />
          <div className="text-end">
            <button onClick={handleSend} className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-2">
              <IconBrandWhatsapp size={14}/> Send to WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      const found = data.find(l => l.id === Number(id));
      if (found) setLead(found);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary"/></div>;
  if (!lead) return <div className="p-5 text-center text-muted">Lead not found</div>;

  const STATUS_COLORS = {
    NEW: "#3b82f6", CONTACTED: "#f59e0b", TRIAL_BOOKED: "#8b5cf6",
    TRIAL_COMPLETED: "#6366f1", WON: "#10b981", LOST: "#ef4444"
  };
  const badgeColor = STATUS_COLORS[lead.status] || "#94a3b8";

  const TABS = [
    { id: "overview", label: "Overview", icon: <IconUser size={18}/> },
    { id: "ai",       label: "AI Insights", icon: <IconSparkles size={18} color="#f59e0b"/> },
    { id: "timeline", label: "Timeline", icon: <IconHistory size={18}/> },
    { id: "notes",    label: "Notes",    icon: <IconNote size={18}/> },
    { id: "activities",label: "Activities",icon: <IconActivity size={18}/> },
    { id: "trial",    label: "Trial Session",icon: <IconCalendarEvent size={18}/> },
    { id: "quote",    label: "Membership Quote",icon: <IconReceipt size={18}/> },
    { id: "payments", label: "Payments", icon: <IconCreditCard size={18}/> },
    { id: "documents",label: "Documents",icon: <IconFileText size={18}/> },
    { id: "tasks",    label: "Tasks",    icon: <IconChecklist size={18}/> },
  ];

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ background:"#fff", padding:"24px 32px", borderRadius:20, border:"1.5px solid #e2e8f0", marginBottom:20 }}>
        <button onClick={() => navigate(-1)} style={{ background:"transparent", border:"none", color:"#64748b", display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, padding:0, marginBottom:16, cursor:"pointer" }}>
          <IconArrowLeft size={16}/> Back to CRM
        </button>
        
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-4">
            <div style={{ width:72, height:72, borderRadius:24, background:`${badgeColor}15`, color:badgeColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, border:`2px solid ${badgeColor}33` }}>
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="fw-bold mb-1 d-flex align-items-center gap-3">
                {lead.name}
                <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background:badgeColor, color:"#fff", fontWeight:700, letterSpacing:"0.05em" }}>
                  {lead.status.replace(/_/g," ")}
                </span>
              </h4>
              <div className="text-muted" style={{ fontSize:13.5, fontWeight:500 }}>
                {lead.phone} • {lead.email || "No Email"}
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <button style={{ width:40, height:40, borderRadius:12, background:"#f0fdf4", border:"1.5px solid #dcfce7", color:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }} title="Call"><IconPhone size={20}/></button>
            <button style={{ width:40, height:40, borderRadius:12, background:"#f0fdf4", border:"1.5px solid #dcfce7", color:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }} title="WhatsApp"><IconBrandWhatsapp size={20}/></button>
            <button style={{ width:40, height:40, borderRadius:12, background:"#e0f2fe", border:"1.5px solid #bae6fd", color:"#0ea5e9", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }} title="Email"><IconMail size={20}/></button>
            <button style={{ padding:"0 16px", borderRadius:12, background:"#f8fafc", border:"1.5px solid #e2e8f0", color:"#64748b", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}><IconEdit size={16}/> Edit Lead</button>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div style={{ display:"flex", gap:20 }}>
        {/* Sidebar Tabs */}
        <div style={{ width:240, flexShrink:0, background:"#fff", borderRadius:20, border:"1.5px solid #e2e8f0", padding:16, alignSelf:"flex-start", position:"sticky", top:20 }}>
          {TABS.map(t => <TabBtn key={t.id} icon={t.icon} label={t.label} active={tab===t.id} onClick={()=>setTab(t.id)} />)}
        </div>

        {/* Content Area */}
        <div style={{ flex:1, minWidth:0, background:"#fff", borderRadius:20, border:"1.5px solid #e2e8f0", padding:32, minHeight:500 }}>
          <h5 className="fw-bold mb-4 pb-3" style={{ borderBottom:"1px solid #f1f5f9", color:"#1e293b" }}>{TABS.find(t=>t.id===tab)?.label}</h5>
          
          {tab === "overview"   && <OverviewPanel lead={lead} />}
          {tab === "ai"         && <AiInsightsPanel lead={lead} />}
          {tab === "timeline"   && <TimelinePanel />}
          {tab === "notes"      && <NotesPanel />}
          {tab === "trial"      && <TrialSessionPanel lead={lead} onRefresh={fetchLead} />}
          {tab === "quote"      && <QuotePanel />}
          
          {/* Simple Placeholders for remaining requested tabs */}
          {tab === "activities" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {MOCK_ACTIVITIES.map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:16, padding:16, border:"1px solid #e2e8f0", borderRadius:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}>
                    {a.type === "CALL" ? <IconPhone size={20}/> : <IconBrandWhatsapp size={20}/>}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{a.details}</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>{a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {tab === "payments" && (
            <div className="text-center py-5 text-muted">
              <IconCreditCard size={48} className="mb-3 opacity-50"/>
              <h6>No Payments Recorded</h6>
              <p className="small">This lead has not made any payments yet.</p>
            </div>
          )}
          
          {tab === "documents" && (
            <DocumentVaultPanel lead={lead} />
          )}
          
          {tab === "tasks" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {MOCK_TASKS.map(t => (
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:16, padding:16, border:"1px solid #e2e8f0", borderRadius:12, background: t.status==="COMPLETED"?"#f8fafc":"#fff" }}>
                  <div style={{ width:24, height:24, borderRadius:6, border:`2px solid ${t.status==="COMPLETED"?"#16a34a":"#cbd5e1"}`, background: t.status==="COMPLETED"?"#16a34a":"transparent", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
                    {t.status==="COMPLETED" && <IconCheck size={16}/>}
                  </div>
                  <div style={{ flex:1, opacity: t.status==="COMPLETED"?0.6:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, textDecoration: t.status==="COMPLETED"?"line-through":"none" }}>{t.title}</div>
                    <div style={{ fontSize:11.5, color: t.status==="COMPLETED"?"#94a3b8":"#ef4444" }}>Due: {t.due}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function DocumentVaultPanel({ lead }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const docs = await getLeadDocuments(lead.id);
      setDocuments(docs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDocs();
  }, [lead.id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadLeadDocument(lead.id, file);
      Swal.fire({ icon: "success", title: "Uploaded", timer: 1200, showConfirmButton: false });
      fetchDocs();
    } catch (err) {
      Swal.fire("Error", "Failed to upload document", "error");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  const handleDownload = (doc) => {
    const url = getDocumentDownloadUrl(doc.id);
    window.open(url, "_blank");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h6 className="fw-bold mb-0">Document Vault</h6>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>Manage contracts and ID proofs for {lead.name}</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={uploading}
          style={{ background: "#6366f1", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
        >
          {uploading ? <Spinner size="sm"/> : <IconUpload size={16}/>}
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-5 text-muted" style={{ background: "#f8fafc", borderRadius: 16, border: "1.5px dashed #cbd5e1" }}>
          <IconUpload size={48} className="mb-3" color="#94a3b8"/>
          <h6 className="fw-bold text-dark">Document Vault Empty</h6>
          <p className="small">Upload ID proofs, PAR-Q forms, or signed contracts here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#e0f2fe", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCheck size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", wordBreak: "break-all" }}>{doc.fileName}</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                  Uploaded on {new Date(doc.uploadDate).toLocaleString()}
                </div>
              </div>
              <button 
                onClick={() => handleDownload(doc)}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
