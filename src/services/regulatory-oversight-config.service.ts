import { api } from "@/lib/api";
import type { RegulatoryOversightMode } from "@/services/regulatory-oversight.service";

export type RegulatoryOversightScope = {
  id: number;
  mode: RegulatoryOversightMode;
  createdAt: string;
  oversightOrganization: { id: number; name: string };
  authority: { id: number; code: string; name: string };
};

export const regulatoryOversightConfigService = {
  list: () =>
    api
      .get<RegulatoryOversightScope[]>("/api/regulatory-oversight/scopes")
      .then((r) => r.data),

  grant: (
    oversightOrganizationId: number,
    authorityId: number,
    mode: RegulatoryOversightMode = "OBSERVE",
  ) =>
    api
      .post<RegulatoryOversightScope>("/api/regulatory-oversight/scopes", {
        oversightOrganizationId,
        authorityId,
        mode,
      })
      .then((r) => r.data),

  setMode: (id: number, mode: RegulatoryOversightMode) =>
    api
      .patch<RegulatoryOversightScope>(`/api/regulatory-oversight/scopes/${id}`, {
        mode,
      })
      .then((r) => r.data),

  revoke: (id: number) => api.delete(`/api/regulatory-oversight/scopes/${id}`),
};
