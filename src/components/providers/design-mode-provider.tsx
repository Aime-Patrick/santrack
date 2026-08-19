"use client";

import React, { createContext, useContext, useState } from "react";
import type { UserRole } from "@/lib/api";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

interface DesignModeContextValue {
  /** Whether we're in design mode */
  isDesignMode: boolean;
  /** Currently selected preview role */
  role: UserRole;
  /** Change the preview role */
  setRole: (role: UserRole) => void;
}

const DesignModeContext = createContext<DesignModeContextValue>({
  isDesignMode: false,
  role: "SYSTEM_ADMIN",
  setRole: () => {},
});

/**
 * Returns the design-mode context.
 */
export function useDesignMode() {
  return useContext(DesignModeContext);
}

/**
 * Wraps the dashboard and provides a role switcher context in design mode.
 * Outside design mode, it still provides context (with isDesignMode: false)
 * so hooks like useCurrentUser can call useDesignMode() unconditionally.
 */
export function DesignModeProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("SYSTEM_ADMIN");

  return (
    <DesignModeContext.Provider
      value={{ isDesignMode: DESIGN_MODE, role, setRole }}
    >
      {children}
    </DesignModeContext.Provider>
  );
}
