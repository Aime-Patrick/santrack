import { api } from "@/lib/api";

export type RegulatoryCommandSummary = {
  activeCases: number; overdueCases: number; unassignedCases: number; activeRecalls: number;
  marketReportsToTriage: number; highAttentionSignals: number; inspectionsToday: number;
  supervisedBusinesses: number;
};

export const regulatoryCommandService = {
  summary: () => api.get<RegulatoryCommandSummary>("/api/regulator/command").then((response) => response.data),
};
