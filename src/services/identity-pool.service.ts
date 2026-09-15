import { api } from "@/lib/api";
import { barcodeService } from "@/services/barcode.service";

/**
 * Preparing codes for goods that have not been made yet.
 *
 * The distinction this whole module exists to hold: a code is not a bottle.
 * A pool of ten thousand identities is a print run of labels, and nothing in
 * it appears in stock until production confirms a unit was really made under
 * it. Anything here that looks like a quantity is a count of labels, not of
 * product.
 */

/** Where a minting job has got to. */
export type PoolStatus = "GENERATING" | "READY" | "FAILED";

/** The lifecycle of one code, from label to bottle — or to neither. */
export type IdentityStatus =
  | "GENERATED"
  | "ASSIGNED"
  | "ACTIVE"
  | "RESERVED"
  | "IN_TRANSIT"
  | "SOLD"
  | "RETURNED"
  | "QUARANTINED"
  | "RECALLED"
  | "EXPIRED"
  | "DAMAGED"
  | "CANCELLED"
  | "DESTROYED";

/** Why a code will never name a product. */
export type CancellationReason =
  | "PRODUCTION_DEFECT"
  | "LABEL_UNUSED"
  | "LABEL_DAMAGED"
  | "MISPRINT"
  | "OTHER";

export const CANCELLATION_REASONS: Array<{
  value: CancellationReason;
  label: string;
  hint: string;
}> = [
  {
    value: "PRODUCTION_DEFECT",
    label: "Broke on the line",
    hint: "The unit was made but failed — cracked, leaked, failed inspection",
  },
  {
    value: "LABEL_UNUSED",
    label: "Label never used",
    hint: "Printed, but never applied to anything",
  },
  {
    value: "LABEL_DAMAGED",
    label: "Label damaged",
    hint: "Destroyed before it could be applied",
  },
  {
    value: "MISPRINT",
    label: "Misprint",
    hint: "Unreadable, wrong product, or wrong run",
  },
  { value: "OTHER", label: "Other", hint: "Say why in the note" },
];

export interface IdentityPool {
  id: number;
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  requestedCount: number;
  status: PoolStatus;
  failureReason: string | null;
  requestedBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * What became of a pool's codes.
 *
 * Every figure is counted from the identities rather than stored, so the
 * invariant `minted = produced + cancelled + awaitingProduction` holds by
 * construction. If the screen ever shows otherwise, the numbers are wrong and
 * not the arithmetic.
 */
export interface PoolReconciliation {
  poolId: number;
  productName: string;
  status: PoolStatus;
  requested: number;
  minted: number;
  produced: number;
  cancelled: number;
  awaitingProduction: number;
  unminted: number;
  byStatus: Array<{ status: IdentityStatus; count: number }>;
}

export interface PoolDetail extends IdentityPool {
  reconciliation: PoolReconciliation;
}

export interface AssignmentResult {
  poolId: number;
  productionOrderId: number;
  orderNumber: string;
  assigned: number;
  firstCode: string;
  lastCode: string;
}

export interface ConfirmationResult {
  productionOrderId: number;
  orderNumber: string;
  confirmed: number;
  stillAwaitingProduction: number;
}

export interface CancellationResult {
  cancelled: number;
  reason: CancellationReason;
  codes: string[];
  /** Scanned codes the platform has never issued. */
  unknown: string[];
}

export interface Page<T> {
  content: T[];
  total: number;
  page: number;
  size: number;
}

export const identityPoolService = {
  /** Prepare codes. Returns immediately; minting continues behind it. */
  async request(input: { productId: number; count: number }) {
    const { data } = await api.post<IdentityPool>("/api/identity-pools", input);
    return data;
  },

  async list(productId?: number, page = 0, size = 20) {
    const { data } = await api.get<Page<IdentityPool>>("/api/identity-pools", {
      params: { productId, page, size },
    });
    return data;
  },

  /** The pool and what became of its codes — one call, because one screen. */
  async get(id: number) {
    const { data } = await api.get<PoolDetail>(`/api/identity-pools/${id}`);
    return data;
  },

  /** Claim codes from a pool for a production run. */
  async assign(input: {
    poolId: number;
    productionOrderId: number;
    count?: number;
  }) {
    const { data } = await api.post<AssignmentResult>(
      "/api/identity-pools/assign",
      input,
    );
    return data;
  },

  /**
   * Turn assigned codes into product.
   *
   * `count` is omitted in the normal case: everything still assigned is what
   * the run made, because each failure was cancelled as it happened.
   */
  async confirmProduced(input: {
    productionOrderId: number;
    count?: number;
    locationId?: number;
  }) {
    const { data } = await api.post<ConfirmationResult>(
      "/api/identity-pools/confirm-produced",
      input,
    );
    return data;
  },

  /** End codes that will never name a product. Never deletes them. */
  async cancel(input: {
    codes: string[];
    reason: CancellationReason;
    notes?: string;
  }) {
    const { data } = await api.post<CancellationResult>(
      "/api/identity-pools/cancel",
      input,
    );
    return data;
  },

  /** Mint whatever a stalled job left behind. */
  async resume(id: number) {
    const { data } = await api.post<IdentityPool>(
      `/api/identity-pools/${id}/resume`,
      {},
    );
    return data;
  },

  /** Export all serial codes and QR identities as CSV. */
  async export(id: number) {
    const response = await api.get(`/api/identity-pools/${id}/export`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  /**
   * Download all codes in the pool as a ZIP of PNG QR images.
   *
   * Strategy:
   *  1. Fetch the CSV (codes already stored in the backend).
   *  2. Parse the "QR Payload / URL" column — that is the value each QR encodes.
   *  3. Render each as a PNG via the barcode API (parallel, 20 at a time).
   *  4. Bundle into a ZIP and trigger browser download.
   *
   * @param onProgress  Called with (completed, total) after every batch so the
   *                    caller can show a progress indicator.
   */
  async exportImages(
    id: number,
    filename: string,
    onProgress?: (done: number, total: number) => void,
  ): Promise<void> {
    // ── 1. Load codes ──────────────────────────────────────────────────────
    const csvBlob = await identityPoolService.export(id);
    const csvText = await csvBlob.text();

    const lines = csvText.split("\n").filter(Boolean);
    // header: Serial Code, QR Payload / URL, Status, Product Name, SKU, Batch Code, Created At
    const dataLines = lines.slice(1);

    type CodeRow = { serial: string; payload: string };
    const rows: CodeRow[] = dataLines.map((line) => {
      // Values are double-quoted; a naïve split works because none of our
      // fields contain commas, but we strip quotes to be safe.
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
      return { serial: cols[0] ?? "", payload: cols[1] ?? "" };
    }).filter((r) => r.serial && r.payload);

    const total = rows.length;
    if (total === 0) return;

    // ── 2. Render PNGs in parallel batches of 20 ──────────────────────────
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    const BATCH = 20;
    let done = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { renderTrustQrBlob } = await import("@/lib/trust-qr");
      const { verifyUrlForPayload } = await import("@/lib/label-studio");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const blobs = await Promise.all(
        batch.map(({ payload }) =>
          renderTrustQrBlob(verifyUrlForPayload(payload, origin), { size: 720, margin: 1 }),
        ),
      );
      blobs.forEach((blob, j) => {
        const { serial } = batch[j];
        zip.file(`${serial}.png`, blob);
      });
      done += batch.length;
      onProgress?.(done, total);
    }

    // ── 3. Trigger download ────────────────────────────────────────────────
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
