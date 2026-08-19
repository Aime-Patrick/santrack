import { api } from "@/lib/api";

export interface AuditEntry {
  id: number;
  method: string;
  path: string;
  statusCode: number;
  detail: string | null;
  actor: string;
  performedAt: string;
  remoteAddress: string | null;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
}

export const auditService = {
  list(limit = 100): Promise<AuditLogResponse> {
    return api
      .get<AuditLogResponse>("/api/audit", { params: { limit } })
      .then((r) => r.data);
  },
};
