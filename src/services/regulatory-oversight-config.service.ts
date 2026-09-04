import { api } from "@/lib/api";

export type RegulatoryOversightScope = { id: number; createdAt: string; oversightOrganization: { id: number; name: string }; authority: { id: number; code: string; name: string } };
export const regulatoryOversightConfigService = {
  list: () => api.get<RegulatoryOversightScope[]>("/api/regulatory-oversight/scopes").then((r) => r.data),
  grant: (oversightOrganizationId: number, authorityId: number) => api.post<RegulatoryOversightScope>("/api/regulatory-oversight/scopes", { oversightOrganizationId, authorityId }).then((r) => r.data),
  revoke: (id: number) => api.delete(`/api/regulatory-oversight/scopes/${id}`),
};
