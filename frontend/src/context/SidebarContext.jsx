import React, { createContext, useEffect, useState } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const value = {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed: () => setIsCollapsed((current) => !current),
    isMobileOpen,
    setIsMobileOpen,
    openMobile: () => setIsMobileOpen(true),
    closeMobile: () => setIsMobileOpen(false),
    toggleMobile: () => setIsMobileOpen((current) => !current),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export { SidebarContext };
// eslint-disable-next-line react-refresh/only-export-components
export { useSidebar } from './useSidebar';
