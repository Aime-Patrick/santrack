import { api } from "@/lib/api";

export interface RecallBatch {
  batchId: number;
  batchNumber: string;
  affectedUnits: number;
  recallDate: string;
  reason: string;
  initiatedBy: string;
  impactedLocations: Array<{
    locationId: number;
    locationName: string;
    eventType: string;
    qty: number;
  }>;
}

export const recallService = {
  list: () => api.get<RecallBatch[]>("/api/recalls").then((r) => r.data),
  getImpact: (batchId: number) =>
    api.get<{ impactedLocations: RecallBatch["impactedLocations"]; totalUnits: number }>(`/api/recalls/batches/${batchId}/impact`).then((r) => r.data),
  recall: (data: { batchId: number; reason: string }) =>
    api.post(`/api/recalls`, data).then((r) => r.data),
  lift: (batchId: number, reason?: string) =>
    api.post(`/api/recalls/batches/${batchId}/lift`, { reason }).then((r) => r.data),
};
