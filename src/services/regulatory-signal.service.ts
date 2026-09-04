import { api } from "@/lib/api";

export type RegulatorySignal = {
  type: "MATCHING_MARKET_REPORTS" | "CLONED_LABEL_SIGNAL" | "REPORT_ON_BLOCKED_BATCH";
  severity: "WATCH" | "HIGH";
  title: string; detail: string; batchId: number | null; batchCode: string | null;
  itemCode: string | null; count: number; firstSeenAt: string; lastSeenAt: string;
};

export const regulatorySignalService = {
  list: () => api.get<RegulatorySignal[]>("/api/regulator/signals").then((response) => response.data),
};
