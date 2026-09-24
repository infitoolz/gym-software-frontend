import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebarContext } from "../context/useSidebarContext";
import { useAuth } from "../context/AuthContext";
import logo from "/src/assets/images/logo/logo.png";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendarEvent,
  IconTrophy,
  IconReportAnalytics,
  IconHeartRateMonitor,
  IconReceipt2,
  IconBuildingCommunity,
  IconSettings,
} from "@tabler/icons-react";

export default function CorporateSidebar() {
  const location = useLocation();
  const { isCollapsed, isOpen, closeSidebar } = useSidebarContext();
  const { user } = useAuth();
  const sidebarRef = useRef(null);

  const menuItems = [
    { name: "Dashboard", path: "/hr-portal", icon: <IconLayoutDashboard size={20} />, exact: true },
    { name: "Employees", path: "/hr-portal/employees", icon: <IconUsers size={20} /> },
    { name: "Attendance Logs", path: "/hr-portal/attendance", icon: <IconCalendarEvent size={20} /> },
    { name: "BMI Tracking", path: "/hr-portal/bmi", icon: <IconHeartRateMonitor size={20} /> },
    { name: "Challenges", path: "/hr-portal/challenges", icon: <IconTrophy size={20} /> },
    { name: "Billing", path: "/hr-portal/billing", icon: <IconReceipt2 size={20} /> },
    { name: "Reports", path: "/hr-portal/reports", icon: <IconReportAnalytics size={20} /> },
    { name: "Settings", path: "/hr-portal/profile", icon: <IconSettings size={20} /> },
  ];

  return (
    <aside
      className={`sidebar-rail ${isCollapsed ? "is-collapsed" : "is-expanded"} ${isOpen ? "mobile-open" : ""}`}
      ref={sidebarRef}
    >
      {/* Brand Logo Area */}
      <div className="rail-logo">
        <Link
          to="/hr-portal"
          className="d-flex align-items-center justify-content-center text-decoration-none w-100 h-100"
          onClick={() => {
            if (window.innerWidth < 768) closeSidebar();
          }}
        >
          <img src={logo} alt="FitNexa Gym Management" className="rail-logo-img" />
        </Link>
      </div>

      {/* HR Portal Header Badge */}
      {!isCollapsed && (
        <div
          className="px-3 py-2 border-bottom"
          style={{ borderColor: "rgba(255, 255, 255, 0.07)", backgroundColor: "rgba(0, 0, 0, 0.15)" }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <span
              className="badge d-inline-flex align-items-center gap-1"
              style={{
                background: "rgba(0, 102, 255, 0.18)",
                color: "#00d2f4",
                border: "1px solid rgba(0, 210, 244, 0.3)",
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: "0.6px",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              <IconBuildingCommunity size={13} />
              HR PORTAL
            </span>
            <span
              className="text-white-50 text-truncate"
              style={{ fontSize: "11px", maxWidth: "115px", fontWeight: 500 }}
              title={user?.name || "Corporate"}
            >
              {user?.name || "Corporate"}
            </span>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="rail-nav custom-scroll">
        <ul className="rail-list">
          {menuItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path || location.pathname === item.path + "/"
              : location.pathname.startsWith(item.path);

            return (
              <li
                key={item.path}
                className={`sidebar-rail-item ${isActive ? "active" : ""}`}
                title={item.name}
                onClick={() => {
                  if (window.innerWidth < 768) closeSidebar();
                }}
              >
                <Link to={item.path} className="d-flex align-items-center w-100 text-decoration-none">
                  <span className="rail-icon">{item.icon}</span>
                  <span className="rail-label">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer User Info */}
      <div
        className="p-2"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          backgroundColor: "rgba(9, 17, 30, 0.8)",
        }}
      >
        {isCollapsed ? (
          <Link
            to="/hr-portal/profile"
            className="sidebar-rail-item text-decoration-none"
            title={user?.name || "Account Settings"}
            style={{ margin: "2px auto" }}
          >
            <span className="rail-icon text-muted">
              <IconBuildingCommunity size={20} />
            </span>
          </Link>
        ) : (
          <Link
            to="/hr-portal/profile"
            className="d-flex align-items-center justify-content-between px-2 py-1 text-decoration-none rounded-2"
            title="View Account Settings"
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #0052cc 0%, #00d2f4 100%)",
                  fontSize: "12px",
                }}
              >
                {(user?.name || "HR")[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-white fw-semibold text-truncate" style={{ fontSize: "12.5px" }}>
                  {user?.name || "HR Manager"}
                </div>
                <div className="text-white-50 text-truncate" style={{ fontSize: "10.5px" }}>
                  {user?.email || "Corporate HR"}
                </div>
              </div>
            </div>
            <IconSettings size={16} className="text-white-50 flex-shrink-0 ms-1" />
          </Link>
        )}
      </div>
    </aside>
  );
}
