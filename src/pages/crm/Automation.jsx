import React, { useState } from "react";
import {
  IconRobot, IconBrandWhatsapp, IconMail, IconMessage,
  IconCalendarEvent, IconGift, IconArrowRight, IconPlus,
  IconEdit, IconTrash, IconCheck, IconX, IconSettings,
  IconUsers, IconBolt, IconAlertTriangle, IconPlayerPlay
} from "@tabler/icons-react";
import Swal from "sweetalert2";

/* ─── Seed Data ─────────────────────────────────────────────── */
const DEFAULT_WORKFLOWS = [
  {
    id: 1, name: "New Lead Nurture Sequence", trigger: "Lead created", status: "ACTIVE", type: "WORKFLOW",
    steps: [
      { id: 101, action: "Send WhatsApp", delay: "Immediately", content: "Hi [Name], welcome to FitNexus! When would you like to visit us?" },
      { id: 102, action: "Send Reminder", delay: "24 hrs (if no reply)", content: "Just checking in, [Name]! Your free trial pass is ready." },
      { id: 103, action: "Assign to Manager", delay: "3 days (if no reply)", content: "Escalated for a personal call" },
      { id: 104, action: "Offer Trial Session", delay: "7 days (if no reply)", content: "Exclusive 3-day VIP trial pass inside 🎁" },
    ]
  },
  {
    id: 2, name: "Birthday & Anniversary Wishes", trigger: "On Date Match", status: "ACTIVE", type: "DATE_BASED",
    steps: [
      { id: 201, action: "Send WhatsApp", delay: "08:00 AM on Birthday", content: "Happy Birthday [Name]! 🎉 Treat yourself with 20% off PT sessions today!" },
    ]
  },
  {
    id: 3, name: "Membership Renewal Reminder", trigger: "7 days before expiry", status: "ACTIVE", type: "RENEWAL",
    steps: [
      { id: 301, action: "Send SMS", delay: "7 days before", content: "Your membership expires in 7 days! Renew now to lock in your rate." },
      { id: 302, action: "Send WhatsApp", delay: "1 day before", content: "Last day to renew, [Name]! Click here to pay online." },
    ]
  },
  {
    id: 4, name: "Win-back Campaign (Lost Leads)", trigger: "Lead status = LOST", status: "PAUSED", type: "WORKFLOW",
    steps: [
      { id: 401, action: "Send Email", delay: "30 days after lost", content: "We miss you! Here is a special 1-month offer." },
    ]
  },
];

const TEMPLATES = {
  WHATSAPP: [
    { id: 1, name: "Welcome Message", content: "Hi [Name], thanks for showing interest in FitNexus! 🏋️‍♂️ When can we schedule a tour for you?" },
    { id: 2, name: "Trial Reminder",  content: "Hey [Name], your trial session is booked for tomorrow at [Time]. See you soon!" },
    { id: 3, name: "Discount Offer",  content: "Flash Sale! Get 20% off an annual plan if you join before Friday, [Name]. Reply 'YES' to claim." },
  ],
  SMS: [
    { id: 4, name: "Payment Link",   content: "Dear [Name], complete your FitNexus payment here: [Link]. Amount: ₹[Amount]" },
    { id: 5, name: "Class Cancelled",content: "Update: The [Class] class today at [Time] is cancelled due to emergency. Apologies!" },
  ],
  EMAIL: [
    { id: 6, name: "Monthly Newsletter", content: "Subject: FitNexus Monthly Updates\n\nHi [Name], check out our new equipments..." },
    { id: 7, name: "Diet Plan Attached", content: "Subject: Your Custom Nutrition Plan\n\nHi [Name], [Trainer] has uploaded your diet plan. See attached." },
  ]
};

/* ─── Helper Components ─────────────────────────────────────── */
function SideTab({ icon, label, active, onClick, accent, badge }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px", marginBottom:4,
      background: active ? accent : "transparent", color: active ? "#fff" : "#64748b",
      border:"none", borderRadius:12, cursor:"pointer", fontWeight: active ? 700 : 500, fontSize:13.5, transition:"all 0.18s",
    }}>
      {icon}
      <span style={{ flex:1, textAlign:"left" }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: active ? "rgba(255,255,255,0.28)" : "#e2e8f0", color: active ? "#fff" : "#64748b", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{badge}</span>
      )}
    </button>
  );
}

function WorkflowVisualizer({ workflow }) {
  return (
    <div style={{ background:"#f8fafc", borderRadius:16, border:"1px solid #e2e8f0", padding:20, marginTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ padding:"6px 12px", borderRadius:8, background:"#e0f2fe", color:"#0ea5e9", fontSize:12, fontWeight:700 }}>
          ⚡ Trigger: {workflow.trigger}
        </div>
      </div>
      
      <div style={{ position:"relative", paddingLeft:24 }}>
        <div style={{ position:"absolute", left:0, top:10, bottom:10, width:2, background:"#cbd5e1" }} />
        
        {workflow.steps.map((step, i) => (
          <div key={step.id} style={{ position:"relative", marginBottom: i < workflow.steps.length - 1 ? 24 : 0 }}>
            {/* Dot */}
            <div style={{ position:"absolute", left:-30, top:6, width:14, height:14, borderRadius:"50%", background:"#fff", border:"3px solid #6366f1", zIndex:2 }} />
            
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"12px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontWeight:700, color:"#1e293b", fontSize:13 }}>{step.action}</span>
                <span style={{ fontSize:11, color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:12, fontWeight:600 }}>⏱️ {step.delay}</span>
              </div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>{step.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Workflows Tab ─────────────────────────────────────────── */
function WorkflowsTab({ workflows, toggleStatus }) {
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h6 className="fw-bold mb-0">⚡ Automated Workflows</h6>
          <p className="text-muted mb-0" style={{ fontSize:12 }}>Smart sequences that run on autopilot</p>
        </div>
        <button onClick={() => Swal.fire("Pro Feature","Custom workflow builder requires premium plan.","info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <IconPlus size={15}/> Create Workflow
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))", gap:20 }}>
        {workflows.map(wf => (
          <div key={wf.id} style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:20, display:"flex", flexDirection:"column" }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="fw-bold mb-0" style={{ color:"#1e293b", fontSize:15 }}>{wf.name}</h6>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10.5, fontWeight:700, background: wf.status==="ACTIVE"?"#dcfce7":"#f1f5f9", color: wf.status==="ACTIVE"?"#16a34a":"#64748b" }}>
                  {wf.status}
                </span>
                <button onClick={() => toggleStatus(wf.id)} style={{ padding:"4px 8px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", color: wf.status==="ACTIVE"?"#ef4444":"#16a34a", fontSize:12, fontWeight:600 }}>
                  {wf.status === "ACTIVE" ? "Pause" : "Enable"}
                </button>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <WorkflowVisualizer workflow={wf} />
            </div>
            <div className="d-flex gap-2 mt-3 pt-3" style={{ borderTop:"1px solid #f1f5f9" }}>
              <button style={{ flex:1, padding:"8px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}><IconEdit size={14}/> Edit Logic</button>
              <button style={{ flex:1, padding:"8px", borderRadius:10, border:"1.5px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:12, fontWeight:600, cursor:"pointer" }}><IconPlayerPlay size={14}/> Test Run</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Templates Tab ─────────────────────────────────────────── */
function TemplatesTab({ templates }) {
  const [activeType, setActiveType] = useState("WHATSAPP");
  
  const types = [
    { id: "WHATSAPP", label: "WhatsApp", icon: <IconBrandWhatsapp size={16}/>, color: "#16a34a" },
    { id: "SMS",      label: "SMS Text", icon: <IconMessage size={16}/>,       color: "#f59e0b" },
    { id: "EMAIL",    label: "Email",    icon: <IconMail size={16}/>,          color: "#0ea5e9" },
  ];

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">📝 Message Templates</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Standardized responses for manual and automated use</p>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)} style={{
            display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, cursor:"pointer",
            border: activeType === t.id ? `2px solid ${t.color}` : "2px solid transparent",
            background: activeType === t.id ? `${t.color}15` : "#fff",
            color: activeType === t.id ? t.color : "#64748b",
            fontWeight: activeType === t.id ? 700 : 600, fontSize:13,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}>
            {t.icon} {t.label} ({templates[t.id].length})
          </button>
        ))}
        <button className="ms-auto" style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:12, border:"1.5px dashed #cbd5e1", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
          <IconPlus size={15}/> Add Template
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
        {templates[activeType].map(tmpl => (
          <div key={tmpl.id} style={{ background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0", padding:20, position:"relative" }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:10 }}>{tmpl.name}</div>
            <div style={{ background:"#f8fafc", padding:14, borderRadius:12, fontSize:13, color:"#475569", lineHeight:1.6, whiteSpace:"pre-wrap", border:"1px solid #f1f5f9" }}>
              {tmpl.content}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#f1f5f9", color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>Edit</button>
              <button style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#fee2e2", color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Rules Tab ─────────────────────────────────────────────── */
function RulesTab() {
  const [rules, setRules] = useState([
    { id:1, name: "Auto Lead Assignment", desc: "Round-robin assign new leads to online counselors", enabled: true, icon: <IconUsers size={20}/>, color:"#8b5cf6" },
    { id:2, name: "Stale Lead Alert", desc: "Notify admin if lead not contacted in 48hrs", enabled: true, icon: <IconAlertTriangle size={20}/>, color:"#ef4444" },
    { id:3, name: "Daily Follow-up Digest", desc: "Email managers end-of-day summary", enabled: false, icon: <IconMail size={20}/>, color:"#0ea5e9" },
    { id:4, name: "Post-Trial Survey", desc: "Send feedback link 2 hours after trial complete", enabled: true, icon: <IconCheck size={20}/>, color:"#16a34a" },
  ]);

  const toggle = (id) => setRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">⚙️ Business Rules</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Background operations and system alerts</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{
            display:"flex", alignItems:"center", gap:16, padding:"20px",
            background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0",
          }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${rule.color}15`, color:rule.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {rule.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{rule.name}</div>
              <div style={{ fontSize:12.5, color:"#64748b", marginTop:2 }}>{rule.desc}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12, fontWeight:700, color: rule.enabled ? "#16a34a" : "#94a3b8" }}>{rule.enabled ? "Enabled" : "Disabled"}</span>
              <div onClick={() => toggle(rule.id)} style={{ width:44, height:24, borderRadius:20, background: rule.enabled ? "#16a34a" : "#e2e8f0", position:"relative", cursor:"pointer", transition:"background 0.3s" }}>
                <div style={{ position:"absolute", top:2, left: rule.enabled ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 2px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
            <button style={{ padding:"8px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#64748b", cursor:"pointer", marginLeft:8 }}>
              <IconSettings size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Automation() {
  const [tab, setTab] = useState("workflows");
  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);

  const toggleStatus = (id) => {
    setWorkflows(p => p.map(w => w.id === id ? { ...w, status: w.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : w));
    Swal.fire({ icon:"success", title:"Status Updated", timer:1000, showConfirmButton:false });
  };

  const ACCENT = "#ec4899";
  const TABS = [
    { id:"workflows", label:"Smart Workflows", icon:<IconRobot size={18}/>, badge:workflows.filter(w=>w.status==="ACTIVE").length },
    { id:"templates", label:"Message Templates", icon:<IconMail size={18}/> },
    { id:"rules",     label:"Business Rules",    icon:<IconSettings size={18}/> },
  ];

  return (
    <div style={{ display:"flex", gap:20 }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{ width:235, flexShrink:0, background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:16, alignSelf:"flex-start", position:"sticky", top:0 }}>
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{ fontSize:14, color:"#1e293b" }}>⚡ Automation</div>
          <div className="text-muted" style={{ fontSize:11 }}>Run the gym on autopilot</div>
        </div>
        {TABS.map(t => <SideTab key={t.id} icon={t.icon} label={t.label} badge={t.badge} active={tab===t.id} onClick={()=>setTab(t.id)} accent={ACCENT}/>)}
        
        <div className="mt-4 p-3 rounded-3" style={{ background:"linear-gradient(135deg,#ec4899,#db2777)", color:"#fff" }}>
          <div style={{ fontSize:20, marginBottom:8 }}>🤖</div>
          <div style={{ fontWeight:700, fontSize:13 }}>Automation saves time</div>
          <div style={{ fontSize:11, opacity:0.9, marginTop:4, lineHeight:1.5 }}>FitNexus automations handle follow-ups, assignments, and reminders so your team can focus on closing deals.</div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0 }}>
        {tab === "workflows" && <WorkflowsTab workflows={workflows} toggleStatus={toggleStatus} />}
        {tab === "templates" && <TemplatesTab templates={TEMPLATES} />}
        {tab === "rules"     && <RulesTab />}
      </div>
    </div>
  );
}
