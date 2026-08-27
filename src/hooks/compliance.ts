"use client";

import { useQuery } from "@tanstack/react-query";
import { previewOverview } from "@/lib/compliance-fixtures";
import { complianceService } from "@/services/compliance.service";

/** Preview only. See the warning at the top of `lib/compliance-fixtures.ts`. */
const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

export const complianceKeys = {
  all: ["compliance"] as const,
  overview: () => [...complianceKeys.all, "overview"] as const,
};

/**
 * The server's compliance picture for this organization.
 *
 * Short `staleTime`: a licence can be suspended between two glances at this
 * screen, and a stale PASS is the one kind of wrong answer this screen must
 * not give. It is refetched on focus for the same reason.
 */
export function useComplianceOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: complianceKeys.overview(),
    queryFn: DESIGN_MODE
      ? async () => previewOverview()
      : complianceService.overview,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
