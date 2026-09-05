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

export function useCaseTimeline(caseId: number, limit = 50) {
  return useQuery({
    queryKey: ["accountability", "case", caseId, limit],
    queryFn: () => accountabilityService.caseTimeline(caseId, limit),
    enabled: caseId > 0,
  });
}

export function useFacilityTimeline(facilityId: number, limit = 50) {
  return useQuery({
    queryKey: ["accountability", "facility", facilityId, limit],
    queryFn: () => accountabilityService.facilityTimeline(facilityId, limit),
    enabled: facilityId > 0,
  });
}

export function useLicenceTimeline(licenceId: number, limit = 50) {
  return useQuery({
    queryKey: ["accountability", "licence", licenceId, limit],
    queryFn: () => accountabilityService.licenceTimeline(licenceId, limit),
    enabled: licenceId > 0,
  });
}

export function useProductTimeline(productId: number, limit = 50) {
  return useQuery({
    queryKey: ["accountability", "product", productId, limit],
    queryFn: () => accountabilityService.productTimeline(productId, limit),
    enabled: productId > 0,
  });
}

export function useBatchTimeline(batchId: number, limit = 30) {
  return useQuery({
    queryKey: ["accountability", "batch", batchId, limit],
    queryFn: () => accountabilityService.batchTimeline(batchId, limit),
    enabled: batchId > 0,
  });
}
