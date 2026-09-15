import { api } from "@/lib/api";

export interface ProductionOrder {
  id: number;
  orderNumber: string;
  productId: number;
  productName: string;
  bomId: number | null;
  bomVersion: string | null;
  machineId: number | null;
  machineCode: string | null;
  plannedQuantity: number;
  producedQuantity: number;
  status: string;
  scheduledStartOn: string;
  scheduledEndOn: string;
  startedAt: string | null;
  completedAt: string | null;
  batchId: number | null;
  batchCode: string | null;
  batchStatus: string | null;
  notes: string;
  createdAt: string;
  materials?: MaterialRow[];
  events?: ProductionEvent[];
  cost?: { materialCost: number; costPerUnit: number | null };
}

export interface MaterialRow {
  materialId: number;
  materialCode: string;
  materialName: string;
  unitOfMeasure: string;
  allocatedQuantity: number;
  consumedQuantity: number;
  wastagePercent: number;
}

export interface ProductionEvent {
  type: string;
  quantity: number | null;
  actorName: string | null;
  notes: string;
  recordedAt: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  code: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  reorderLevel: number;
  active: boolean;
  createdAt: string;
}

export interface QualityInspection {
  id: number;
  productionOrderId: number | null;
  productionOrderNumber: string | null;
  batchId: number | null;
  batchCode: string | null;
  inspectorName: string;
  result: string;
  notes: string;
  testedAt: string;
}

export interface Bom {
  id: number;
  name: string;
  productId: number;
  productName: string;
  version: string;
  active: boolean;
  lines: BomLine[];
  createdAt: string;
}

export interface BomLine {
  materialId: number;
  materialCode: string;
  materialName: string;
  quantityPerUnit: number;
  wastagePercent: number;
}

export interface PaginatedResponse<T> {
  total: number;
  content: T[];
}

export const productionService = {
  list: (status?: string, page = 0, size = 20) =>
    api.get<PaginatedResponse<ProductionOrder>>("/api/production-orders", { params: { status, page, size } }).then((r) => r.data),
  get: (id: number) => api.get<ProductionOrder>(`/api/production-orders/${id}`).then((r) => r.data),
  /**
   * `facilityId` is conditionally required (DR-07 WU-1): with one open site the
   * server infers it, with two or more it refuses to guess — a guess would put
   * a recall at the wrong plant. Creation also evaluates eligibility server-side
   * and refuses with 409 carrying the failing checks when the decision blocks.
   */
  create: (data: { productId: number; plannedQuantity: number; facilityId?: number; bomId?: number; machineId?: number; scheduledStartOn?: string; scheduledEndOn?: string; notes?: string }) =>
    api.post<ProductionOrder>("/api/production-orders", data).then((r) => r.data),
  start: (id: number) => api.post<ProductionOrder>(`/api/production-orders/${id}/start`).then((r) => r.data),
  /**
   * `expiresOn` is the lot's shelf date, and completion is the only place it
   * can be set: items copy it from their batch when they are registered, so a
   * run finished without one produces stock that can never expire.
   */
  complete: (id: number, data?: { producedQuantity?: number; expiresOn?: string; notes?: string }) =>
    api.post<ProductionOrder>(`/api/production-orders/${id}/complete`, data).then((r) => r.data),
  /** Corrects a completed run's output. Cannot go below the identities already registered. */
  amendQuantity: (id: number, data: { newQuantity: number; reason: string }) =>
    api.post<ProductionOrder>(`/api/production-orders/${id}/amend-quantity`, data).then((r) => r.data),
  cancel: (id: number, data: { reason: string }) =>
    api.post<ProductionOrder>(`/api/production-orders/${id}/cancel`, data).then((r) => r.data),
  allocateMaterials: (id: number, data: { materials: { materialId: number; quantity: number }[] }) =>
    api.post<ProductionOrder>(`/api/production-orders/${id}/materials/allocate`, data).then((r) => r.data),
  issueMaterials: (id: number, data: { materials: { materialId: number; quantity: number }[] }) =>
    api.post<ProductionOrder>(`/api/production-orders/${id}/materials/issue`, data).then((r) => r.data),
  close: (id: number) => api.post<ProductionOrder>(`/api/production-orders/${id}/close`).then((r) => r.data),
};

export const rawMaterialService = {
  list: () => api.get<RawMaterial[]>("/api/raw-materials").then((r) => r.data),
  get: (id: number) => api.get<RawMaterial>(`/api/raw-materials/${id}`).then((r) => r.data),
  create: (data: { name: string; code: string; category: string; unitOfMeasure: string; unitCost: number; reorderLevel?: number }) =>
    api.post<RawMaterial>("/api/raw-materials", data).then((r) => r.data),
};

export const qualityInspectionService = {
  list: (page = 0, size = 20) =>
    api.get<PaginatedResponse<QualityInspection>>("/api/quality-inspections", { params: { page, size } }).then((r) => r.data),
  create: (data: { productionOrderId?: number; batchId?: number; result: string; notes?: string }) =>
    api.post<QualityInspection>("/api/quality-inspections", data).then((r) => r.data),
  inspectability: (batchId: number) =>
    api
      .get<{ allowed: boolean; reason: string | null }>("/api/quality-inspections/inspectability", {
        params: { batchId },
      })
      .then((r) => r.data),
};

export const bomService = {
  list: () => api.get<Bom[]>("/api/boms").then((r) => r.data),
  get: (id: number) => api.get<Bom>(`/api/boms/${id}`).then((r) => r.data),
  create: (data: { name: string; productId: number; lines: { materialId: number; quantityPerUnit: number; wastagePercent?: number }[] }) =>
    api.post<Bom>("/api/boms", data).then((r) => r.data),
};
