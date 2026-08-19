"use client";

import { useMe } from "@/hooks/auth";
import { useDesignMode } from "@/components/providers/design-mode-provider";

/**
 * Drop-in replacement for `useMe()` that automatically feeds the
 * design-mode preview role into the mock user. Outside design mode
 * the provider returns `isDesignMode: false` and `role: SYSTEM_ADMIN`,
 * so the mock user is unchanged.
 *
 * Usage:
 *   const { data: me } = useCurrentUser();
 *   // me.role will reflect the role-switcher selection in design mode
 */
export function useCurrentUser({ enabled = true } = {}) {
  const { role } = useDesignMode();
  return useMe({ enabled, previewRole: role });
}
