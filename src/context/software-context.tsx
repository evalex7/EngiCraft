// src/context/software-context.tsx
"use client";

import React, { createContext, useState, useContext, Dispatch, SetStateAction } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Software as SoftwareType } from "@/lib/data";

export type Software = SoftwareType;

interface SoftwareContextType {
  selectedSoftware: Software;
  setSelectedSoftware: Dispatch<SetStateAction<Software>>;
}

const SoftwareContext = createContext<SoftwareContextType | undefined>(undefined);

export const SoftwareProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedSoftware, setSelectedSoftware] = useLocalStorage<Software>("selected-software", "Revit");

  return (
    <SoftwareContext.Provider value={{ selectedSoftware, setSelectedSoftware }}>
      {children}
    </SoftwareContext.Provider>
  );
};

export const useSoftwareContext = () => {
  const context = useContext(SoftwareContext);
  if (context === undefined) {
    throw new Error("useSoftwareContext must be used within a SoftwareProvider");
  }
  return context;
};
