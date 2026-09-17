import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  IconSparkles, IconTrendingUp, IconUserExclamation,
  IconMessageChatbot, IconPhoneCall, IconTarget,
  IconArrowRight, IconBolt, IconWand, IconRefresh
} from "@tabler/icons-react";

// Mock Data
const MOCK_RENEWAL_PREDICTIONS = [
  { id: 101, name: "Suresh Kumar", plan: "Annual Premium", expiry: "2026-07-05", risk: "HIGH", reason: "Hasn't visited in 3 weeks", probability: 25 },
  { id: 102, name: "Anita Sharma", plan: "6-Month Core", expiry: "2026-06-30", risk: "MEDIUM", reason: "Visiting 1x/week (down from 4x)", probability: 55 },
  { id: 103, name: "Kiran Patel", plan: "Monthly Basic", expiry: "2026-06-25", risk: "LOW", reason: "Consistent attendance, good trainer feedback", probability: 90 },
];

const MOCK_WIN_BACK_CANDIDATES = [
  { id: 201, name: "Ramesh Iyer", lostDate: "2026-01-15", reason: "Price", suggestedOffer: "Waive joining fee + 15% off annual" },
  { id: 202, name: "Priya Singh", lostDate: "2025-11-20", reason: "Moved away", suggestedOffer: "Promote new Branch #2 near them" },
];

function Card({ children, title, icon, color }) {
  return (
    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e2e8f0", padding:24, flex:1, display:"flex", flexDirection:"column" }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width:44, height:44, borderRadius:14, background:`${color}15`, color, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {icon}
        </div>
        <h6 className="fw-bold mb-0" style={{ color:"#1e293b", fontSize:16 }}>{title}</h6>
      </div>
      {children}
    </div>
  );
}

export default function AiCrm() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate AI model loading
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight:500 }}>
        <IconSparkles size={48} className="mb-3 text-warning" style={{ animation:"spin 3s linear infinite" }}/>
        <h5 className="fw-bold text-dark mb-2">Initializing FitNexus AI...</h5>
        <p className="text-muted">Analyzing 10,000+ data points for predictive insights</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <IconSparkles className="text-warning"/> Premium AI Hub
          </h4>
          <p className="text-muted mb-0" style={{ fontSize:14 }}>Predictive analytics, automated engagement, and sales intelligence.</p>
        </div>
        <div style={{ background:"linear-gradient(135deg, #f59e0b, #ea580c)", color:"#fff", padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, display:"flex", gap:6, alignItems:"center", boxShadow:"0 4px 14px rgba(245,158,11,0.4)" }}>
          <IconBolt size={16} /> AI ENGINE ACTIVE
        </div>
      </div>

      <div className="d-flex flex-column gap-4">
        {/* Top Row: Quick Insights */}
        <div className="d-flex gap-4 flex-wrap">
          <Card title="AI Renewal Prediction" icon={<IconUserExclamation size={24}/>} color="#ef4444">
            <p style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>AI has identified members with upcoming renewals who are at risk of churning based on attendance patterns.</p>
            <div className="d-flex flex-column gap-2 flex-grow-1">
              {MOCK_RENEWAL_PREDICTIONS.map(m => (
                <div key={m.id} className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ border:"1px solid #f1f5f9", background:"#f8fafc" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{m.reason}</div>
                  </div>
                  <div className="text-end">
                    <div style={{ fontSize:12, fontWeight:800, color: m.risk==="HIGH"?"#ef4444":m.risk==="MEDIUM"?"#f59e0b":"#10b981" }}>{m.probability}% Prob.</div>
                    <button style={{ background:"none", border:"none", color:"#6366f1", fontSize:11, fontWeight:700, padding:0, marginTop:4 }}>Take Action</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="AI Win-back Campaigns" icon={<IconTarget size={24}/>} color="#8b5cf6">
            <p style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Automatically generate hyper-personalized offers for lost leads based on their specific churn reason.</p>
            <div className="d-flex flex-column gap-3 flex-grow-1">
              {MOCK_WIN_BACK_CANDIDATES.map(m => (
                <div key={m.id} className="p-3 rounded-3" style={{ border:"1.5px dashed #e2e8f0" }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontWeight:700, fontSize:13 }}>{m.name}</span>
                    <span style={{ fontSize:11, background:"#f1f5f9", padding:"2px 8px", borderRadius:10 }}>Lost: {m.reason}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#6366f1", fontWeight:600, background:"#ede9fe", padding:"8px 12px", borderRadius:8, display:"flex", gap:8, alignItems:"flex-start" }}>
                    <IconWand size={16} className="mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-dark mb-1">Suggested Offer:</div>
                      {m.suggestedOffer}
                    </div>
                  </div>
                  <button className="w-100 mt-2 py-2 rounded-2 border-0 fw-bold" style={{ background:"#8b5cf6", color:"#fff", fontSize:12 }}>Deploy Campaign</button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Row: Feature Capabilities */}
        <div style={{ background:"#1e293b", borderRadius:24, padding:32, color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, background:"#6366f1", filter:"blur(80px)", opacity:0.5 }}/>
          <h5 className="fw-bold mb-4">Lead-Level AI Features</h5>
          <p style={{ color:"#94a3b8", fontSize:14, maxWidth:600, marginBottom:32 }}>FitNexus AI analyzes communication history, demographic data, and engagement to provide real-time sales intelligence directly on every Lead Profile.</p>
          
          <div className="d-flex gap-4 flex-wrap">
            {[
              { title:"Lead Scoring", desc:"Automatically ranks leads 0-100 based on conversion likelihood.", icon:<IconTrendingUp/>, c:"#10b981" },
              { title:"Best Follow-up Time", desc:"Predicts the exact hour a lead is most likely to answer the phone.", icon:<IconPhoneCall/>, c:"#0ea5e9" },
              { title:"AI WhatsApp Reply", desc:"Drafts context-aware responses to lead messages instantly.", icon:<IconMessageChatbot/>, c:"#16a34a" },
              { title:"AI Call Summary", desc:"Transcribes and extracts action items from recorded sales calls.", icon:<IconSparkles/>, c:"#f59e0b" },
            ].map(f => (
              <div key={f.title} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:20, flex:"1 1 200px" }}>
                <div style={{ color:f.c, marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 text-center" style={{ borderTop:"1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => navigate('../inbox')} className="btn btn-outline-light border-0 d-inline-flex align-items-center gap-2 fw-bold" style={{ fontSize:14 }}>
              View a Lead Profile to see AI in action <IconArrowRight size={18}/>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
