import React, { useState, useCallback } from "react";
import {
  IconBriefcase, IconUsers, IconFileText, IconCalendarEvent,
  IconTrophy, IconRefresh, IconPlus, IconEdit, IconTrash,
  IconPhone, IconMail, IconBrandWhatsapp, IconCheck, IconX,
  IconBuilding, IconCoinRupee, IconTarget, IconChartBar,
  IconStar, IconArrowUpRight, IconDownload, IconEye,
  IconChevronRight, IconClock, IconCircleCheck, IconAlertTriangle,
  IconPaperclip, IconSend
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import Swal from "sweetalert2";

/* ─── Constants ─────────────────────────────────────────────── */
const INDUSTRIES = [
  "IT / Software", "Manufacturing", "Healthcare", "Banking / Finance",
  "Education", "Retail / E-commerce", "Real Estate", "Pharma",
  "Hospitality", "Government", "Logistics", "Media & Advertising",
];

const DEAL_STAGES = [
  { id: "PROSPECT",    label: "Prospect",     color: "#94a3b8", bg: "#f1f5f9", emoji: "🔍" },
  { id: "CONTACTED",   label: "Contacted",    color: "#0ea5e9", bg: "#e0f2fe", emoji: "📞" },
  { id: "MEETING",     label: "Meeting",      color: "#8b5cf6", bg: "#f3e8ff", emoji: "🤝" },
  { id: "PROPOSAL",    label: "Proposal",     color: "#f59e0b", bg: "#fef9c3", emoji: "📄" },
  { id: "NEGOTIATION", label: "Negotiation",  color: "#ec4899", bg: "#fce7f3", emoji: "💬" },
  { id: "WON",         label: "Won ✅",       color: "#16a34a", bg: "#dcfce7", emoji: "🏆" },
  { id: "LOST",        label: "Lost",         color: "#ef4444", bg: "#fee2e2", emoji: "❌" },
];

const PLAN_TYPES = [
  { id: "BASIC_CORP",    label: "Basic Corporate",     price: 1200,  perHead: true,  color: "#6366f1" },
  { id: "PREMIUM_CORP",  label: "Premium Corporate",   price: 1800,  perHead: true,  color: "#8b5cf6" },
  { id: "ELITE_CORP",    label: "Elite Corporate",     price: 2500,  perHead: true,  color: "#0ea5e9" },
  { id: "FAMILY_CORP",   label: "Family Add-on",       price: 800,   perHead: true,  color: "#16a34a" },
  { id: "CUSTOM",        label: "Custom Plan",         price: 0,     perHead: false, color: "#f59e0b" },
];

const MEETING_STATUS = [
  { id: "SCHEDULED",  label: "Scheduled",   color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "COMPLETED",  label: "Completed",   color: "#16a34a", bg: "#dcfce7" },
  { id: "CANCELLED",  label: "Cancelled",   color: "#ef4444", bg: "#fee2e2" },
  { id: "RESCHEDULED",label: "Rescheduled", color: "#f59e0b", bg: "#fef9c3" },
];

const EMPTY_COMPANY = {
  name: "", industry: "IT / Software", size: "", hrName: "", hrPhone: "", hrEmail: "",
  address: "", stage: "PROSPECT", expectedEmployees: "", notes: "", website: "",
};

const EMPTY_MEETING = {
  companyId: "", title: "", date: "", time: "", mode: "In-person",
  agenda: "", status: "SCHEDULED", outcome: "",
};

const EMPTY_PROPOSAL = {
  companyId: "", planType: "BASIC_CORP", employees: "", customPrice: "",
  validity: "30", discount: "0", notes: "",
};

/* Demo seed data */
const DEMO_COMPANIES = [
  { id: 1, name: "TechNova Pvt Ltd",    industry: "IT / Software",    size: "500-1000", hrName: "Kavya Nair",    hrPhone: "9876543210", hrEmail: "hr@technova.in",  address: "Bengaluru",   stage: "WON",        expectedEmployees: 200, notes: "Signed 3-year deal", website: "technova.in",   convertedEmployees: 180, monthlyRevenue: 324000 },
  { id: 2, name: "MediCare Hospital",   industry: "Healthcare",        size: "200-500",  hrName: "Dr. Rajan",     hrPhone: "9845001122", hrEmail: "hr@medicare.in",  address: "Chennai",     stage: "NEGOTIATION",expectedEmployees: 80,  notes: "Finalizing pricing",  website: "medicare.in",   convertedEmployees: 0,   monthlyRevenue: 0 },
  { id: 3, name: "BlueChip Finance",    industry: "Banking / Finance", size: "100-200",  hrName: "Anjali Desai",  hrPhone: "9912345678", hrEmail: "hr@bluechip.in",  address: "Mumbai",      stage: "PROPOSAL",   expectedEmployees: 120, notes: "Sent premium proposal", website: "bluechip.in",convertedEmployees: 0,   monthlyRevenue: 0 },
  { id: 4, name: "RetailMart India",    industry: "Retail / E-commerce",size:"1000+",   hrName: "Priya Sharma",  hrPhone: "9988776655", hrEmail: "hr@retailmart.in",address: "Delhi",       stage: "MEETING",    expectedEmployees: 500, notes: "Demo call scheduled", website: "retailmart.in", convertedEmployees: 0,   monthlyRevenue: 0 },
  { id: 5, name: "EduWorld Schools",    industry: "Education",         size: "50-100",   hrName: "Suresh Kumar",  hrPhone: "9876001234", hrEmail: "hr@eduworld.in",  address: "Hyderabad",   stage: "CONTACTED",  expectedEmployees: 60,  notes: "Interested in basic plan", website: "eduworld.in",convertedEmployees: 0, monthlyRevenue: 0 },
  { id: 6, name: "GlobalLog Logistics", industry: "Logistics",         size: "200-500",  hrName: "Meena Pillai",  hrPhone: "9800112233", hrEmail: "hr@globallog.in", address: "Pune",        stage: "PROSPECT",   expectedEmployees: 150, notes: "Inbound inquiry",     website: "globallog.in",  convertedEmployees: 0,   monthlyRevenue: 0 },
];

const DEMO_MEETINGS = [
  { id: 1, companyId: 1, title: "Deal Signing",          date: "2026-06-10", time: "11:00", mode: "In-person", agenda: "Contract finalization", status: "COMPLETED",  outcome: "Deal signed!" },
  { id: 2, companyId: 2, title: "Pricing Discussion",    date: "2026-06-22", time: "14:30", mode: "Video Call", agenda: "Discount negotiation",  status: "SCHEDULED",  outcome: "" },
  { id: 3, companyId: 3, title: "Proposal Presentation", date: "2026-06-20", time: "10:00", mode: "In-person", agenda: "Present premium plan",    status: "COMPLETED",  outcome: "Interested, needs approval" },
  { id: 4, companyId: 4, title: "Demo Session",          date: "2026-06-24", time: "15:00", mode: "Video Call", agenda: "Product walkthrough",    status: "SCHEDULED",  outcome: "" },
];

const DEMO_PROPOSALS = [
  { id: 1, companyId: 1, planType: "PREMIUM_CORP", employees: 180, customPrice: "", validity: "365", discount: "10", notes: "Signed", status: "ACCEPTED",  createdAt: "2026-06-10" },
  { id: 2, companyId: 3, planType: "ELITE_CORP",   employees: 120, customPrice: "", validity: "30",  discount: "5",  notes: "Pending approval", status: "SENT", createdAt: "2026-06-20" },
  { id: 3, companyId: 2, planType: "BASIC_CORP",   employees: 80,  customPrice: "", validity: "30",  discount: "15", notes: "Under discussion",  status: "NEGOTIATING", createdAt: "2026-06-18" },
];

/* ─── Utility ────────────────────────────────────────────────── */
function StageChip({ stage }) {
  const s = DEAL_STAGES.find(d => d.id === stage) || DEAL_STAGES[0];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:s.bg, color:s.color, fontSize:11.5, fontWeight:700 }}>
      {s.emoji} {s.label}
    </span>
  );
}

function SideTab({ icon, label, active, onClick, accent, badge }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10, width:"100%",
      padding:"11px 14px", marginBottom:4,
      background: active ? accent : "transparent",
      color: active ? "#fff" : "#64748b",
      border:"none", borderRadius:12, cursor:"pointer",
      fontWeight: active ? 700 : 500, fontSize:13.5, transition:"all 0.18s",
    }}>
      {icon}
      <span style={{ flex:1, textAlign:"left" }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: active ? "rgba(255,255,255,0.28)" : "#e2e8f0", color: active ? "#fff" : "#64748b", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{badge}</span>
      )}
    </button>
  );
}

/* ─── Company Form Modal ─────────────────────────────────────── */
function CompanyModal({ show, company, onClose, onSave }) {
  const [form, setForm] = useState(company || EMPTY_COMPANY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  if (!show) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1060, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:700, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1.5px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#fff", borderRadius:"20px 20px 0 0", zIndex:1 }}>
          <div>
            <h6 className="fw-bold mb-0">{company ? "✏️ Edit Company" : "🏢 Add Corporate Lead"}</h6>
            <p className="text-muted mb-0" style={{ fontSize:12 }}>Track the B2B opportunity</p>
          </div>
          <button onClick={onClose} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"6px 10px", cursor:"pointer" }}><IconX size={16} color="#64748b"/></button>
        </div>
        <div style={{ padding:24 }}>
          {/* Company details */}
          <div style={{ background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>🏢 Company Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Company Name *</label><input className="form-control" style={{ borderRadius:10 }} value={form.name} onChange={e => set("name",e.target.value)} placeholder="TechNova Pvt Ltd"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Industry</label>
                <select className="form-select" style={{ borderRadius:10 }} value={form.industry} onChange={e => set("industry",e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Company Size</label>
                <select className="form-select" style={{ borderRadius:10 }} value={form.size} onChange={e => set("size",e.target.value)}>
                  {["<50","50-100","100-200","200-500","500-1000","1000+"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Expected Employees</label><input className="form-control" style={{ borderRadius:10 }} type="number" value={form.expectedEmployees} onChange={e => set("expectedEmployees",e.target.value)} placeholder="100"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Website</label><input className="form-control" style={{ borderRadius:10 }} value={form.website} onChange={e => set("website",e.target.value)} placeholder="company.com"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Deal Stage</label>
                <select className="form-select" style={{ borderRadius:10 }} value={form.stage} onChange={e => set("stage",e.target.value)}>
                  {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* HR Contact */}
          <div style={{ background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>👤 HR Contact</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>HR Name *</label><input className="form-control" style={{ borderRadius:10 }} value={form.hrName} onChange={e => set("hrName",e.target.value)} placeholder="Kavya Nair"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Phone *</label><input className="form-control" style={{ borderRadius:10 }} value={form.hrPhone} onChange={e => set("hrPhone",e.target.value)} placeholder="9876543210"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Email</label><input className="form-control" style={{ borderRadius:10 }} type="email" value={form.hrEmail} onChange={e => set("hrEmail",e.target.value)} placeholder="hr@company.in"/></div>
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Address / City</label><input className="form-control" style={{ borderRadius:10 }} value={form.address} onChange={e => set("address",e.target.value)} placeholder="Bengaluru"/></div>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>📝 Notes</label>
            <textarea className="form-control" rows={2} style={{ borderRadius:10, resize:"none" }} value={form.notes} onChange={e => set("notes",e.target.value)} placeholder="Key observations, requirements…"/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { if (!form.name || !form.hrName) { Swal.fire("Required","Company Name & HR Name required","warning"); return; } onSave(form); onClose(); }} style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {company ? "💾 Update" : "✅ Add Company"}
            </button>
            <button onClick={onClose} style={{ padding:"12px 18px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:14, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Companies Tab ──────────────────────────────────────────── */
function CompaniesTab({ companies, onAdd, onEdit, onDelete, onStageChange }) {
  const [search, setSearch] = useState("");
  const [stageF, setStageF] = useState("ALL");

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return (stageF === "ALL" || c.stage === stageF) &&
      (c.name?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.hrName?.toLowerCase().includes(q));
  });

  const COLOR_LIST = ["#6366f1","#0ea5e9","#16a34a","#f59e0b","#ec4899","#8b5cf6","#10b981","#f97316"];

  return (
    <div>
      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4 p-3 rounded-3" style={{ background:"#fff", border:"1.5px solid #e2e8f0" }}>
        <input type="text" placeholder="Search company, HR, industry…" value={search} onChange={e => setSearch(e.target.value)}
          className="form-control" style={{ maxWidth:240, borderRadius:10, fontSize:13 }}/>
        <select value={stageF} onChange={e => setStageF(e.target.value)} className="form-select" style={{ maxWidth:160, borderRadius:10, fontSize:13 }}>
          <option value="ALL">All Stages</option>
          {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
        </select>
        <span className="ms-auto d-flex align-items-center" style={{ fontSize:12.5, color:"#94a3b8", fontWeight:600 }}>
          {filtered.length} of {companies.length} companies
        </span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {filtered.map((c, idx) => {
          const revenue = c.convertedEmployees
            ? c.convertedEmployees * (PLAN_TYPES[1].price * 0.9)
            : c.expectedEmployees * PLAN_TYPES[0].price;
          const potential = c.expectedEmployees * PLAN_TYPES[1].price;
          const cardColor = COLOR_LIST[idx % COLOR_LIST.length];
          const stage = DEAL_STAGES.find(s => s.id === c.stage) || DEAL_STAGES[0];

          return (
            <div key={c.id} style={{
              background:"#fff", borderRadius:20, overflow:"hidden",
              border:`1.5px solid ${stage.color}44`,
              boxShadow:`0 4px 20px ${stage.color}15`,
              transition:"all 0.22s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 32px ${stage.color}28`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=`0 4px 20px ${stage.color}15`; }}
            >
              <div style={{ height:5, background:`linear-gradient(90deg,${cardColor},${cardColor}88)` }}/>
              <div style={{ padding:"18px 20px" }}>
                {/* Header */}
                <div className="d-flex align-items-start gap-3 mb-4">
                  <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${cardColor},${cardColor}bb)`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, flexShrink:0, boxShadow:`0 4px 12px ${cardColor}44` }}>
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="fw-bold" style={{ fontSize:15, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                    <div style={{ fontSize:11.5, color:"#94a3b8" }}>{c.industry} · {c.size} employees · {c.address}</div>
                  </div>
                  <StageChip stage={c.stage}/>
                </div>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                  <div style={{ padding:"10px 12px", borderRadius:12, background:"#f8fafc", border:"1px solid #f1f5f9", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>EXPECTED</div>
                    <div style={{ fontSize:20, fontWeight:800, color:cardColor }}>{c.expectedEmployees || "—"}</div>
                    <div style={{ fontSize:9.5, color:"#94a3b8" }}>employees</div>
                  </div>
                  <div style={{ padding:"10px 12px", borderRadius:12, background: c.convertedEmployees > 0 ? "#dcfce7" : "#f8fafc", border:`1px solid ${c.convertedEmployees > 0 ? "#86efac" : "#f1f5f9"}`, textAlign:"center" }}>
                    <div style={{ fontSize:10, color: c.convertedEmployees > 0 ? "#16a34a" : "#94a3b8", fontWeight:600 }}>ENROLLED</div>
                    <div style={{ fontSize:20, fontWeight:800, color: c.convertedEmployees > 0 ? "#16a34a" : "#64748b" }}>{c.convertedEmployees || 0}</div>
                    <div style={{ fontSize:9.5, color:"#94a3b8" }}>members</div>
                  </div>
                  <div style={{ padding:"10px 12px", borderRadius:12, background:"#fef9c3", border:"1px solid #fde68a", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#f59e0b", fontWeight:600 }}>POTENTIAL</div>
                    <div style={{ fontSize:13, fontWeight:800, color:"#f59e0b" }}>₹{(potential/1000).toFixed(0)}K</div>
                    <div style={{ fontSize:9.5, color:"#94a3b8" }}>/month</div>
                  </div>
                </div>

                {/* HR Contact */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:"10px 14px", marginBottom:12, border:"1px solid #f1f5f9" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#1e293b" }}>{c.hrName}</div>
                  <div style={{ fontSize:11.5, color:"#94a3b8" }}>{c.hrPhone} · {c.hrEmail}</div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 flex-wrap">
                  {/* Stage update */}
                  <select
                    value={c.stage}
                    onChange={e => onStageChange(c.id, e.target.value)}
                    style={{ flex:1, padding:"7px 10px", borderRadius:10, border:`1.5px solid ${stage.color}55`, background:stage.bg, color:stage.color, fontSize:12, fontWeight:700, cursor:"pointer", outline:"none" }}
                  >
                    {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
                  </select>
                  <button onClick={() => onEdit(c)} style={{ padding:"7px 12px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#fff", color:"#6366f1", cursor:"pointer" }} title="Edit"><IconEdit size={15}/></button>
                  <button onClick={() => window.open(`tel:${c.hrPhone}`)} style={{ padding:"7px 12px", borderRadius:10, border:"1.5px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", cursor:"pointer" }} title="Call"><IconPhone size={15}/></button>
                  <button onClick={() => Swal.fire("WhatsApp",`Send message to ${c.hrPhone}`,"info")} style={{ padding:"7px 12px", borderRadius:10, border:"1.5px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", cursor:"pointer" }} title="WhatsApp"><IconBrandWhatsapp size={15}/></button>
                  <button onClick={() => onDelete(c.id)} style={{ padding:"7px 12px", borderRadius:10, border:"1.5px solid #fee2e2", background:"#fff5f5", color:"#ef4444", cursor:"pointer" }} title="Delete"><IconTrash size={15}/></button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <div onClick={onAdd} style={{ background:"#f8fafc", borderRadius:20, border:"2px dashed #e2e8f0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:200, cursor:"pointer", gap:10, transition:"all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.background="#ede9fe"; e.currentTarget.style.borderColor="#6366f1"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#e2e8f0"; }}
        >
          <div style={{ width:52, height:52, borderRadius:16, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IconPlus size={24} color="#6366f1"/>
          </div>
          <span style={{ fontWeight:700, color:"#6366f1", fontSize:13 }}>Add Corporate Lead</span>
          <span style={{ fontSize:11, color:"#94a3b8" }}>One deal = 100+ memberships</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Employee Plans Tab ─────────────────────────────────────── */
function EmployeePlansTab({ companies, proposals }) {
  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">📋 Employee Plans</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Bulk membership plans available for corporate accounts</p>
      </div>

      {/* Plan cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:24 }}>
        {PLAN_TYPES.filter(p => p.id !== "CUSTOM").map(plan => (
          <div key={plan.id} style={{ background:"#fff", borderRadius:18, overflow:"hidden", border:`1.5px solid ${plan.color}44`, boxShadow:`0 4px 16px ${plan.color}15` }}>
            <div style={{ height:5, background:`linear-gradient(90deg,${plan.color},${plan.color}88)` }}/>
            <div style={{ padding:"20px 20px" }}>
              <div style={{ width:44, height:44, borderRadius:14, background:plan.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>🎟️</div>
              <div style={{ fontWeight:800, fontSize:15, color:"#1e293b", marginBottom:4 }}>{plan.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:plan.color }}>₹{plan.price.toLocaleString("en-IN")}</div>
              <div style={{ fontSize:12, color:"#94a3b8", marginBottom:16 }}>per employee / month</div>
              <div style={{ fontSize:12, color:"#64748b", lineHeight:1.8 }}>
                ✅ Unlimited gym access<br/>
                ✅ Group fitness classes<br/>
                {plan.id === "PREMIUM_CORP" && "✅ Personal trainer sessions\n"}
                {plan.id === "ELITE_CORP" && <>✅ PT sessions<br/>✅ Nutrition counseling<br/></>}
                ✅ Monthly health report
              </div>
              <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:`${plan.color}15`, color:plan.color, fontSize:12, fontWeight:700, textAlign:"center" }}>
                Min. 10 employees
              </div>
            </div>
          </div>
        ))}
        {/* Custom */}
        <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:18, padding:"20px", color:"#fff" }}>
          <div style={{ fontSize:24, marginBottom:12 }}>🛠️</div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Custom Plan</div>
          <div style={{ fontSize:13, opacity:0.8, marginBottom:16, lineHeight:1.8 }}>
            Tailored pricing for large enterprises. Includes custom benefits, dedicated account manager & on-site sessions.
          </div>
          <button onClick={() => Swal.fire("Contact Sales","Our team will create a custom plan for your enterprise.","info")} style={{ width:"100%", padding:"10px", borderRadius:12, border:"2px solid rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.15)", color:"#fff", fontWeight:700, cursor:"pointer" }}>
            Request Custom Quote
          </button>
        </div>
      </div>

      {/* Company-plan mapping */}
      <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}>
        <h6 className="fw-bold mb-3" style={{ fontSize:13 }}>📊 Plan Assignment Overview</h6>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Company","Plan","Employees","Monthly Value","Annual Value","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", fontSize:11.5, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1.5px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposals.map((p, i) => {
                const company = companies.find(c => c.id === p.companyId);
                const plan    = PLAN_TYPES.find(t => t.id === p.planType);
                const discounted = plan ? plan.price * (1 - p.discount/100) : 0;
                const monthly    = discounted * p.employees;
                const annual     = monthly * 12;
                const statusMeta = { ACCEPTED:{color:"#16a34a",bg:"#dcfce7"}, SENT:{color:"#0ea5e9",bg:"#e0f2fe"}, NEGOTIATING:{color:"#f59e0b",bg:"#fef9c3"} };
                const sm = statusMeta[p.status] || { color:"#94a3b8", bg:"#f1f5f9" };
                return (
                  <tr key={p.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                    <td style={{ padding:"13px 14px", fontWeight:700, color:"#1e293b", fontSize:13.5 }}>{company?.name || "—"}</td>
                    <td style={{ padding:"13px 14px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:plan?.color+"22", color:plan?.color, fontSize:12, fontWeight:700 }}>{plan?.label}</span>
                    </td>
                    <td style={{ padding:"13px 14px", fontWeight:700, color:"#6366f1", fontSize:15 }}>{p.employees}</td>
                    <td style={{ padding:"13px 14px", fontWeight:800, color:"#16a34a" }}>₹{monthly.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"13px 14px", fontWeight:800, color:"#10b981" }}>₹{annual.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"13px 14px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:sm.bg, color:sm.color, fontSize:11.5, fontWeight:700 }}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Proposals Tab ──────────────────────────────────────────── */
function ProposalsTab({ companies, proposals, onAddProposal }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PROPOSAL);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const plan = PLAN_TYPES.find(t => t.id === form.planType);
  const basePrice = plan?.price || 0;
  const discountedPrice = basePrice * (1 - form.discount/100);
  const monthly = discountedPrice * (form.employees || 0);
  const annual  = monthly * 12;

  const submitProposal = () => {
    if (!form.companyId || !form.employees) { Swal.fire("Required","Select company & enter employees","warning"); return; }
    onAddProposal({ ...form, id: Date.now(), status:"SENT", createdAt: new Date().toISOString().split("T")[0] });
    setShowForm(false); setForm(EMPTY_PROPOSAL);
    Swal.fire({ icon:"success", title:"Proposal Created!", timer:1500, showConfirmButton:false });
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h6 className="fw-bold mb-0">📄 Proposals</h6>
          <p className="text-muted mb-0" style={{ fontSize:12 }}>Create and track corporate proposals</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <IconPlus size={15}/> New Proposal
        </button>
      </div>

      {/* Proposal builder */}
      {showForm && (
        <div style={{ background:"#f8fafc", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24, marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:16 }}>🛠️ Proposal Builder</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:16 }}>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Company *</label>
              <select className="form-select" style={{ borderRadius:10, fontSize:13 }} value={form.companyId} onChange={e => set("companyId", Number(e.target.value))}>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Plan</label>
              <select className="form-select" style={{ borderRadius:10, fontSize:13 }} value={form.planType} onChange={e => set("planType", e.target.value)}>
                {PLAN_TYPES.map(p => <option key={p.id} value={p.id}>{p.label} {p.price > 0 ? `(₹${p.price}/head)` : ""}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Employees *</label><input className="form-control" style={{ borderRadius:10, fontSize:13 }} type="number" min={10} value={form.employees} onChange={e => set("employees", Number(e.target.value))} placeholder="100"/></div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Discount %</label><input className="form-control" style={{ borderRadius:10, fontSize:13 }} type="number" min={0} max={50} value={form.discount} onChange={e => set("discount", Number(e.target.value))}/></div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Validity (days)</label><input className="form-control" style={{ borderRadius:10, fontSize:13 }} type="number" value={form.validity} onChange={e => set("validity",e.target.value)}/></div>
            {form.planType === "CUSTOM" && (
              <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Custom Price/head</label><input className="form-control" style={{ borderRadius:10, fontSize:13 }} type="number" value={form.customPrice} onChange={e => set("customPrice",e.target.value)}/></div>
            )}
          </div>

          {/* Live preview */}
          {form.employees > 0 && (
            <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:14, padding:16, marginBottom:16, display:"flex", gap:24 }}>
              <div><div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>PLAN RATE</div><div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>₹{discountedPrice.toLocaleString("en-IN")}/head</div></div>
              <div><div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>EMPLOYEES</div><div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{form.employees}</div></div>
              <div><div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>MONTHLY</div><div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>₹{monthly.toLocaleString("en-IN")}</div></div>
              <div><div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>ANNUAL</div><div style={{ fontSize:20, fontWeight:800, color:"#fde68a" }}>₹{annual.toLocaleString("en-IN")}</div></div>
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={submitProposal} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              <IconSend size={14} style={{ marginRight:6 }}/>Generate & Send Proposal
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding:"11px 18px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {proposals.map(p => {
          const company = companies.find(c => c.id === p.companyId);
          const plan    = PLAN_TYPES.find(t => t.id === p.planType);
          const monthly = (plan?.price || 0) * (1 - p.discount/100) * p.employees;
          const statusMeta = { ACCEPTED:{color:"#16a34a",bg:"#dcfce7",label:"✅ Accepted"}, SENT:{color:"#0ea5e9",bg:"#e0f2fe",label:"📤 Sent"}, NEGOTIATING:{color:"#f59e0b",bg:"#fef9c3",label:"💬 Negotiating"}, DRAFT:{color:"#94a3b8",bg:"#f1f5f9",label:"📝 Draft"} };
          const sm = statusMeta[p.status] || { color:"#94a3b8", bg:"#f1f5f9", label: p.status };
          return (
            <div key={p.id} style={{ background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0", padding:"18px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{company?.name || "Unknown"}</div>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{plan?.label} · {p.employees} employees · {p.discount}% discount</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:800, color:"#6366f1" }}>₹{monthly.toLocaleString("en-IN")}</div>
                <div style={{ fontSize:10.5, color:"#94a3b8" }}>/month</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#10b981" }}>₹{(monthly*12).toLocaleString("en-IN")}</div>
                <div style={{ fontSize:10.5, color:"#94a3b8" }}>/year</div>
              </div>
              <div style={{ fontSize:11.5, color:"#94a3b8" }}>{p.createdAt}</div>
              <span style={{ padding:"4px 12px", borderRadius:20, background:sm.bg, color:sm.color, fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{sm.label}</span>
              <button onClick={() => Swal.fire("Download","PDF proposal download would be triggered here.","info")} style={{ padding:"7px 12px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#fff", color:"#6366f1", cursor:"pointer" }} title="Download PDF">
                <IconDownload size={15}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Meetings Tab ───────────────────────────────────────────── */
function MeetingsTab({ companies, meetings, onAddMeeting }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_MEETING);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.companyId || !form.date || !form.title) { Swal.fire("Required","Fill company, title & date","warning"); return; }
    onAddMeeting({ ...form, id: Date.now() });
    setShowForm(false); setForm(EMPTY_MEETING);
    Swal.fire({ icon:"success", title:"Meeting Scheduled!", timer:1500, showConfirmButton:false });
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter(m => m.date >= today && m.status !== "CANCELLED");
  const past     = meetings.filter(m => m.date < today || m.status === "COMPLETED");

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h6 className="fw-bold mb-0">📅 Meetings</h6>
          <p className="text-muted mb-0" style={{ fontSize:12 }}>{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <IconCalendarEvent size={15}/> Schedule Meeting
        </button>
      </div>

      {showForm && (
        <div style={{ background:"#f8fafc", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24, marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:16 }}>📅 Schedule New Meeting</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:16 }}>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Company *</label>
              <select className="form-select" style={{ borderRadius:10, fontSize:13 }} value={form.companyId} onChange={e => set("companyId",Number(e.target.value))}>
                <option value="">Select</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Title *</label><input className="form-control" style={{ borderRadius:10, fontSize:13 }} value={form.title} onChange={e => set("title",e.target.value)} placeholder="Proposal Discussion"/></div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Date *</label><input type="date" className="form-control" style={{ borderRadius:10, fontSize:13 }} value={form.date} onChange={e => set("date",e.target.value)}/></div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Time</label><input type="time" className="form-control" style={{ borderRadius:10, fontSize:13 }} value={form.time} onChange={e => set("time",e.target.value)}/></div>
            <div><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Mode</label>
              <select className="form-select" style={{ borderRadius:10, fontSize:13 }} value={form.mode} onChange={e => set("mode",e.target.value)}>
                {["In-person","Video Call","Phone Call","At Client Office"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:16 }}><label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Agenda</label><textarea className="form-control" rows={2} style={{ borderRadius:10, resize:"none", fontSize:13 }} value={form.agenda} onChange={e => set("agenda",e.target.value)} placeholder="Key talking points…"/></div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={submit} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>✅ Schedule</button>
            <button onClick={() => setShowForm(false)} style={{ padding:"11px 18px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {[{ label:"📅 Upcoming Meetings", list: upcoming }, { label:"✅ Past Meetings", list: past }].map(({ label, list }) => (
        <div key={label} style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#475569", marginBottom:12 }}>{label} ({list.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {list.map(m => {
              const company = companies.find(c => c.id === m.companyId);
              const sm = MEETING_STATUS.find(s => s.id === m.status) || MEETING_STATUS[0];
              const isUpcoming = m.date >= today && m.status === "SCHEDULED";
              return (
                <div key={m.id} style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${isUpcoming ? "#c4b5fd" : "#f1f5f9"}`, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ width:46, height:46, borderRadius:14, background: isUpcoming ? "#ede9fe" : "#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    {isUpcoming ? "📅" : m.status === "COMPLETED" ? "✅" : "❌"}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{m.title}</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>{company?.name} · {m.date} {m.time} · {m.mode}</div>
                    {m.agenda && <div style={{ fontSize:11.5, color:"#64748b", marginTop:2 }}>📋 {m.agenda}</div>}
                    {m.outcome && <div style={{ fontSize:11.5, color:"#16a34a", marginTop:2, fontWeight:600 }}>💡 {m.outcome}</div>}
                  </div>
                  <span style={{ padding:"4px 12px", borderRadius:20, background:sm.bg, color:sm.color, fontSize:11.5, fontWeight:700 }}>{sm.label}</span>
                </div>
              );
            })}
            {list.length === 0 && <div style={{ textAlign:"center", color:"#94a3b8", padding:24 }}>No {label.toLowerCase()}.</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Conversions Tab ────────────────────────────────────────── */
function ConversionsTab({ companies }) {
  const won = companies.filter(c => c.stage === "WON");
  const totalEnrolled = won.reduce((s, c) => s + (c.convertedEmployees || 0), 0);
  const totalRevenue  = won.reduce((s, c) => s + (c.monthlyRevenue || 0), 0);
  const pipeline      = companies.filter(c => !["WON","LOST"].includes(c.stage));
  const pipelineValue = pipeline.reduce((s, c) => s + c.expectedEmployees * PLAN_TYPES[0].price, 0);

  const donutOpts = {
    chart: { type:"donut", toolbar:{ show:false } },
    labels: DEAL_STAGES.map(s => s.label),
    colors: DEAL_STAGES.map(s => s.color),
    legend: { position:"bottom", fontSize:"11px" },
    plotOptions: { pie: { donut: { size:"65%", labels: { show:true, total: { show:true, label:"Companies", fontSize:"13px", fontWeight:700, formatter: () => companies.length } } } } },
    dataLabels: { enabled:false },
    stroke: { width:0 },
    tooltip: { y: { formatter: v => `${v} companies` } },
  };

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">🏆 Corporate Conversions</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Deals won and revenue generated from corporate accounts</p>
      </div>

      {/* KPIs */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { label:"Corporate Clients",  value:won.length,                                  color:"#6366f1", bg:"#ede9fe" },
          { label:"Enrolled Employees", value:totalEnrolled,                               color:"#16a34a", bg:"#dcfce7" },
          { label:"Monthly Revenue",    value:`₹${totalRevenue.toLocaleString("en-IN")}`, color:"#10b981", bg:"#d1fae5" },
          { label:"Annual Revenue",     value:`₹${(totalRevenue*12).toLocaleString("en-IN")}`, color:"#f59e0b", bg:"#fef9c3" },
          { label:"Pipeline Value",     value:`₹${pipelineValue.toLocaleString("en-IN")}`,color:"#0ea5e9", bg:"#e0f2fe" },
        ].map((kpi, i) => (
          <div key={i} style={{ flex:"1 1 140px", padding:"14px 16px", borderRadius:14, background:"#fff", border:"1.5px solid #e2e8f0" }}>
            <div style={{ fontSize:20, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginTop:2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
        {/* Won accounts */}
        <div style={{ flex:"2 1 380px", background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}>
          <h6 className="fw-bold mb-3" style={{ fontSize:13 }}>🏆 Won Corporate Accounts</h6>
          {won.length === 0 ? (
            <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
              <div style={{ fontSize:48 }}>🎯</div>
              <p className="mt-3">No conversions yet. Close your first corporate deal!</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {won.map(c => (
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, background:"#f0fdf4", border:"1.5px solid #86efac" }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:"#16a34a", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, flexShrink:0 }}>
                    {c.name?.charAt(0)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:"#1e293b" }}>{c.name}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{c.industry} · {c.address}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#16a34a" }}>{c.convertedEmployees} enrolled</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>₹{(c.monthlyRevenue||0).toLocaleString("en-IN")}/mo</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stage donut */}
        <div style={{ flex:"1 1 240px", background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}>
          <h6 className="fw-bold mb-3" style={{ fontSize:13 }}>📊 Deal Stage Distribution</h6>
          <ReactApexChart
            options={donutOpts}
            series={DEAL_STAGES.map(s => companies.filter(c => c.stage === s.id).length)}
            type="donut" height={260}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CorporateLeads() {
  const [tab, setTab] = useState("companies");

  const [companies, setCompanies] = useState(() => {
    try { const s = localStorage.getItem("crm_corp_companies"); return s ? JSON.parse(s) : DEMO_COMPANIES; }
    catch { return DEMO_COMPANIES; }
  });
  const [meetings, setMeetings] = useState(() => {
    try { const s = localStorage.getItem("crm_corp_meetings"); return s ? JSON.parse(s) : DEMO_MEETINGS; }
    catch { return DEMO_MEETINGS; }
  });
  const [proposals, setProposals] = useState(() => {
    try { const s = localStorage.getItem("crm_corp_proposals"); return s ? JSON.parse(s) : DEMO_PROPOSALS; }
    catch { return DEMO_PROPOSALS; }
  });

  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);

  const saveCompanies  = (list) => { setCompanies(list);  localStorage.setItem("crm_corp_companies",  JSON.stringify(list)); };
  const saveMeetings   = (list) => { setMeetings(list);   localStorage.setItem("crm_corp_meetings",   JSON.stringify(list)); };
  const saveProposals  = (list) => { setProposals(list);  localStorage.setItem("crm_corp_proposals",  JSON.stringify(list)); };

  const handleSaveCompany = (form) => {
    if (editCompany) {
      saveCompanies(companies.map(c => c.id === editCompany.id ? { ...editCompany, ...form } : c));
    } else {
      saveCompanies([...companies, { ...form, id: Date.now(), convertedEmployees: 0, monthlyRevenue: 0 }]);
    }
    setEditCompany(null);
    Swal.fire({ icon:"success", title: editCompany ? "Updated!" : "Company Added!", timer:1200, showConfirmButton:false });
  };

  const handleDelete = (id) => {
    Swal.fire({ title:"Delete?", icon:"warning", showCancelButton:true, confirmButtonColor:"#ef4444", confirmButtonText:"Delete" }).then(r => {
      if (r.isConfirmed) saveCompanies(companies.filter(c => c.id !== id));
    });
  };

  const handleStageChange = (id, stage) => {
    saveCompanies(companies.map(c => c.id === id
      ? { ...c, stage, convertedEmployees: stage === "WON" ? (c.expectedEmployees || 0) : c.convertedEmployees, monthlyRevenue: stage === "WON" ? (c.expectedEmployees || 0) * PLAN_TYPES[0].price * 0.9 : c.monthlyRevenue }
      : c
    ));
  };

  /* KPIs */
  const wonCompanies   = companies.filter(c => c.stage === "WON").length;
  const pipelineCount  = companies.filter(c => !["WON","LOST"].includes(c.stage)).length;
  const totalEnrolled  = companies.reduce((s, c) => s + (c.convertedEmployees || 0), 0);
  const monthlyRevenue = companies.reduce((s, c) => s + (c.monthlyRevenue || 0), 0);

  const ACCENT = "#0ea5e9";
  const TABS = [
    { id:"companies",    label:"Companies",       icon:<IconBuilding size={18}/>,      badge:companies.length },
    { id:"hr",           label:"HR Contacts",     icon:<IconUsers size={18}/>,          badge:companies.length },
    { id:"plans",        label:"Employee Plans",  icon:<IconFileText size={18}/> },
    { id:"proposals",    label:"Proposals",       icon:<IconPaperclip size={18}/>,      badge:proposals.length },
    { id:"meetings",     label:"Meetings",        icon:<IconCalendarEvent size={18}/>,  badge:meetings.length },
    { id:"conversions",  label:"Conversions",     icon:<IconTrophy size={18}/>,         badge:wonCompanies },
  ];

  return (
    <div style={{ display:"flex", gap:20 }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{ width:235, flexShrink:0, background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:16, alignSelf:"flex-start", position:"sticky", top:0 }}>
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{ fontSize:14, color:"#1e293b" }}>🏢 Corporate Leads</div>
          <div className="text-muted" style={{ fontSize:11 }}>One deal = 100+ memberships</div>
        </div>
        {TABS.map(t => <SideTab key={t.id} icon={t.icon} label={t.label} badge={t.badge} active={tab===t.id} onClick={()=>setTab(t.id)} accent={ACCENT}/>)}
        <div className="mt-3 pt-3" style={{ borderTop:"1px solid #f1f5f9" }}>
          <button onClick={() => { setEditCompany(null); setShowModal(true); }} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#0ea5e9,#38bdf8)", color:"#fff", fontWeight:700, fontSize:12.5, cursor:"pointer" }}>
            <IconPlus size={14}/> Add Corporate Lead
          </button>
        </div>
        <div style={{ marginTop:8 }}>
          <div className="p-3 rounded-3" style={{ background:"linear-gradient(135deg,#0ea5e9,#38bdf8)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>MONTHLY REVENUE</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>₹{(monthlyRevenue/1000).toFixed(0)}K</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>{totalEnrolled} employees enrolled</div>
          </div>
          <div className="p-3 rounded-3 mt-2" style={{ background:"linear-gradient(135deg,#16a34a,#15803d)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>PIPELINE</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>{pipelineCount}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>active corporate deals</div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* KPI Row */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          {[
            { label:"Total Companies",  value:companies.length,                             color:"#0ea5e9", bg:"#e0f2fe", icon:<IconBuilding size={20}/> },
            { label:"Won Deals",        value:wonCompanies,                                 color:"#16a34a", bg:"#dcfce7", icon:<IconTrophy size={20}/> },
            { label:"In Pipeline",      value:pipelineCount,                                color:"#f59e0b", bg:"#fef9c3", icon:<IconTarget size={20}/> },
            { label:"Enrolled Members", value:totalEnrolled,                               color:"#6366f1", bg:"#ede9fe", icon:<IconUsers size={20}/> },
            { label:"Monthly Revenue",  value:`₹${monthlyRevenue.toLocaleString("en-IN")}`,color:"#10b981", bg:"#dcfce7", icon:<IconCoinRupee size={20}/> },
          ].map((kpi, i) => (
            <div key={i} style={{ flex:"1 1 130px", background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0", padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:kpi.bg, display:"flex", alignItems:"center", justifyContent:"center", color:kpi.color, flexShrink:0 }}>{kpi.icon}</div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize:10.5, color:"#94a3b8", fontWeight:600 }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {tab === "companies"   && <CompaniesTab companies={companies} onAdd={() => { setEditCompany(null); setShowModal(true); }} onEdit={c => { setEditCompany(c); setShowModal(true); }} onDelete={handleDelete} onStageChange={handleStageChange}/>}
        {tab === "hr"          && (
          <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f8fafc" }}>
                  {["Company","HR Name","Phone","Email","Stage","Actions"].map(h => (
                    <th key={h} style={{ padding:"13px 16px", fontSize:11.5, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1.5px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={c.id} style={{ borderTop:"1px solid #f1f5f9", background: i%2===0?"#fff":"#fafafe" }}>
                      <td style={{ padding:"14px 16px", fontWeight:700, color:"#1e293b" }}><div className="d-flex align-items-center gap-2"><div style={{ width:32,height:32,borderRadius:10,background:"#0ea5e9",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13 }}>{c.name?.charAt(0)}</div>{c.name}</div></td>
                      <td style={{ padding:"14px 16px", fontWeight:600 }}>{c.hrName}</td>
                      <td style={{ padding:"14px 16px", fontSize:13, color:"#475569" }}>{c.hrPhone}</td>
                      <td style={{ padding:"14px 16px", fontSize:13, color:"#475569" }}>{c.hrEmail}</td>
                      <td style={{ padding:"14px 16px" }}><StageChip stage={c.stage}/></td>
                      <td style={{ padding:"14px 16px" }}>
                        <div className="d-flex gap-1">
                          <button onClick={() => window.open(`tel:${c.hrPhone}`)} style={{ padding:"6px 10px", borderRadius:9, border:"1.5px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", cursor:"pointer" }}><IconPhone size={13}/></button>
                          <button onClick={() => Swal.fire("WhatsApp",`Message ${c.hrPhone}`,"info")} style={{ padding:"6px 10px", borderRadius:9, border:"1.5px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", cursor:"pointer" }}><IconBrandWhatsapp size={13}/></button>
                          <button onClick={() => window.open(`mailto:${c.hrEmail}`)} style={{ padding:"6px 10px", borderRadius:9, border:"1.5px solid #e0f2fe", background:"#f0f9ff", color:"#0ea5e9", cursor:"pointer" }}><IconMail size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "plans"       && <EmployeePlansTab companies={companies} proposals={proposals}/>}
        {tab === "proposals"   && <ProposalsTab companies={companies} proposals={proposals} onAddProposal={p => saveProposals([...proposals, p])}/>}
        {tab === "meetings"    && <MeetingsTab companies={companies} meetings={meetings} onAddMeeting={m => saveMeetings([...meetings, m])}/>}
        {tab === "conversions" && <ConversionsTab companies={companies}/>}
      </div>

      <CompanyModal
        show={showModal}
        company={editCompany}
        onClose={() => { setShowModal(false); setEditCompany(null); }}
        onSave={handleSaveCompany}
      />
    </div>
  );
}
