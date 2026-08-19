"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["analytics", "executive"],
    queryFn: analyticsService.executive,
  });
}

export function useIndustrySummary() {
  return useQuery({
    queryKey: ["analytics", "industry"],
    queryFn: analyticsService.industry,
  });
}

export function useSupplyChainSummary() {
  return useQuery({
    queryKey: ["analytics", "supply-chain"],
    queryFn: analyticsService.supplyChain,
  });
}
