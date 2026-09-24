// src/context/SidebarContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  // Collapsed state: always default to false (expanded) so menus work cleanly
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile drawer open state (< 768px)
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Clear any stale collapsed state from previous sessions
    try {
      localStorage.removeItem("fitnexa_sidebar_collapsed");
    } catch {}
  }, []);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
      document.body.setAttribute('data-sidebar-collapsed', 'true');
      document.body.setAttribute('data-bs-sidebar', 'compact');
    } else {
      document.body.classList.remove('sidebar-collapsed');
      document.body.setAttribute('data-sidebar-collapsed', 'false');
      document.body.setAttribute('data-bs-sidebar', 'default');
    }
    try {
      localStorage.setItem("fitnexa_sidebar_collapsed", isCollapsed ? "true" : "false");
    } catch (e) {
      console.warn("Could not save sidebar state:", e);
    }
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isCompact: isCollapsed,
        isOpen,
        toggleSidebar,
        toggleCollapse,
        setIsCollapsed,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};