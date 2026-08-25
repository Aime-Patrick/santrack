"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["analytics", "executive"],
    queryFn: analyticsService.executive,
  });
}

export function useCounts() {
  return useQuery({
    queryKey: ["analytics", "counts"],
    queryFn: analyticsService.counts,
  });
}

export function useProductionTrend() {
  return useQuery({
    queryKey: ["analytics", "production-trend"],
    queryFn: analyticsService.productionTrend,
  });
}

export function useIndustrySummary() {
  return useQuery({
    queryKey: ["analytics", "industry"],
    queryFn: analyticsService.industry,
  });
}

export function useIndustryCategories() {
  return useQuery({
    queryKey: ["analytics", "industry-categories"],
    queryFn: analyticsService.industryCategories,
  });
}

export function useSupplyChainSummary() {
  return useQuery({
    queryKey: ["analytics", "supply-chain"],
    queryFn: analyticsService.supplyChain,
  });
}
