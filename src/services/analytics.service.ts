import { api } from "@/lib/api";

export interface ExecutiveSummary {
  totalIndustries: number;
  totalProducts: number;
  totalBatches: number;
  totalItems: number;
  activeItems: number;
  productionRate: number;
  activeWorkforce: number;
  recentSales: number;
  pendingTransfers: number;
}

export interface IndustrySummary {
  category: string;
  count: number;
  totalEmployees: number;
}

export interface SupplyChainSummary {
  pendingShipments: number;
  inTransit: number;
  delivered: number;
  totalValue: number;
}

export const analyticsService = {
  executive: () => api.get<ExecutiveSummary>("/api/analytics/executive").then((r) => r.data),
  industry: () => api.get<IndustrySummary[]>("/api/analytics/industry").then((r) => r.data),
  supplyChain: () => api.get<SupplyChainSummary>("/api/analytics/supply-chain").then((r) => r.data),
};
