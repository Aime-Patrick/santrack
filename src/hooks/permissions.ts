"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { CapabilityCatalogue } from "@/lib/api";
import { permissionsOf, type PermissionSet } from "@/lib/permissions";
import { useCurrentUser } from "./use-current-user";

/**
 * What the signed-in user may do.
 *
 * The single gate for the whole UI. Components ask this rather than looking at
 * `me.role`: a role tells you someone's job title, and two people with the
 * same title at a manufacturer and at a licensing authority do not see the
 * same platform.
 */
export function useCapabilities(): PermissionSet {
  const { data: me, isLoading } = useCurrentUser();
  return useMemo(() => permissionsOf(me, isLoading), [me, isLoading]);
}

export const capabilityKeys = {
  catalogue: ["auth", "capabilities"] as const,
};

/**
 * The role/capability reference table for the Roles screen.
 *
 * Fetched rather than hard-coded for the same reason the caller's own list is:
 * a Roles screen that shows a table the server does not use is worse than no
 * Roles screen, because an administrator reads it and believes it.
 */
export function useCapabilityCatalogue() {
  return useQuery<CapabilityCatalogue>({
    queryKey: capabilityKeys.catalogue,
    queryFn: authService.capabilities,
    // Reference data — it only changes when the platform is redeployed.
    staleTime: 60 * 60_000,
  });
}
