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
  /**
   * Preview the user as staff of a licensing authority.
   *
   * Some capabilities come from the organization's standing rather than the
   * job title — sight of the industry register is the one that matters here —
   * so a role alone cannot preview the supervisory screens.
   */
  standing: boolean;
  setStanding: (standing: boolean) => void;
}

const DesignModeContext = createContext<DesignModeContextValue>({
  isDesignMode: false,
  role: "SYSTEM_ADMIN",
  setRole: () => {},
  standing: false,
  setStanding: () => {},
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
  const [standing, setStanding] = useState(false);

  return (
    <DesignModeContext.Provider
      value={{ isDesignMode: DESIGN_MODE, role, setRole, standing, setStanding }}
    >
      {children}
    </DesignModeContext.Provider>
  );
}
