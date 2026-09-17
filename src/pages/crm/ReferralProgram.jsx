import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import {
  IconUsers, IconUserCheck, IconBriefcase, IconGift,
  IconTrophy, IconRefresh, IconPlus, IconPhone,
  IconBrandWhatsapp, IconShare, IconStar, IconCoinRupee,
  IconCheck, IconX, IconCopy, IconFlame, IconArrowUpRight,
  IconMedal, IconChevronRight, IconQrcode
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import Swal from "sweetalert2";
import { getLeads } from "../../api/leadsApi";
import { getTrainers } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";

/* ─── Constants ─────────────────────────────────────────────── */
const REWARD_SLABS = [
  { referrals: 1,  reward: 500,   label: "Starter",  color: "#94a3b8", bg: "#f1f5f9" },
  { referrals: 3,  reward: 1500,  label: "Bronze",   color: "#cd7f32", bg: "#fef3e2" },
  { referrals: 5,  reward: 3000,  label: "Silver",   color: "#64748b", bg: "#f1f5f9" },
  { referrals: 10, reward: 5000,  label: "Gold",     color: "#f59e0b", bg: "#fef9c3" },
  { referrals: 20, reward: 12000, label: "Platinum", color: "#6366f1", bg: "#ede9fe" },
];

const PARTNER_TYPES = [
  { id: "PHYSIOTHERAPIST", label: "Physiotherapist", emoji: "🏥" },
  { id: "NUTRITIONIST",    label: "Nutritionist",    emoji: "🥗" },
  { id: "YOGA_STUDIO",     label: "Yoga Studio",     emoji: "🧘" },
  { id: "SPORTS_SHOP",     label: "Sports Shop",     emoji: "👟" },
  { id: "DOCTOR",          label: "Doctor",          emoji: "👨‍⚕️" },
  { id: "CORPORATE",       label: "Corporate HR",    emoji: "🏢" },
];

const RANK_MEDAL = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
const REFERRAL_REWARD = 500; // ₹ per joined referral

/* ─── Sidebar Tab ─────────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick, accent, badge }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      width: "100%", padding: "11px 14px", marginBottom: 4,
      background: active ? accent : "transparent",
      color: active ? "#fff" : "#64748b",
      border: "none", borderRadius: 12, cursor: "pointer",
      fontWeight: active ? 700 : 500, fontSize: 13.5,
      transition: "all 0.18s",
    }}>
      {icon}
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
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

/* ─── Referrer Card ───────────────────────────────────────── */
function ReferrerCard({ referrer, rank, type = "member" }) {
  const { name, phone, totalReferrals, joined, pending, reward, code } = referrer;
  const convRate = totalReferrals > 0 ? ((joined / totalReferrals) * 100).toFixed(0) : 0;
  const slab     = [...REWARD_SLABS].reverse().find(s => joined >= s.referrals) || REWARD_SLABS[0];
  const nextSlab = REWARD_SLABS.find(s => s.referrals > joined);
  const toNext   = nextSlab ? nextSlab.referrals - joined : 0;
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  const COLOR_MAP = { 0:"#6366f1", 1:"#0ea5e9", 2:"#16a34a", 3:"#f59e0b", 4:"#ec4899" };
  const cardColor = COLOR_MAP[rank % 5];

  return (
    <div style={{
      background: "#fff", borderRadius: 20, overflow: "hidden",
      border: `1.5px solid ${slab.color}44`,
      boxShadow: `0 4px 20px ${slab.color}15`,
      transition: "all 0.22s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${slab.color}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 20px ${slab.color}15`; }}
    >
      {/* Top accent */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${slab.color}, ${slab.color}88)` }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header row */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{ position: "relative" }}>
            <div style={{
              width: 50, height: 50, borderRadius: 16, flexShrink: 0,
              background: `linear-gradient(135deg, ${cardColor}, ${cardColor}bb)`,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, boxShadow: `0 4px 12px ${cardColor}44`,
            }}>
              {initials}
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              background: slab.bg, color: slab.color,
              border: `2px solid ${slab.color}33`,
              borderRadius: 8, padding: "1px 5px", fontSize: 9, fontWeight: 800,
            }}>{slab.label}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-bold" style={{ fontSize: 15, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{phone}</div>
          </div>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{RANK_MEDAL(rank)}</div>
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Referred</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: cardColor }}>{totalReferrals}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "#dcfce7", border: "1px solid #86efac", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, textTransform: "uppercase" }}>Joined</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{joined}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "#fef9c3", border: "1px solid #fde68a", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, textTransform: "uppercase" }}>Pending</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{pending}</div>
          </div>
        </div>

        {/* Reward */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12, background: slab.bg,
          border: `1.5px solid ${slab.color}33`, marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: slab.color, fontWeight: 600, textTransform: "uppercase" }}>Reward Earned</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: slab.color }}>₹{reward.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>Conv. Rate</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#475569" }}>{convRate}%</div>
          </div>
        </div>

        {/* Progress to next slab */}
        {nextSlab && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>{toNext} more joins → {nextSlab.label} (₹{nextSlab.reward.toLocaleString("en-IN")})</span>
            </div>
            <div style={{ height: 5, background: "#f1f5f9", borderRadius: 20, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min((joined / nextSlab.referrals) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${slab.color}, ${nextSlab.color})`,
                borderRadius: 20, transition: "width 0.8s ease",
              }} />
            </div>
          </div>
        )}

        {/* Referral code + share */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 10,
            background: "#f8fafc", border: "1.5px solid #e2e8f0",
          }}>
            <IconQrcode size={14} color="#94a3b8" />
            <span style={{ fontWeight: 700, fontSize: 12, color: "#6366f1", letterSpacing: "0.1em" }}>{code}</span>
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(code); Swal.fire({ icon:"success", title:"Code Copied!", timer:1200, showConfirmButton:false }); }}
            style={{ padding:"8px 12px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", color:"#6366f1" }}
            title="Copy referral code"
          >
            <IconCopy size={14} />
          </button>
          <button
            onClick={() => Swal.fire({ icon:"info", title:"Share via WhatsApp", text:`Send "${name}'s" referral code ${code} to their contacts.` })}
            style={{ padding:"8px 12px", borderRadius:10, border:"1.5px solid #dcfce7", background:"#f0fdf4", cursor:"pointer", color:"#16a34a" }}
            title="Share on WhatsApp"
          >
            <IconBrandWhatsapp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Referrer Modal ──────────────────────────────────── */
function AddReferrerModal({ show, type, onClose, onAdd }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [partner, setPartner] = useState("PHYSIOTHERAPIST");
  const [refName, setRefName] = useState("");

  if (!show) return null;

  const submit = () => {
    if (!name.trim() || !phone.trim()) { Swal.fire("Required","Name & Phone required","warning"); return; }
    const code = `REF${name.replace(/\s/g,"").slice(0,4).toUpperCase()}${Math.floor(1000+Math.random()*9000)}`;
    onAdd({ name, phone, partnerType: partner, referredBy: refName, code, type });
    setName(""); setPhone(""); setRefName(""); onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1050, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1.5px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h6 className="fw-bold mb-0">
              {type === "member" ? "➕ Add Member Referrer" : type === "trainer" ? "🏋️ Add Trainer Referrer" : "🤝 Add Partner"}
            </h6>
            <p className="text-muted mb-0" style={{ fontSize:12 }}>Track their referral activity</p>
          </div>
          <button onClick={onClose} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"6px 10px", cursor:"pointer" }}>
            <IconX size={16} color="#64748b"/>
          </button>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="form-control" style={{ borderRadius:10, fontSize:13 }} placeholder="Arun Kumar" />
            </div>
            <div>
              <label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="form-control" style={{ borderRadius:10, fontSize:13 }} placeholder="9876543210" />
            </div>
            {type === "partner" && (
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Partner Type</label>
                <select value={partner} onChange={e => setPartner(e.target.value)} className="form-select" style={{ borderRadius:10, fontSize:13 }}>
                  {PARTNER_TYPES.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
                </select>
              </div>
            )}
            {type === "member" && (
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Referred By (optional)</label>
                <input value={refName} onChange={e => setRefName(e.target.value)} className="form-control" style={{ borderRadius:10, fontSize:13 }} placeholder="Who introduced them?" />
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button onClick={submit} style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              <IconCheck size={15} style={{ marginRight:6 }}/>Add Referrer
            </button>
            <button onClick={onClose} style={{ padding:"12px 16px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:14, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Referral List view ──────────────────────────────────── */
function ReferralList({ referrers, type, leads, onAddNew }) {
  const sorted = [...referrers].sort((a, b) => b.joined - a.joined);
  const totalReferrals = sorted.reduce((s, r) => s + r.totalReferrals, 0);
  const totalJoined    = sorted.reduce((s, r) => s + r.joined, 0);
  const totalReward    = sorted.reduce((s, r) => s + r.reward, 0);

  const typeLabel = type === "member" ? "Member" : type === "trainer" ? "Trainer" : "Partner";

  return (
    <div>
      {/* Summary strip */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { label:`${typeLabel} Referrers`, value: sorted.length,    color:"#6366f1", bg:"#ede9fe" },
          { label:"Total Referrals",        value: totalReferrals,   color:"#0ea5e9", bg:"#e0f2fe" },
          { label:"Joined",                 value: totalJoined,      color:"#16a34a", bg:"#dcfce7" },
          { label:"Rewards Issued",         value:`₹${totalReward.toLocaleString("en-IN")}`, color:"#f59e0b", bg:"#fef9c3" },
        ].map((kpi, i) => (
          <div key={i} style={{ flex:"1 1 120px", padding:"14px 16px", borderRadius:14, background:"#fff", border:"1.5px solid #e2e8f0", display:"flex", flexDirection:"column", gap:2 }}>
            <div style={{ fontSize:19, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:16 }}>
        {sorted.map((r, i) => (
          <ReferrerCard key={r.id} referrer={r} rank={i} type={type} />
        ))}
        {/* Add new card */}
        <div
          onClick={onAddNew}
          style={{
            background:"#f8fafc", borderRadius:20, border:"2px dashed #e2e8f0",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            minHeight:200, cursor:"pointer", gap:10,
            transition:"all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ede9fe"; e.currentTarget.style.borderColor = "#6366f1"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >
          <div style={{ width:48, height:48, borderRadius:14, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IconPlus size={22} color="#6366f1"/>
          </div>
          <span style={{ fontWeight:700, color:"#6366f1", fontSize:13 }}>Add {typeLabel} Referrer</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Rewards Panel ───────────────────────────────────────── */
function RewardsPanel({ allReferrers }) {
  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">🎁 Reward Structure</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Earn rewards for every successful referral join</p>
      </div>

      {/* Slab Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        {REWARD_SLABS.map((slab, i) => (
          <div key={i} style={{
            padding:"18px 20px", borderRadius:18, textAlign:"center",
            background:"#fff", border:`1.5px solid ${slab.color}44`,
            boxShadow:`0 4px 16px ${slab.color}15`,
          }}>
            <div style={{ fontSize:28, marginBottom:6 }}>
              {i === 0 ? "🎯" : i === 1 ? "🥉" : i === 2 ? "🥈" : i === 3 ? "🥇" : "💎"}
            </div>
            <div style={{ fontWeight:800, fontSize:15, color:slab.color }}>{slab.label}</div>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:8 }}>{slab.referrals}+ joins</div>
            <div style={{ fontSize:22, fontWeight:800, color:slab.color }}>₹{slab.reward.toLocaleString("en-IN")}</div>
            <div style={{ fontSize:10.5, color:"#94a3b8" }}>per month</div>
          </div>
        ))}
      </div>

      {/* Per-join reward info */}
      <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:18, padding:"20px 24px", color:"#fff", marginBottom:20 }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{ width:52, height:52, borderRadius:16, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
            💰
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>₹{REFERRAL_REWARD.toLocaleString("en-IN")} per successful join</div>
            <div style={{ opacity:0.8, fontSize:13 }}>Each referral that becomes a paid member earns you instant cash reward</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:"20px 24px" }}>
        <h6 className="fw-bold mb-4">📋 How the Referral Program Works</h6>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { step:1, title:"Get your unique referral code",     desc:"Each referrer gets a unique code like REFARUN4219",        color:"#6366f1", emoji:"🔑" },
            { step:2, title:"Share with friends & family",        desc:"Share via WhatsApp, SMS or word-of-mouth",                 color:"#0ea5e9", emoji:"📤" },
            { step:3, title:"Friend visits the gym",              desc:"They visit the gym and mention the referral code",         color:"#8b5cf6", emoji:"🏃" },
            { step:4, title:"Friend buys membership",             desc:"They purchase any membership plan",                        color:"#16a34a", emoji:"✅" },
            { step:5, title:"Referrer earns instant reward",      desc:`₹${REFERRAL_REWARD} credited to their account immediately`,color:"#f59e0b", emoji:"💰" },
          ].map(s => (
            <div key={s.step} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:12, background:s.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, flexShrink:0 }}>
                {s.step}
              </div>
              <div style={{ flex:1, paddingTop:4 }}>
                <div style={{ fontWeight:700, fontSize:13.5, color:"#1e293b" }}>{s.emoji} {s.title}</div>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Redemption Panel ────────────────────────────────────── */
function RedemptionPanel({ allReferrers }) {
  const pendingRedemption = allReferrers.filter(r => r.reward > 0 && !r.redeemed);
  const totalPending = pendingRedemption.reduce((s, r) => s + r.reward, 0);

  const handleRedeem = (referrer) => {
    Swal.fire({
      title: `Redeem ₹${referrer.reward.toLocaleString("en-IN")} for ${referrer.name}?`,
      html: `<div style="font-size:14px;line-height:2;text-align:left">
        <b>Phone:</b> ${referrer.phone}<br/>
        <b>Joins:</b> ${referrer.joined}<br/>
        <b>Amount:</b> ₹${referrer.reward.toLocaleString("en-IN")}
      </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Mark as Paid",
      confirmButtonColor: "#16a34a",
    }).then(r => {
      if (r.isConfirmed) {
        Swal.fire({ icon:"success", title:"Paid! 🎉", text:`₹${referrer.reward.toLocaleString("en-IN")} marked as redeemed for ${referrer.name}`, timer:2000, showConfirmButton:false });
      }
    });
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h6 className="fw-bold mb-0">💳 Reward Redemption</h6>
          <p className="text-muted mb-0" style={{ fontSize:12 }}>Process pending reward payouts</p>
        </div>
        <div style={{ padding:"8px 18px", borderRadius:12, background:"#dcfce7", color:"#16a34a", fontWeight:800, fontSize:14 }}>
          Total Pending: ₹{totalPending.toLocaleString("en-IN")}
        </div>
      </div>

      {pendingRedemption.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:48, textAlign:"center", color:"#94a3b8" }}>
          <div style={{ fontSize:48 }}>🎉</div>
          <p className="mt-3 fw-semibold">No pending redemptions. All rewards have been paid!</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {pendingRedemption.map((r, i) => (
            <div key={r.id} style={{
              display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
              borderRadius:14, background:"#fff", border:"1.5px solid #e2e8f0",
            }}>
              <div style={{ width:44, height:44, borderRadius:14, background:"#6366f1", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, flexShrink:0 }}>
                {r.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{r.name}</div>
                <div style={{ fontSize:12, color:"#94a3b8" }}>{r.phone} · {r.joined} joins · {r.type} referrer</div>
              </div>
              <div style={{ textAlign:"right", marginRight:8 }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#16a34a" }}>₹{r.reward.toLocaleString("en-IN")}</div>
                <div style={{ fontSize:10.5, color:"#94a3b8" }}>pending payout</div>
              </div>
              <button onClick={() => handleRedeem(r)} style={{
                padding:"9px 18px", borderRadius:12, border:"none",
                background:"linear-gradient(135deg,#16a34a,#15803d)",
                color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                flexShrink:0,
              }}>
                <IconCheck size={14} style={{ marginRight:5 }}/>Pay Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Leaderboard ─────────────────────────────────────────── */
function LeaderboardView({ allReferrers }) {
  const sorted = [...allReferrers].sort((a, b) => b.joined - a.joined);
  const top3   = sorted.slice(0, 3);

  const donutOpts = {
    chart: { type:"donut", toolbar:{ show:false } },
    labels: sorted.slice(0, 6).map(r => r.name?.split(" ")[0]),
    colors: ["#6366f1","#0ea5e9","#16a34a","#f59e0b","#ec4899","#8b5cf6"],
    legend: { position:"bottom", fontSize:"12px" },
    plotOptions: { pie: { donut: { size:"65%", labels: { show:true, total: { show:true, label:"Total Joins", fontSize:"13px", fontWeight:700, formatter: () => sorted.reduce((s,r) => s+r.joined,0) } } } } },
    dataLabels: { enabled:false },
    stroke: { width:0 },
    tooltip: { y: { formatter: v => `${v} joins` } },
  };

  return (
    <div>
      <div className="mb-4">
        <h6 className="fw-bold mb-0">🏆 Referral Leaderboard</h6>
        <p className="text-muted mb-0" style={{ fontSize:12 }}>Top referrers this month across all channels</p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{
          background:"linear-gradient(135deg,#6366f115,#8b5cf608)",
          borderRadius:20, border:"1.5px solid #e2e8f0",
          padding:"24px", marginBottom:20,
        }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:12 }}>
            {/* 2nd */}
            {top3[1] && (
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ width:52, height:52, borderRadius:18, background:"#94a3b8", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, margin:"0 auto 6px" }}>
                  {top3[1].name?.charAt(0)}
                </div>
                <div style={{ fontWeight:700, fontSize:13 }}>{top3[1].name?.split(" ")[0]}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{top3[1].joined} joins</div>
                <div style={{ height:60, background:"linear-gradient(180deg,#94a3b8,#cbd5e1)", borderRadius:"10px 10px 0 0", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:22 }}>🥈</span>
                </div>
              </div>
            )}
            {/* 1st */}
            {top3[0] && (
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ fontSize:26, marginBottom:4 }}>👑</div>
                <div style={{ width:62, height:62, borderRadius:20, background:"linear-gradient(135deg,#f59e0b,#fbbf24)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, margin:"0 auto 6px", boxShadow:"0 6px 20px #f59e0b55" }}>
                  {top3[0].name?.charAt(0)}
                </div>
                <div style={{ fontWeight:800, fontSize:14 }}>{top3[0].name?.split(" ")[0]}</div>
                <div style={{ fontSize:12, color:"#94a3b8" }}>{top3[0].joined} joins · ₹{top3[0].reward.toLocaleString("en-IN")}</div>
                <div style={{ height:90, background:"linear-gradient(180deg,#f59e0b,#fbbf24)", borderRadius:"10px 10px 0 0", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:28 }}>🥇</span>
                </div>
              </div>
            )}
            {/* 3rd */}
            {top3[2] && (
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ width:52, height:52, borderRadius:18, background:"#cd7f32", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, margin:"0 auto 6px" }}>
                  {top3[2].name?.charAt(0)}
                </div>
                <div style={{ fontWeight:700, fontSize:13 }}>{top3[2].name?.split(" ")[0]}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{top3[2].joined} joins</div>
                <div style={{ height:40, background:"linear-gradient(180deg,#cd7f32,#d97706)", borderRadius:"10px 10px 0 0", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:20 }}>🥉</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
        {/* Full ranked list */}
        <div style={{ flex:"2 1 350px", background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:20 }}>
          <h6 className="fw-bold mb-3" style={{ fontSize:13 }}>📋 Complete Rankings</h6>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {sorted.map((r, i) => {
              const slab = [...REWARD_SLABS].reverse().find(s => r.joined >= s.referrals) || REWARD_SLABS[0];
              return (
                <div key={r.id} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                  borderRadius:12, background: i === 0 ? "#fef9c3" : "#f8fafc",
                  border:`1px solid ${i === 0 ? "#fde68a" : "#f1f5f9"}`,
                }}>
                  <span style={{ fontSize:18, width:28, textAlign:"center" }}>{RANK_MEDAL(i)}</span>
                  <div style={{ width:36, height:36, borderRadius:11, background:["#6366f1","#0ea5e9","#16a34a","#f59e0b","#ec4899","#8b5cf6"][i%6], color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, flexShrink:0 }}>
                    {r.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13.5, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{r.totalReferrals} referred · {r.joined} joined · {r.type}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#16a34a" }}>₹{r.reward.toLocaleString("en-IN")}</div>
                    <div style={{ padding:"2px 8px", borderRadius:20, background:slab.bg, color:slab.color, fontSize:9.5, fontWeight:700 }}>{slab.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut chart */}
        <div style={{ flex:"1 1 240px", background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:20 }}>
          <h6 className="fw-bold mb-3" style={{ fontSize:13 }}>🍩 Join Distribution</h6>
          {sorted.length > 0 ? (
            <ReactApexChart
              options={donutOpts}
              series={sorted.slice(0,6).map(r => r.joined || 1)}
              type="donut" height={260}
            />
          ) : (
            <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
              <div style={{ fontSize:40 }}>📊</div>
              <p className="mt-2 small">Add referrers to see chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function ReferralProgram() {
  const { user } = useAuth();
  const [tab,      setTab]      = useState("members");
  const [leads,    setLeads]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);

  /* Referrers stored in localStorage (demo) */
  const [referrers, setReferrers] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_referrers");
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default demo data
    return [
      { id:1, name:"Arun Kumar",    phone:"9876543210", type:"member",  totalReferrals:12, joined:5,  pending:7, reward:2500, code:"REFARUN4219",  redeemed:false },
      { id:2, name:"Priya Sharma",  phone:"9845123456", type:"member",  totalReferrals:8,  joined:4,  pending:4, reward:2000, code:"REFPRIA8831",  redeemed:false },
      { id:3, name:"Kiran Trainer", phone:"9812345678", type:"trainer", totalReferrals:20, joined:9,  pending:11,reward:4500, code:"REFKIRA7712",  redeemed:true  },
      { id:4, name:"FitLife Physio",phone:"9800112233", type:"partner", totalReferrals:15, joined:6,  pending:9, reward:3000, code:"REFFIT5543",   redeemed:false, partnerType:"PHYSIOTHERAPIST" },
      { id:5, name:"Rahul Mehta",   phone:"9987654321", type:"member",  totalReferrals:5,  joined:2,  pending:3, reward:1000, code:"REFRAHU6621",  redeemed:false },
      { id:6, name:"Anita Nair",    phone:"9765432100", type:"trainer", totalReferrals:11, joined:7,  pending:4, reward:3500, code:"REFANIT9934",  redeemed:false },
    ];
  });

  const save = (updated) => {
    setReferrers(updated);
    localStorage.setItem("crm_referrers", JSON.stringify(updated));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, trainerList] = await Promise.all([
        getLeads(),
        getTrainers(user?.userId || user?.id),
      ]);
      setLeads(Array.isArray(data) ? data : []);
      setTrainers(trainerList || []);
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Augment referrers with leads data
  const enrichedReferrers = referrers.map(r => {
    const refLeads = leads.filter(l => l.source === "REFERRAL" && (l.notes?.includes(r.code) || l.referralCode === r.code));
    const liveJoins = refLeads.filter(l => l.status === "WON").length;
    return {
      ...r,
      joined:         r.joined + liveJoins,
      totalReferrals: r.totalReferrals + refLeads.length,
      reward:         (r.joined + liveJoins) * REFERRAL_REWARD,
    };
  });

  const memberReferrers  = enrichedReferrers.filter(r => r.type === "member");
  const trainerReferrers = enrichedReferrers.filter(r => r.type === "trainer");
  const partnerReferrers = enrichedReferrers.filter(r => r.type === "partner");

  const addReferrer = ({ name, phone, code, type, partnerType }) => {
    const newR = {
      id: Date.now(),
      name, phone, type, code, partnerType,
      totalReferrals: 0, joined: 0, pending: 0, reward: 0, redeemed: false,
    };
    const updated = [...referrers, newR];
    save(updated);
    Swal.fire({ icon:"success", title:"Referrer Added!", timer:1500, showConfirmButton:false });
  };

  /* Totals */
  const totalReferrers  = enrichedReferrers.length;
  const totalJoins      = enrichedReferrers.reduce((s, r) => s + r.joined, 0);
  const totalRewards    = enrichedReferrers.reduce((s, r) => s + r.reward, 0);
  const topReferrer     = [...enrichedReferrers].sort((a, b) => b.joined - a.joined)[0];

  const ACCENT = "#6366f1";
  const TABS = [
    { id:"members",   label:"Member Referrals",  icon:<IconUsers size={18}/>,     badge: memberReferrers.length  },
    { id:"trainers",  label:"Trainer Referrals",  icon:<IconUserCheck size={18}/>, badge: trainerReferrers.length },
    { id:"partners",  label:"Partner Referrals",  icon:<IconBriefcase size={18}/>, badge: partnerReferrers.length },
    { id:"rewards",   label:"Rewards",            icon:<IconGift size={18}/>       },
    { id:"redemption",label:"Redemption",         icon:<IconCoinRupee size={18}/>  },
    { id:"leaderboard",label:"Leaderboard",       icon:<IconTrophy size={18}/>     },
  ];

  const activeType = { members:"member", trainers:"trainer", partners:"partner" }[tab];
  const activeList = { members:memberReferrers, trainers:trainerReferrers, partners:partnerReferrers }[tab];

  return (
    <div style={{ display:"flex", gap:20 }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{ width:240, flexShrink:0, background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:16, alignSelf:"flex-start", position:"sticky", top:0 }}>
        <div className="mb-3 px-2">
          <div className="fw-bold" style={{ fontSize:14, color:"#1e293b" }}>🌟 Referral Program</div>
          <div className="text-muted" style={{ fontSize:11 }}>Track & reward referrals</div>
        </div>

        {TABS.map(t => (
          <TabBtn key={t.id} icon={t.icon} label={t.label} badge={t.badge}
            active={tab === t.id} onClick={() => setTab(t.id)} accent={ACCENT} />
        ))}

        <div className="mt-3 pt-3" style={{ borderTop:"1px solid #f1f5f9" }}>
          <button onClick={load} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontSize:12, cursor:"pointer" }}>
            <IconRefresh size={14}/> Refresh
          </button>
        </div>

        {/* Top referrer spotlight */}
        {topReferrer && (
          <div className="mt-3 p-3 rounded-3" style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
            <div style={{ fontSize:11, color:"rgba(0,0,0,0.5)", fontWeight:700 }}>⭐ TOP REFERRER</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#1e293b", marginTop:2 }}>{topReferrer.name?.split(" ")[0]}</div>
            <div style={{ fontSize:11.5, color:"rgba(0,0,0,0.6)", marginTop:2 }}>
              {topReferrer.totalReferrals} referrals · {topReferrer.joined} joined<br/>
              Reward ₹{topReferrer.reward.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        {/* Program stats */}
        <div className="mt-2 p-3 rounded-3" style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>TOTAL REWARDS ISSUED</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>₹{totalRewards.toLocaleString("en-IN")}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>{totalJoins} members joined via referral</div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* KPI Row */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          {[
            { label:"Total Referrers", value:totalReferrers,                            color:"#6366f1", bg:"#ede9fe", icon:<IconUsers size={20}/> },
            { label:"Total Referrals", value:enrichedReferrers.reduce((s,r)=>s+r.totalReferrals,0), color:"#0ea5e9", bg:"#e0f2fe", icon:<IconShare size={20}/> },
            { label:"Joined",          value:totalJoins,                                color:"#16a34a", bg:"#dcfce7", icon:<IconUserCheck size={20}/> },
            { label:"Rewards Issued",  value:`₹${totalRewards.toLocaleString("en-IN")}`,color:"#f59e0b", bg:"#fef9c3", icon:<IconGift size={20}/> },
            { label:"Conv. Rate",      value: enrichedReferrers.reduce((s,r)=>s+r.totalReferrals,0) > 0 ? `${((totalJoins/enrichedReferrers.reduce((s,r)=>s+r.totalReferrals,0))*100).toFixed(0)}%` : "0%", color:"#10b981", bg:"#dcfce7", icon:<IconFlame size={20}/> },
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

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight:300 }}>
            <Spinner animation="border" variant="primary" style={{ width:48, height:48, borderWidth:4 }}/>
            <p className="mt-3 text-muted fw-semibold">Loading referral data…</p>
          </div>
        ) : (
          <>
            {["members","trainers","partners"].includes(tab) && (
              <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h6 className="fw-bold mb-0">
                      {tab === "members" ? "👥 Member Referrals" : tab === "trainers" ? "🏋️ Trainer Referrals" : "🤝 Partner Referrals"}
                    </h6>
                    <p className="text-muted mb-0" style={{ fontSize:12 }}>
                      {tab === "partners" ? "Businesses & professionals who refer clients" : "Existing members/trainers who bring new members"}
                    </p>
                  </div>
                  <button onClick={() => setShowAdd(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    <IconPlus size={15}/> Add Referrer
                  </button>
                </div>
                <ReferralList referrers={activeList} type={activeType} leads={leads} onAddNew={() => setShowAdd(true)} />
              </div>
            )}
            {tab === "rewards"    && <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}><RewardsPanel allReferrers={enrichedReferrers}/></div>}
            {tab === "redemption" && <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}><RedemptionPanel allReferrers={enrichedReferrers}/></div>}
            {tab === "leaderboard"&& <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e2e8f0", padding:24 }}><LeaderboardView allReferrers={enrichedReferrers}/></div>}
          </>
        )}
      </div>

      {/* Add Referrer Modal */}
      <AddReferrerModal
        show={showAdd}
        type={activeType || "member"}
        onClose={() => setShowAdd(false)}
        onAdd={addReferrer}
      />
    </div>
  );
}
