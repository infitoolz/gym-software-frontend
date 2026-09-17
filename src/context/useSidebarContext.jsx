// src/context/SidebarContext.js
// Sidebar is always in compact (icon-only) mode. The flyout panel handles submenus.
import React, { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Always compact — the narrow icon rail is the permanent layout.
  // The flyout panel (in Sidebar.jsx) handles submenus on click.
  useEffect(() => {
    document.body.setAttribute('data-bs-sidebar', 'compact');
  }, []);

  const toggleSidebar = () => setIsOpen(prev => !prev);
  const closeSidebar = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isCompact: true, isOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};