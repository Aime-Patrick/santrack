import { api } from "@/lib/api";

export type FieldScanResult = {
  kind: "ITEM" | "PRODUCT" | "BATCH" | "LOCATION" | "TRANSFER" | "UNKNOWN";
  scanned: string; describes: string; itemQrCode?: string; productId?: number; batchId?: number; locationId?: number; facilityId?: number;
};

export const regulatoryFieldScanService = {
  resolve: (code: string) => api.get<FieldScanResult>(`/api/scan/${encodeURIComponent(code)}`).then((response) => response.data),
};
