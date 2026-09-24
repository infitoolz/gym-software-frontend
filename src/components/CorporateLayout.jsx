import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CorporateSidebar from "./CorporateSidebar";
import Header from "./Header";
import useIsMobile from "../hooks/useIsMobile";
import { useSidebarContext } from "../context/useSidebarContext";
import MobileBottomNav from "./MobileBottomNav";

export default function CorporateLayout() {
  const { user, isAuthenticated, loading, permissionsLoading } = useAuth();
  const isMobile = useIsMobile();
  const { isOpen, toggleSidebar } = useSidebarContext();

  // Wait for auth to initialize before making routing decisions
  if (loading || permissionsLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to corporate login
  if (!isAuthenticated) {
    return <Navigate to="/corporate-login" replace />;
  }

  // Authorized roles: CORPORATE_HR, ADMIN, SUPER_ADMIN
  const role = String(user?.role || "").toUpperCase();
  const isAuthorized = role === "CORPORATE_HR" || role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isAuthorized) {
    return <Navigate to="/error-page" replace />;
  }

  return (
    <div className="codex-main">
      <CorporateSidebar />
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={toggleSidebar}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
            cursor: "pointer",
          }}
        />
      )}
      <Header />
      <div className="codex-content">
        <Outlet />
      </div>
      {isMobile ? <MobileBottomNav /> : null}
    </div>
  );
}
