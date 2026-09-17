import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebarContext } from "../context/useSidebarContext";
import { useAuth } from "../context/AuthContext";
import logo from "/src/assets/images/logo/logo.png";
import sidebarvactor from "/src/assets/images/pro-sec.png";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendarEvent,
  IconTrophy,
  IconReportAnalytics,
  IconHeartRateMonitor,
  IconChevronLeft,
  IconReceipt2,
  IconBuildingCommunity
} from "@tabler/icons-react";

export default function CorporateSidebar() {
  const location = useLocation();
  const { toggleSidebar } = useSidebarContext();
  const { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/hr-portal", icon: <IconLayoutDashboard />, exact: true },
    { name: "Employees", path: "/hr-portal/employees", icon: <IconUsers /> },
    { name: "Attendance Logs", path: "/hr-portal/attendance", icon: <IconCalendarEvent /> },
    { name: "BMI Tracking", path: "/hr-portal/bmi", icon: <IconHeartRateMonitor /> },
    { name: "Challenges", path: "/hr-portal/challenges", icon: <IconTrophy /> },
    { name: "Billing", path: "/hr-portal/billing", icon: <IconReceipt2 /> },
    { name: "Reports", path: "/hr-portal/reports", icon: <IconReportAnalytics /> },
  ];

  return (
    <aside className="codex-sidebar">
      <div className="codex-brand">
        <Link className="d-flex align-items-center" to="/hr-portal">
          <img className="img-fluid" src={logo} alt="FitNexus" />
          <span className="fs-3 align-middle ms-2 lh-1">FitNexus</span>
        </Link>
        <div className="sidebar-action" onClick={toggleSidebar}>
          <IconChevronLeft />
        </div>
      </div>

      <div className="codex-menuwrapper custom-scroll">
        <ul className="codex-menu" style={{ left: `0px` }}>
          {menuItems.map((item, index) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <li key={index} className={`menu-item ${isActive ? "active" : ""}`}>
                <Link to={item.path}>
                  <div className="icon-item">{item.icon}</div>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
