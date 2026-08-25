import { api } from "@/lib/api";

export interface ExecutiveSummary {
  industry: {
    licensedIndustries: number;
    activeLicenses: number;
    inactiveLicenses: number;
    totalLicenses: number;
  };
  supplyChain: {
    availableUnits: number;
    distinctProducts: number;
    stockOutProducts: number;
    inTransitUnits: number;
    inTransitShipments: number;
    rawMaterialCount: number;
    lowRawMaterials: number;
    distributionVolumes: number;
  };
  market: {
    productsSold: number;
    revenueSeries: Array<{ day: string; label: string; total: number }>;
    topProducts: Array<{ productId: number; productName: string; units: number }>;
    consumerSales: number;
  };
  finance: {
    revenue: number;
    receivables: number;
    outstandingReceivables: number;
    expenses: number;
    payrollCost: number;
    netProfit: number;
    openInvoices: number;
  };
  compliance: {
    activeLicenses: number;
    expiredLicenses: number;
    pendingReviews: number;
    recalledItems: number;
    recalledBatches: number;
    inspectionFindings: Record<string, number>;
    quarantinedItems: number;
  };
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

export interface PlatformCounts {
  totalUsers: number;
  totalProducts: number;
  totalEmployees: number;
}

export interface ProductionTrend {
  date: string;
  label: string;
  produced: number;
  target: number;
}

export const analyticsService = {
  executive: () => api.get<ExecutiveSummary>("/api/analytics/executive").then((r) => r.data),
  counts: () => api.get<PlatformCounts>("/api/analytics/counts").then((r) => r.data),
  productionTrend: () => api.get<ProductionTrend[]>("/api/analytics/production-trend").then((r) => r.data),
  industry: () => api.get<IndustrySummary[]>("/api/analytics/industry").then((r) => r.data),
  industryCategories: () => api.get<IndustrySummary[]>("/api/analytics/industry-categories").then((r) => r.data),
  supplyChain: () => api.get<SupplyChainSummary>("/api/analytics/supply-chain").then((r) => r.data),
};
