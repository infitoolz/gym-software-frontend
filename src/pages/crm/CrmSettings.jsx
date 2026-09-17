import React from "react";
import { useNavigate } from "react-router-dom";
import { IconSettings, IconBell, IconShieldLock, IconDatabase, IconUsers, IconPlugConnected } from "@tabler/icons-react";

export default function CrmSettings() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <IconSettings size={28} className="text-muted" /> CRM Settings
        </h4>
        <p className="text-muted" style={{ fontSize: 14 }}>Manage your Lead CRM preferences, pipelines, and integrations.</p>
      </div>

      <div className="d-flex flex-column gap-3">
        {[
          { title: "General Preferences", desc: "Language, timezone, and display settings", icon: <IconSettings size={24}/>, c: "#6366f1" },
          { title: "Integrations & Webhooks", desc: "Manage Facebook, Instagram, Website, and WhatsApp connections", icon: <IconPlugConnected size={24}/>, c: "#8b5cf6", path: "../integrations" },
          { title: "Notification Rules", desc: "Configure email, SMS, and push notifications for new leads", icon: <IconBell size={24}/>, c: "#f59e0b" },
          { title: "Team & Permissions", desc: "Manage counselor roles, access levels, and round-robin assignment", icon: <IconUsers size={24}/>, c: "#0ea5e9" },
          { title: "Data Management", desc: "Import/Export leads, custom fields, and tags mapping", icon: <IconDatabase size={24}/>, c: "#10b981" },
          { title: "Security & Access", desc: "Two-factor authentication and active session management", icon: <IconShieldLock size={24}/>, c: "#ef4444" },
        ].map((s, i) => (
          <div key={i} className="d-flex align-items-center justify-content-between p-4" style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, cursor:"pointer" }} onClick={() => s.path && navigate(s.path)}>
            <div className="d-flex align-items-center gap-4">
              <div style={{ width:48, height:48, borderRadius:14, background:`${s.c}15`, color:s.c, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#1e293b", marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:13, color:"#64748b" }}>{s.desc}</div>
              </div>
            </div>
            <button className="btn btn-light border-0 fw-bold" style={{ fontSize:13 }}>Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}
