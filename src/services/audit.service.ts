import { api } from "@/lib/api";

export interface AuditEntry {
  id: number;
  method: string;
  path: string;
  statusCode: number;
  detail: string | null;
  actor: string;
  actorId: number | null;
  organizationId: number | null;
  organizationName: string | null;
  performedAt: string;
  remoteAddress: string | null;
}

export interface AuditLogResponse {
  /** `platform` = every organization; `organization` = one business. */
  scope: "platform" | "organization";
  entries: AuditEntry[];
}

export interface AuditActorDetail {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
  organizationId: number | null;
  organizationName: string | null;
  organizationType: string | null;
}

export interface AuditOrganizationDetail {
  id: number;
  name: string;
  type: string;
  tin: string | null;
  registrationNumber: string | null;
  createdAt: string;
}

/** Full footprint for one write — every field we store, nothing omitted. */
export interface AuditEntryDetail {
  id: number;
  method: string;
  path: string;
  statusCode: number;
  detail: string | null;
  performedAt: string;
  remoteAddress: string | null;
  actor: AuditActorDetail | null;
  organization: AuditOrganizationDetail | null;
  actorDisplay: string;
  organizationName: string | null;
}

export const auditService = {
  list(limit = 100, organizationId?: number): Promise<AuditLogResponse> {
    return api
      .get<AuditLogResponse>("/api/audit", {
        params: {
          limit,
          ...(organizationId != null ? { organizationId } : {}),
        },
      })
      .then((r) => r.data);
  },

  get(id: number): Promise<AuditEntryDetail> {
    return api.get<AuditEntryDetail>(`/api/audit/${id}`).then((r) => r.data);
  },
};
