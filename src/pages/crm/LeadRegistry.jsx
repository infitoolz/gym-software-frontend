import React, { useEffect, useState, useCallback } from "react";
import { Modal, Spinner } from "react-bootstrap";
import {
  IconUserPlus, IconEdit, IconTrash, IconUserCheck,
  IconRefresh, IconSearch, IconX, IconChevronUp,
  IconChevronDown, IconFilter, IconDownload
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { getLeads, createLead, updateLead, deleteLead, convertLeadToMember } from "../../api/leadsApi";
import { getTrainers } from "../../api/userAdminApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";

/* ─── Constants ─────────────────────────────────────────────── */
const STATUS_META = {
  NEW:             { label:"New",             color:"#6366f1", bg:"#ede9fe" },
  CONTACTED:       { label:"Contacted",       color:"#f59e0b", bg:"#fef9c3" },
  INTERESTED:      { label:"Interested",      color:"#0ea5e9", bg:"#e0f2fe" },
  TRIAL_BOOKED:    { label:"Trial Booked",    color:"#8b5cf6", bg:"#f3e8ff" },
  TRIAL_COMPLETED: { label:"Trial Done",      color:"#10b981", bg:"#dcfce7" },
  NEGOTIATION:     { label:"Negotiation",     color:"#ec4899", bg:"#fce7f3" },
  WON:             { label:"Won ✅",          color:"#16a34a", bg:"#dcfce7" },
  LOST:            { label:"Lost",            color:"#ef4444", bg:"#fee2e2" },
  ARCHIVED:        { label:"Archived",        color:"#94a3b8", bg:"#f1f5f9" },
};

const SOURCE_META = {
  WALK_IN:    { label:"Walk-in",    emoji:"🚶" },
  FACEBOOK:   { label:"Facebook",   emoji:"📘" },
  INSTAGRAM:  { label:"Instagram",  emoji:"📸" },
  GOOGLE_ADS: { label:"Google Ads", emoji:"🔍" },
  WEBSITE:    { label:"Website",    emoji:"🌐" },
  WHATSAPP:   { label:"WhatsApp",   emoji:"💬" },
  REFERRAL:   { label:"Referral",   emoji:"🤝" },
  CORPORATE:  { label:"Corporate",  emoji:"🏢" },
  EVENTS:     { label:"Events",     emoji:"🎪" },
};

const STATUSES = Object.keys(STATUS_META);
const SOURCES  = Object.keys(SOURCE_META);

const EMPTY_FORM = {
  name:"", email:"", phone:"", age:"", gender:"Male",
  status:"NEW", source:"WALK_IN", fitnessGoal:"", preferredTime:"", notes:"",
};

/* ─── Status Chip ─────────────────────────────────────────────── */
function StatusChip({ status }) {
  const m = STATUS_META[status] || { label:status, color:"#94a3b8", bg:"#f1f5f9" };
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:20,
      background:m.bg, color:m.color, fontSize:11.5, fontWeight:700,
      whiteSpace:"nowrap",
    }}>{m.label}</span>
  );
}

/* ─── Source Chip ─────────────────────────────────────────────── */
function SourceChip({ source }) {
  const m = SOURCE_META[source] || { label:source, emoji:"📋" };
  return (
    <span style={{ fontSize:12.5, color:"#475569" }}>{m.emoji} {m.label}</span>
  );
}

/* ─── Score Bar ───────────────────────────────────────────────── */
function ScoreBar({ value }) {
  if (!value) return <span style={{color:"#cbd5e1", fontSize:12}}>—</span>;
  const color = value >= 75 ? "#16a34a" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{display:"flex", alignItems:"center", gap:6}}>
      <div style={{width:56, height:6, background:"#e2e8f0", borderRadius:20, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${value}%`, background:color, borderRadius:20}}/>
      </div>
      <span style={{fontSize:12, fontWeight:700, color}}>{value}%</span>
    </div>
  );
}

/* ─── Form Input ──────────────────────────────────────────────── */
function FInput({ label, required, ...props }) {
  return (
    <div>
      <label style={{fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4}}>
        {label}{required && <span style={{color:"#ef4444"}}> *</span>}
      </label>
      <input
        className="form-control"
        style={{borderRadius:10, fontSize:13}}
        {...props}
      />
    </div>
  );
}

function FSelect({ label, children, ...props }) {
  return (
    <div>
      <label style={{fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4}}>{label}</label>
      <select className="form-select" style={{borderRadius:10, fontSize:13}} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ─── Add / Edit Modal ────────────────────────────────────────── */
function LeadModal({ show, onHide, lead, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({...p, [k]:v}));

  useEffect(() => {
    setForm(lead ? {
      name:         lead.name || "",
      email:        lead.email || "",
      phone:        lead.phone || "",
      age:          lead.age || "",
      gender:       lead.gender || "Male",
      status:       lead.status || "NEW",
      source:       lead.source || "WALK_IN",
      fitnessGoal:  lead.fitnessGoal || "",
      preferredTime:lead.preferredTime || "",
      notes:        lead.notes || "",
    } : EMPTY_FORM);
  }, [lead, show]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { Swal.fire("Required","Name and Phone are mandatory","warning"); return; }
    setSaving(true);
    try {
      if (lead) {
        await updateLead(lead.id, form);
        Swal.fire({ icon:"success", title:"Lead Updated!", timer:1500, showConfirmButton:false });
      } else {
        await createLead({ ...form, leadScore: Math.floor(Math.random()*36)+60, conversionProbability: Math.floor(Math.random()*51)+30 });
        Swal.fire({ icon:"success", title:"Lead Added!", timer:1500, showConfirmButton:false });
      }
      onSaved(); onHide();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to save", "error");
    } finally { setSaving(false); }
  };

  if (!show) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1050,
      background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={onHide}>
      <div style={{
        background:"#fff", borderRadius:20, width:"100%", maxWidth:680,
        maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding:"20px 24px", borderBottom:"1.5px solid #f1f5f9",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, background:"#fff", borderRadius:"20px 20px 0 0", zIndex:1,
        }}>
          <div>
            <h5 className="fw-bold mb-0" style={{color:"#1e293b"}}>{lead ? "Edit Lead" : "Add New Lead"}</h5>
            <p className="text-muted mb-0" style={{fontSize:12}}>{lead ? `Editing: ${lead.name}` : "Create a new CRM lead record"}</p>
          </div>
          <button onClick={onHide} style={{background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"6px 10px", cursor:"pointer"}}>
            <IconX size={18} color="#64748b"/>
          </button>
        </div>

        <form onSubmit={submit} style={{padding:24}}>
          {/* Personal */}
          <div style={{background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14}}>👤 Personal Details</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <FInput label="Full Name" required placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => set("name",e.target.value)} />
              <FInput label="Phone" required placeholder="9876543210" value={form.phone} onChange={e => set("phone",e.target.value)} />
              <FInput label="Email" type="email" placeholder="optional@email.com" value={form.email} onChange={e => set("email",e.target.value)} />
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <FInput label="Age" type="number" min={10} max={100} value={form.age} onChange={e => set("age",e.target.value)} />
                <FSelect label="Gender" value={form.gender} onChange={e => set("gender",e.target.value)}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </FSelect>
              </div>
            </div>
          </div>

          {/* CRM Fields */}
          <div style={{background:"#f8fafc", borderRadius:14, padding:16, marginBottom:16, border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14}}>🎯 CRM Details</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <FSelect label="Lead Status" value={form.status} onChange={e => set("status",e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </FSelect>
              <FSelect label="Lead Source" value={form.source} onChange={e => set("source",e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_META[s].emoji} {SOURCE_META[s].label}</option>)}
              </FSelect>
              <FSelect label="Fitness Goal" value={form.fitnessGoal} onChange={e => set("fitnessGoal",e.target.value)}>
                <option value="">— Select —</option>
                <option>Weight Loss</option><option>Muscle Gain</option>
                <option>Fitness</option><option>Body Building</option>
                <option>Yoga & Flex</option><option>Sports Perf.</option>
              </FSelect>
              <FSelect label="Preferred Time" value={form.preferredTime} onChange={e => set("preferredTime",e.target.value)}>
                <option value="">— Any Time —</option>
                <option>Early Morning</option><option>Morning</option>
                <option>Afternoon</option><option>Evening</option><option>Night</option>
              </FSelect>
            </div>
          </div>

          {/* Notes */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4}}>📝 Notes</label>
            <textarea className="form-control" rows={3} style={{borderRadius:10, fontSize:13, resize:"none"}}
              placeholder="Health conditions, referrals, queries…"
              value={form.notes} onChange={e => set("notes",e.target.value)}/>
          </div>

          <div style={{display:"flex", gap:10}}>
            <button type="submit" disabled={saving} style={{
              flex:1, padding:"12px", borderRadius:12, border:"none",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer",
            }}>
              {saving ? "Saving…" : lead ? "💾 Save Changes" : "✅ Create Lead"}
            </button>
            <button type="button" onClick={onHide} style={{
              padding:"12px 20px", borderRadius:12, border:"1.5px solid #e2e8f0",
              background:"#fff", color:"#64748b", fontWeight:600, fontSize:14, cursor:"pointer",
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Convert Modal ───────────────────────────────────────────── */
function ConvertModal({ show, lead, onHide, trainers, plans, onDone }) {
  const [pwd,     setPwd]     = useState("Admin@123");
  const [trainer, setTrainer] = useState("");
  const [plan,    setPlan]    = useState(plans[0]?.code || "BASIC");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setPlan(plans[0]?.code || "BASIC");
    setTrainer(trainers[0]?.account?.id || "");
  }, [plans, trainers, show]);

  if (!show || !lead) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await convertLeadToMember(lead.id, { password:pwd, assignedTrainerId:trainer || null, membershipPlanCode:plan });
      Swal.fire({ icon:"success", title:"Converted! 🎉", text:`${lead.name} is now a gym member.`, timer:2000, showConfirmButton:false });
      onDone(); onHide();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to convert", "error");
    } finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed", inset:0, zIndex:1050, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16}} onClick={onHide}>
      <div style={{background:"#fff", borderRadius:20, width:"100%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}} onClick={e => e.stopPropagation()}>
        <div style={{padding:"20px 24px", borderBottom:"1.5px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div>
            <h5 className="fw-bold mb-0" style={{color:"#1e293b"}}>Convert to Member 🏆</h5>
            <p className="text-muted mb-0" style={{fontSize:12}}>{lead.name} · {lead.phone}</p>
          </div>
          <button onClick={onHide} style={{background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"6px 10px", cursor:"pointer"}}><IconX size={18} color="#64748b"/></button>
        </div>
        <form onSubmit={submit} style={{padding:24}}>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <FInput label="Login Password" required type="text" value={pwd} onChange={e => setPwd(e.target.value)} />
            <FSelect label="Membership Plan" value={plan} onChange={e => setPlan(e.target.value)}>
              {plans.map(p => <option key={p.id} value={p.code}>{p.name} — ₹{p.price?.toLocaleString("en-IN")}/mo</option>)}
            </FSelect>
            <FSelect label="Assign Trainer (Optional)" value={trainer} onChange={e => setTrainer(e.target.value)}>
              <option value="">— No Trainer —</option>
              {trainers.map(t => <option key={t.account?.id} value={t.account?.id}>{t.account?.name}</option>)}
            </FSelect>
          </div>
          <div style={{display:"flex", gap:10, marginTop:20}}>
            <button type="submit" disabled={saving} style={{
              flex:1, padding:"12px", borderRadius:12, border:"none",
              background:"linear-gradient(135deg,#16a34a,#059669)",
              color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer",
            }}>
              {saving ? "Converting…" : "✅ Complete Conversion"}
            </button>
            <button type="button" onClick={onHide} style={{padding:"12px 16px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Registry Table ─────────────────────────────────────── */
export default function LeadRegistry() {
  const { user } = useAuth();
  const [leads,    setLeads]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [sortKey,      setSortKey]      = useState("createdAt");
  const [sortDir,      setSortDir]      = useState("desc");

  const [showAdd,     setShowAdd]     = useState(false);
  const [editLead,    setEditLead]    = useState(null);
  const [convertLead, setConvertLead] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, trainerList, planList] = await Promise.all([
        getLeads(),
        getTrainers(user?.userId || user?.id),
        getMembershipPlans({ activeOnly: true }),
      ]);
      setLeads(Array.isArray(data) ? data : []);
      setTrainers(trainerList || []);
      setPlans(planList || []);
    } catch {
      Swal.fire("Error", "Failed to load CRM data", "error");
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  /* ── Filter + Sort ─────────────────────────────────────── */
  const displayed = leads
    .filter(l => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "ALL" || l.status === statusFilter) &&
        (sourceFilter === "ALL" || l.source === sourceFilter) &&
        (!q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.email?.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let va = a[sortKey] ?? "", vb = b[sortKey] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleDelete = async (lead) => {
    const r = await Swal.fire({ title:"Delete Lead?", text:`This will permanently remove ${lead.name}.`, icon:"warning", showCancelButton:true, confirmButtonColor:"#ef4444", confirmButtonText:"Delete" });
    if (!r.isConfirmed) return;
    try { await deleteLead(lead.id); loadData(); Swal.fire({ icon:"success", title:"Deleted", timer:1200, showConfirmButton:false }); }
    catch { Swal.fire("Error","Failed to delete","error"); }
  };

  /* ── Export CSV ─────────────────────────────────────────── */
  const exportCSV = () => {
    const rows = [["Name","Phone","Email","Status","Source","Goal","Age","Gender","Conv%","Date"]];
    displayed.forEach(l => rows.push([l.name,l.phone,l.email||"",l.status,l.source,l.fitnessGoal||"",l.age||"",l.gender||"",l.conversionProbability||"",new Date(l.createdAt).toLocaleDateString("en-IN")]));
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads_registry.csv"; a.click();
  };

  /* ── Summary stats ──────────────────────────────────────── */
  const total = leads.length;
  const won   = leads.filter(l => l.status === "WON").length;
  const conv  = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <IconChevronUp size={13}/> : <IconChevronDown size={13}/>)
    : <span style={{opacity:0.3}}><IconChevronDown size={13}/></span>;

  const thStyle = (k) => ({
    padding:"12px 14px", fontSize:11.5, fontWeight:700, color:"#94a3b8",
    textTransform:"uppercase", letterSpacing:"0.06em", background:"#f8fafc",
    cursor:"pointer", whiteSpace:"nowrap", userSelect:"none",
    borderBottom:"1.5px solid #e2e8f0", borderTop:"none",
  });

  return (
    <div className="themebody-wrap">
      <div className="theme-body">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{color:"#1e293b"}}>📋 Leads Registry</h5>
          <p className="text-muted mb-0" style={{fontSize:13}}>
            {total} total · {won} converted · {conv}% conversion rate
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button onClick={exportCSV} style={{
            display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
            borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff",
            color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
          }}>
            <IconDownload size={15}/> Export CSV
          </button>
          <button onClick={loadData} style={{
            display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
            borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff",
            color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
          }}>
            <IconRefresh size={15}/>
          </button>
          <button onClick={() => { setEditLead(null); setShowAdd(true); }} style={{
            display:"flex", alignItems:"center", gap:6, padding:"9px 18px",
            borderRadius:12, border:"none",
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
            boxShadow:"0 4px 14px #6366f133",
          }}>
            <IconUserPlus size={16}/> Add Lead
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 mb-4 p-3 rounded-3" style={{background:"#fff", border:"1.5px solid #e2e8f0"}}>
        {/* Search */}
        <div className="d-flex align-items-center gap-2 flex-grow-1 px-3 py-2 rounded-2" style={{background:"#f8fafc", border:"1.5px solid #e2e8f0", minWidth:180}}>
          <IconSearch size={14} color="#94a3b8"/>
          <input type="text" placeholder="Search name, phone, email…" value={search} onChange={e => setSearch(e.target.value)}
            style={{border:"none", background:"transparent", outline:"none", fontSize:13, flex:1, color:"#1e293b"}}/>
          {search && <IconX size={13} color="#94a3b8" style={{cursor:"pointer"}} onClick={() => setSearch("")}/>}
        </div>
        {/* Status */}
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-2" style={{background:"#f8fafc", border:"1.5px solid #e2e8f0"}}>
          <IconFilter size={14} color="#94a3b8"/>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{border:"none", background:"transparent", outline:"none", fontSize:13, color:"#475569", cursor:"pointer"}}>
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
        {/* Source */}
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-2" style={{background:"#f8fafc", border:"1.5px solid #e2e8f0"}}>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            style={{border:"none", background:"transparent", outline:"none", fontSize:13, color:"#475569", cursor:"pointer"}}>
            <option value="ALL">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_META[s].emoji} {SOURCE_META[s].label}</option>)}
          </select>
        </div>
        {/* Result count */}
        <div className="ms-auto d-flex align-items-center" style={{fontSize:12.5, color:"#94a3b8", fontWeight:600}}>
          {displayed.length} of {total} leads
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div style={{background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", overflow:"hidden"}}>
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight:300}}>
            <Spinner animation="border" variant="primary" style={{width:44, height:44, borderWidth:4}}/>
            <p className="mt-3 text-muted fw-semibold">Loading registry…</p>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  {[
                    {label:"Lead",      key:"name"},
                    {label:"Contact",   key:"phone"},
                    {label:"Status",    key:"status"},
                    {label:"Source",    key:"source"},
                    {label:"Goal",      key:"fitnessGoal"},
                    {label:"Conv. %",   key:"conversionProbability"},
                    {label:"Score",     key:"leadScore"},
                    {label:"Date",      key:"createdAt"},
                    {label:"Actions",   key:null},
                  ].map(col => (
                    <th key={col.label}
                      style={thStyle(col.key)}
                      onClick={() => col.key && handleSort(col.key)}
                    >
                      <span className="d-flex align-items-center gap-1">
                        {col.label} {col.key && <SortIcon k={col.key}/>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{textAlign:"center", padding:"56px 24px", color:"#94a3b8", fontSize:15}}>
                      <div style={{fontSize:48, marginBottom:12}}>🔍</div>
                      No leads match your search criteria.
                    </td>
                  </tr>
                ) : displayed.map((lead, idx) => (
                  <tr key={lead.id} style={{
                    borderTop:"1px solid #f1f5f9",
                    background: idx % 2 === 0 ? "#fff" : "#fafafe",
                    transition:"background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background="#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafe"}
                  >
                    {/* Lead */}
                    <td style={{padding:"14px 14px"}}>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width:36, height:36, borderRadius:12, flexShrink:0,
                          background: STATUS_META[lead.status]?.color || "#6366f1",
                          color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, fontWeight:800,
                        }}>
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:700, fontSize:13.5, color:"#1e293b"}}>{lead.name}</div>
                          <div style={{fontSize:11, color:"#94a3b8"}}>{lead.gender}{lead.age && ` · ${lead.age} yrs`}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td style={{padding:"14px"}}>
                      <div style={{fontSize:13, color:"#1e293b", fontWeight:500}}>{lead.phone}</div>
                      <div style={{fontSize:11, color:"#94a3b8"}}>{lead.email || "—"}</div>
                    </td>
                    {/* Status */}
                    <td style={{padding:"14px"}}><StatusChip status={lead.status}/></td>
                    {/* Source */}
                    <td style={{padding:"14px"}}><SourceChip source={lead.source}/></td>
                    {/* Goal */}
                    <td style={{padding:"14px", fontSize:12.5, color:"#475569"}}>{lead.fitnessGoal || "—"}</td>
                    {/* Conv % */}
                    <td style={{padding:"14px"}}><ScoreBar value={lead.conversionProbability}/></td>
                    {/* Lead Score */}
                    <td style={{padding:"14px"}}>
                      {lead.leadScore ? (
                        <span style={{
                          fontWeight:800, fontSize:13.5,
                          color: lead.leadScore >= 75 ? "#16a34a" : lead.leadScore >= 50 ? "#f59e0b" : "#ef4444",
                        }}>{lead.leadScore}</span>
                      ) : <span style={{color:"#cbd5e1"}}>—</span>}
                    </td>
                    {/* Date */}
                    <td style={{padding:"14px", fontSize:12, color:"#94a3b8", whiteSpace:"nowrap"}}>
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"}) : "—"}
                    </td>
                    {/* Actions */}
                    <td style={{padding:"14px"}}>
                      <div className="d-flex gap-1">
                        <button onClick={() => { setEditLead(lead); setShowAdd(true); }}
                          title="Edit" style={{
                            width:32, height:32, borderRadius:9,
                            border:"1.5px solid #e2e8f0", background:"#fff",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            cursor:"pointer", color:"#6366f1",
                          }}>
                          <IconEdit size={15}/>
                        </button>
                        {!["WON","ARCHIVED"].includes(lead.status) && (
                          <button onClick={() => setConvertLead(lead)}
                            title="Convert to Member" style={{
                              width:32, height:32, borderRadius:9,
                              border:"1.5px solid #dcfce7", background:"#dcfce7",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              cursor:"pointer", color:"#16a34a",
                            }}>
                            <IconUserCheck size={15}/>
                          </button>
                        )}
                        <button onClick={() => handleDelete(lead)}
                          title="Delete" style={{
                            width:32, height:32, borderRadius:9,
                            border:"1.5px solid #fee2e2", background:"#fee2e2",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            cursor:"pointer", color:"#ef4444",
                          }}>
                          <IconTrash size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <LeadModal
        show={showAdd}
        lead={editLead}
        onHide={() => { setShowAdd(false); setEditLead(null); }}
        onSaved={loadData}
      />
      <ConvertModal
        show={!!convertLead}
        lead={convertLead}
        onHide={() => setConvertLead(null)}
        trainers={trainers}
        plans={plans}
        onDone={loadData}
      />
      </div>
    </div>
  );
}
