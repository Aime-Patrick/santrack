import { api } from "@/lib/api";
import type { PackageType, SealState } from "./item.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockInContainerSummary {
  id: number;
  qrCode: string;
  code: string;
  packageType: PackageType | null;
  sealState: SealState | null;
  quantity: number;
}

export interface StockInPreview {
  container: StockInContainerSummary & {
    holderId: number | null;
    holderName: string | null;
    locationId: number | null;
    locationName: string | null;
    productId: number | null;
    productName: string | null;
  };
  directChildCount: number;
  unitCount: number;
  nestedContainerCount: number;
  /** True if this organisation already holds the container. */
  alreadyHeld: boolean;
}

export interface StockInConfirmInput {
  containerQrCode: string;
  locationId?: number;
  notes?: string;
  meta?: {
    clientEventId?: string;
    deviceId?: string;
    occurredAt?: string;
  };
}

export interface StockInReceipt {
  outcome: "received" | "idempotent";
  container: StockInContainerSummary;
  receivingOrganizationId: number;
  receivingOrganizationName: string;
  unitCount: number;
  nestedContainerCount: number;
  totalItemsRegistered: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const stockInService = {
  /**
   * Read-only preview of the container the operator just scanned.
   * No state is changed; safe to call before the user confirms.
   */
  preview(qrCode: string): Promise<StockInPreview> {
    return api
      .get<StockInPreview>(`/api/stock-in/preview/${encodeURIComponent(qrCode)}`)
      .then((r) => r.data);
  },

  /**
   * Confirms receipt of the container and performs the complete inventory
   * transition atomically. Idempotent — safe to retry.
   */
  confirm(input: StockInConfirmInput): Promise<StockInReceipt> {
    return api
      .post<StockInReceipt>("/api/stock-in/confirm", input)
      .then((r) => r.data);
  },
};
