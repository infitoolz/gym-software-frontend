import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path as needed
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import FloatingChatbot from './FloatingChatbot';
import PinLockGate from './PinLockGate';
import useIsMobile from '../hooks/useIsMobile';
import { findPageByPath } from '../config/pagePermissions';
import { useSidebarContext } from '../context/useSidebarContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading, permissionsLoading, hasPermission, user } = useAuth();
    const isMobile = useIsMobile();
    const location = useLocation();
    const { isCompact, isOpen, toggleSidebar } = useSidebarContext();

    // Show loading while checking auth
    if (loading || permissionsLoading) {
        console.log("ProtectedRoute - Still checking authentication...");
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        console.warn("ProtectedRoute - Not authenticated, redirecting to /sign-in");
        return <Navigate to="/sign-in" replace />;
    }

    const currentPage = findPageByPath(location.pathname);
    if (currentPage && !hasPermission(currentPage.key, "view")) {
        // If they navigate to the root dashboard but don't have permission, send COUNSELOR to sales-portal
        if (location.pathname === "/" && user?.role === "COUNSELOR") {
            return <Navigate to="/sales-portal" replace />;
        }
        return <Navigate to="/error-page" replace />;
    }

    // If authenticated, render the nested routes (behind the PIN lock if enabled)
    console.log("ProtectedRoute - Authenticated, rendering protected content");
    return (
    <PinLockGate>
    <div className="codex-main">
        <Sidebar />
        {/* Backdrop: on tablet/mobile the sidebar overlaps content, so
            clicking outside it closes the sidebar. Hidden on desktop via CSS. */}
        {isOpen && (
            <div
                className="sidebar-backdrop"
                onClick={toggleSidebar}
                aria-hidden="true"
                style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
                    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99, cursor: "pointer"
                }}
            />
        )}
        <Header />
        <div className="codex-content">
            <Outlet />
        </div>
        {isMobile ? <MobileBottomNav /> : null}
        <FloatingChatbot />
    </div>
    </PinLockGate>
);
}
