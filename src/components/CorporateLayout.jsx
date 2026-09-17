import React from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container } from "react-bootstrap";
import CorporateSidebar from "./CorporateSidebar";
import Header from "./Header";
import useIsMobile from "../hooks/useIsMobile";
import { useSidebarContext } from "../context/useSidebarContext";
import MobileBottomNav from "./MobileBottomNav";

export default function CorporateLayout() {
  const { user, isAuthenticated, loading, permissionsLoading } = useAuth();
  const isMobile = useIsMobile();
  const { isCompact, toggleSidebar } = useSidebarContext();

  // Wait for auth to initialize before making routing decisions
  if (loading || permissionsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect them.
  if (!isAuthenticated) {
    return <Navigate to="/corporate-login" replace />;
  }
  if (user?.role !== "CORPORATE_HR") {
    return (
      <div className="alert alert-danger m-5">
        Debug: You are not CORPORATE_HR. Your role is: {user?.role || "undefined"}
      </div>
    );
  }

  return (
    <div className="codex-main">
        <CorporateSidebar />
        {!isCompact && (
            <div
                className="sidebar-backdrop"
                onClick={toggleSidebar}
                aria-hidden="true"
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
