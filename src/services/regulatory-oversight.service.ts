import { api } from "@/lib/api";

export type RegulatoryOversightSummary = { authorities: Array<{ authority: { id: number; code: string; name: string }; open: number; overdue: number; unassigned: number; resolved: number; overdueReferrals: number }>; referrals: { pending: number; accepted: number; declined: number } };
export const regulatoryOversightService = { summary: () => api.get<RegulatoryOversightSummary>("/api/regulatory-oversight/summary").then((r) => r.data) };
