import { api } from "@/lib/api";

export interface RecallBatch {
  batchId: number;
  batchNumber: string;
  /** Finished product this lot belongs to. */
  productName: string;
  productSku: string | null;
  manufacturerName: string | null;
  affectedUnits: number;
  affectedIdentities?: number;
  recoverableUnits?: number;
  quarantinedUnits?: number;
  soldUnits?: number;
  destroyedUnits?: number;
  recallDate: string;
  reason: string;
  initiatedBy: string;
  manufacturedOn?: string | null;
  expiresOn?: string | null;
  facility?: {
    id: number;
    name: string;
    code: string;
  } | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    category?: string | null;
    traceabilityLevel?: string;
  } | null;
  linkedCase?: {
    id: number;
    caseNumber: string | null;
    status: string;
    priority: string;
    leadAuthorityName?: string | null;
  } | null;
  impactedLocations: Array<{
    locationId: number;
    locationName: string;
    eventType: string;
    qty: number;
    identities?: number;
  }>;
  recentEvents?: Array<{
    id: number;
    type: string;
    occurredAt: string;
    recordedAt: string;
    actorName: string;
    actorEmail?: string | null;
    organizationName?: string | null;
    organizationId?: number | null;
    locationName?: string | null;
    destinationOrganizationName?: string | null;
    destinationLocationName?: string | null;
    itemCode?: string | null;
    itemQrCode?: string | null;
    batchCode?: string | null;
    relatedItemCode?: string | null;
    deviceId?: string | null;
    consumerRef?: string | null;
    notes?: string | null;
    quantity: number;
  }>;
}

export interface BatchImpact {
  batchId: number;
  batchCode: string;
  batchStatus: string;
  totalIdentities: number;
  totalUnits: number;
  recoverable: number;
  recoverableUnits: number;
  soldToConsumers: number;
  soldUnits: number;
  destroyed: number;
  destroyedUnits: number;
  holders: Array<{
    organizationId: number | null;
    organizationName: string | null;
    status: string;
    count: number;
    units: number;
  }>;
}

export interface RecallRecoveryResult {
  item: { qrCode: string; code: string; status: string; quantity: number };
  outcome: "QUARANTINED" | "DESTROYED";
  caseId: number | null;
  impact: BatchImpact;
}

export const recallService = {
  list: () => api.get<RecallBatch[]>("/api/recalls").then((r) => r.data),
  get: (batchId: number) =>
    api.get<RecallBatch>(`/api/recalls/batches/${batchId}`).then((r) => r.data),
  getImpact: (batchId: number) =>
    api.get<BatchImpact>(`/api/recalls/batches/${batchId}/impact`).then((r) => r.data),
  recall: (data: { batchId: number; reason: string }) =>
    api.post(`/api/recalls`, data).then((r) => r.data),
  lift: (batchId: number, reason?: string) =>
    api.post(`/api/recalls/batches/${batchId}/lift`, { reason }).then((r) => r.data),
  recover: (data: { qrCode: string; outcome: "QUARANTINED" | "DESTROYED"; reason?: string }) =>
    api.post<RecallRecoveryResult>("/api/recalls/recovery", data).then((r) => r.data),
};
