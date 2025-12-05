"use client";

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useIsMobile } from "@/hooks/use-mobile"

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextType = {
  state: "expanded" | "collapsed";
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const savedState = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
      ?.split('=')[1];
    if (savedState) {
      setIsExpanded(savedState === 'true');
    }
  }, []);

  const setExpanded = useCallback((value: boolean | ((value: boolean) => boolean)) => {
    const newState = typeof value === 'function' ? value(isExpanded) : value;
    setIsExpanded(newState);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${newState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, [isExpanded]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      setExpanded(prev => !prev);
    }
  }, [isMobile, setExpanded]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);


  const state = isExpanded ? "expanded" : "collapsed";

  const contextValue = {
    state,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
        {children}
    </SidebarContext.Provider>
  );
};
