import React from "react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebarContext } from "../context/useSidebarContext";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3.5 20c0-3.31 2.69-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 20c0-3.31-2.69-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 4v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8h3a1 1 0 0 1 1 1v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 8h2M7 12h2M7 16h2M12 8h1M12 12h1M12 16h1M17 12h1M17 16h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSchedule() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 9h8M8 12.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMenuFab() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 6h4M11 6h8M5 12h8M15 12h4M5 18h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MobileBottomNavButton({ active, label, icon, onClick }) {
  return (
    <button type="button" className={`fit-mobile-nav-item${active ? " active" : ""}`} onClick={onClick} aria-label={label}>
      <span className="fit-mobile-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="fit-mobile-nav-label">{label}</span>
    </button>
  );
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toggleSidebar } = useSidebarContext();

  const currentRole = String(user?.role || "").toUpperCase();
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(currentRole);
  const isStaff = ["MANAGER", "TRAINER"].includes(currentRole);

  const activeKey = useMemo(() => {
    const path = location.pathname || "";
    if (path === "/" || path.startsWith("/dashboard")) return "home";
    if (path.startsWith("/users") || path.startsWith("/employees")) return "users";
    if (path.startsWith("/branches")) return "branches";
    if (path.startsWith("/schedule")) return "schedule";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/wellness-chat")) return "chat";
    return "home";
  }, [location.pathname]);

  const items = isAdmin
    ? [
        { key: "home", label: "Home", icon: <IconHome />, to: "/" },
        { key: "users", label: "Users", icon: <IconUsers />, to: "/users" },
        { key: "branches", label: "Branches", icon: <IconBuilding />, to: "/branches" },
        { key: "profile", label: "Profile", icon: <IconProfile />, to: "/profile" },
      ]
    : isStaff
      ? [
          { key: "home", label: "Home", icon: <IconHome />, to: "/" },
          { key: "users", label: "Users", icon: <IconUsers />, to: "/users" },
          { key: "schedule", label: "Schedule", icon: <IconSchedule />, to: "/schedule" },
          { key: "profile", label: "Profile", icon: <IconProfile />, to: "/profile" },
        ]
      : [
          { key: "home", label: "Home", icon: <IconHome />, to: "/" },
          { key: "schedule", label: "Schedule", icon: <IconSchedule />, to: "/schedule" },
          { key: "profile", label: "Profile", icon: <IconProfile />, to: "/profile" },
          { key: "chat", label: "Chat", icon: <IconChat />, to: "/wellness-chat" },
        ];

  const middleIndex = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, middleIndex);
  const rightItems = items.slice(middleIndex);

  return (
    <nav className="fit-mobile-nav" aria-label="Mobile navigation">
      <div className="fit-mobile-nav-inner">
        {leftItems.map((item) => (
          <MobileBottomNavButton
            key={item.key}
            active={activeKey === item.key}
            label={item.label}
            icon={item.icon}
            onClick={() => navigate(item.to)}
          />
        ))}

        <button type="button" className="fit-mobile-fab" onClick={toggleSidebar} aria-label="Toggle menu">
          <span className="fit-mobile-fab-icon" aria-hidden="true">
            <IconMenuFab />
          </span>
        </button>

        {rightItems.map((item) => (
          <MobileBottomNavButton
            key={item.key}
            active={activeKey === item.key}
            label={item.label}
            icon={item.icon}
            onClick={() => navigate(item.to)}
          />
        ))}
      </div>
    </nav>
  );
}
