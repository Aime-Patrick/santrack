"use client";

import { useQuery } from "@tanstack/react-query";
import { accountabilityService } from "@/services/accountability.service";

export function useOrganizationTimeline(orgId: number, limit = 50) {
  return useQuery({
    queryKey: ["accountability", "organization", orgId, limit],
    queryFn: () => accountabilityService.organizationTimeline(orgId, limit),
    enabled: orgId > 0,
  });
}

export function useBatchTimeline(batchId: number, limit = 30) {
  return useQuery({
    queryKey: ["accountability", "batch", batchId, limit],
    queryFn: () => accountabilityService.batchTimeline(batchId, limit),
    enabled: batchId > 0,
  });
}
