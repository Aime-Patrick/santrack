import { api } from "@/lib/api";

export type ScanKind =
  | "ITEM"
  | "PRODUCT"
  | "BATCH"
  | "LOCATION"
  | "TRANSFER"
  | "UNKNOWN";

export interface ScanResult {
  kind: ScanKind;
  /** What the scanner actually read. */
  scanned: string;
  itemQrCode?: string;
  productId?: number;
  batchId?: number;
  locationId?: number;
  transferId?: number;
  /** Whose place it is, when a location was scanned. */
  organizationId?: number;
  /** What the code carried beyond identifying something. */
  carried?: {
    gtin?: string;
    batchCode?: string;
    expiresOn?: string;
  };
  /** What this is, in a sentence. */
  describes: string;
}

export const scanService = {
  /**
   * Works out what a scanned code is.
   *
   * One call behind every scan box, so a screen reacts to what came back
   * instead of assuming. That is what lets a single input do the work of
   * several: scan an item and it is added, scan a bay and the destination is
   * set, scan a supplier's barcode and the product is recognised.
   */
  resolve(code: string): Promise<ScanResult> {
    return api
      .get<ScanResult>(`/api/scan/${encodeURIComponent(code.trim())}`)
      .then((r) => r.data);
  },
};
