import { api } from "@/lib/api";

export type RegulatoryReferral = {
  id: number; status: "PENDING" | "ACCEPTED" | "REJECTED"; reason: string; referredAt: string;
  case: { id: number; caseNumber: string | null; title: string };
  fromAuthority: { id: number; name: string }; toAuthority: { id: number; name: string };
  decisionNote: string | null; decidedAt: string | null;
  overdue?: boolean;
};

export const regulatoryReferralService = {
  refer: (caseId: number, toAuthorityId: number, reason: string) => api.post<RegulatoryReferral>(`/api/regulator/cases/${caseId}/referrals`, { toAuthorityId, reason }).then((r) => r.data),
  incoming: () => api.get<RegulatoryReferral[]>("/api/regulator/referrals/incoming").then((r) => r.data),
  accept: (id: number, note?: string) => api.post<RegulatoryReferral>(`/api/regulator/referrals/${id}/accept`, { note }).then((r) => r.data),
  reject: (id: number, note?: string) => api.post<RegulatoryReferral>(`/api/regulator/referrals/${id}/reject`, { note }).then((r) => r.data),
};
