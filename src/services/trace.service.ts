import { api } from "@/lib/api";
import type { Item, LifecycleAction } from "./item.service";
import type { Symbology } from "./barcode.service";

export interface TraceEvent {
  eventId: number;
  type: string;
  occurredAt: string;
  recordedAt: string;
  sourceOrganization: string | null;
  sourceLocation: string | null;
  destinationOrganization: string | null;
  destinationLocation: string | null;
  quantity: number | null;
  actor: string | null;
  notes: string | null;
  consumerRef: string | null;
  viaContainer: string | null;
  viaBatch: string | null;
}

/**
 * Everything that can be done to one identity, and whether it can be done now.
 *
 * Absent entries are operations this caller's role does not cover at all.
 * Present-but-unavailable ones carry `reason` — a fact about the goods, which
 * the operator standing in front of them needs to know.
 */
export type ItemAction =
  | "PRINT_LABEL"
  | "PACK"
  | "OPEN"
  | "REMOVE_CONTENT"
  | "DISPATCH"
  | "RELOCATE"
  | "SELL"
  | "QUARANTINE"
  | "RELEASE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRE"
  | "DESTROY"
  | "RECALL_BATCH";

export interface AvailableAction {
  action: ItemAction;
  available: boolean;
  reason?: string;
  /** The verb to post, for the six that share the lifecycle endpoint. */
  lifecycleAction?: LifecycleAction;
}

/**
 * The whole picture for one identity, in one response.
 *
 * An operator arrives here by scanning the thing in front of them, so this
 * carries what it is, where it came from, what is inside it, what it is inside,
 * where it has been, and what can be done to it — rather than making them
 * re-enter the code they just scanned on four other screens.
 */
export interface QualityInspectionSummary {
  id: number;
  result: string;
  inspector: string;
  notes: string | null;
  testedAt: string;
}

export interface ProductionOrderSummary {
  id: number;
  orderNumber: string;
  plannedQuantity: number;
  producedQuantity: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RawMaterialSummary {
  id: number;
  name: string;
  code: string;
  category: string | null;
  unitOfMeasure: string;
  allocatedQuantity: string;
  consumedQuantity: string;
}

export interface BatchDetail {
  id: number;
  batchCode: string;
  status: string;
  statusReason: string | null;
  statusChangedAt: string | null;
  manufacturedOn: string | null;
  expiresOn: string | null;
  facilityName: string | null;
  manufacturerName: string | null;
  productName: string | null;
  inspections: QualityInspectionSummary[];
  productionOrder: ProductionOrderSummary | null;
  rawMaterials: RawMaterialSummary[];
}

export interface TraceTimeline {
  item: Item;
  origin: {
    manufacturerName: string | null;
    facilityName: string | null;
    batchId: number | null;
    batchCode: string | null;
    batchStatus: string | null;
    manufacturedOn: string | null;
    expiresOn: string | null;
  };
  product: {
    id: number;
    name: string;
    sku: string;
    category: string | null;
    brand: string | null;
    model: string | null;
    gtin: string | null;
    barcodeSymbology: Symbology | null;
    specification: string | null;
  } | null;
  /** The container this sits in, if any. */
  containedIn: {
    id: number;
    qrCode: string;
    code: string;
    packageType: string | null;
    sealState: string | null;
  } | null;
  /** Set for containers only. */
  contents: {
    remainingCount: number;
    removedCount: number;
    remaining: Item[];
    removed: Item[];
  } | null;
  /** Full batch detail: QC, production order, raw materials, facility. */
  batchDetail: BatchDetail | null;
  /** Manufacturer licence status. */
  manufacturerCompliance: {
    verdict: string;
    licenseNumber: string | null;
  } | null;
  actions: AvailableAction[];
  eventCount: number;
  events: TraceEvent[];
}

export interface VerifyResult {
  known: boolean;
  code: string | null;
  productName: string | null;
  productSku: string | null;
  manufacturer: string | null;
  facilityName: string | null;
  batchCode: string | null;
  batchStatus: string | null;
  itemStatus: string | null;
  manufacturedOn: string | null;
  expiresOn: string | null;
  expired: boolean;
  recalled: boolean;
  blocked: boolean;
  verdict: string;
}

export const traceService = {
  /** Get the full lifecycle timeline for an item. */
  timeline(qrCode: string): Promise<TraceTimeline> {
    return api
      .get<TraceTimeline>(`/api/trace/${qrCode}`)
      .then((r) => r.data);
  },

  /** Public verification (no auth required). */
  verify(token: string): Promise<VerifyResult> {
    return api.get<VerifyResult>(`/api/verify/${token}`).then((r) => r.data);
  },
};
