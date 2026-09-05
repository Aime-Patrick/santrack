import { api } from "@/lib/api";

export interface AccountabilityEntry {
  id: number;
  source:
    | "CASE"
    | "LICENSE"
    | "INSPECTION"
    | "TRACEABILITY"
    | "FINDING"
    | "COMPLAINT";
  type: string;
  summary: string;
  detail: Record<string, unknown> | null;
  actor: string | null;
  actorEmail: string | null;
  organization: string | null;
  recordedAt: string;
}

export const accountabilityService = {
  organizationTimeline: (orgId: number, limit = 50) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/organization/${orgId}`, { params: { limit } })
      .then((r) => r.data),

  caseTimeline: (caseId: number, limit = 50) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/case/${caseId}`, { params: { limit } })
      .then((r) => r.data),

  facilityTimeline: (facilityId: number, limit = 50) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/facility/${facilityId}`, { params: { limit } })
      .then((r) => r.data),

  licenceTimeline: (licenceId: number, limit = 50) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/licence/${licenceId}`, { params: { limit } })
      .then((r) => r.data),

  productTimeline: (productId: number, limit = 50) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/product/${productId}`, { params: { limit } })
      .then((r) => r.data),

  batchTimeline: (batchId: number, limit = 30) =>
    api
      .get<AccountabilityEntry[]>(`/api/regulator/accountability/batch/${batchId}`, { params: { limit } })
      .then((r) => r.data),
};
