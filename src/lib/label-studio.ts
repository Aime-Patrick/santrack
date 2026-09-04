/**
 * Label Studio — parse pool export CSV into print rows.
 * Codes are always bound to identities minted in the pool, never free text.
 */

import type { Template } from "@pdfme/common";

export type LabelTemplateId =
  | "unit"
  | "carton"
  | "shelf"
  | "bottle_wrap"
  | "security_seal";

export type LabelStudioMode = "preview" | "design" | "data";

export interface LabelRow {
  serial: string;
  qrPayload: string;
  status: string;
  productName: string;
  sku: string;
  batchCode: string;
  createdAt: string;
}

export const LABEL_TEMPLATES: Array<{
  id: LabelTemplateId;
  name: string;
  description: string;
  /** Approximate label size for layout hints (mm). */
  widthMm: number;
  heightMm: number;
}> = [
  {
    id: "unit",
    name: "Unit Sticker",
    description: "50×30 mm standard thermal sticker with QR & Serial",
    widthMm: 50,
    heightMm: 30,
  },
  {
    id: "bottle_wrap",
    name: "Bottle Wrap / Sleeve",
    description: "200×65 mm full cylindrical packaging wrapper (e.g. Inyange Water)",
    widthMm: 200,
    heightMm: 65,
  },
  {
    id: "security_seal",
    name: "Cap / Security Stamp",
    description: "30×30 mm compact tamper-evident QR stamp for bottle caps & seals",
    widthMm: 30,
    heightMm: 30,
  },
  {
    id: "carton",
    name: "Carton / Case Box",
    description: "70×40 mm shipping box label with Code 128 barcode",
    widthMm: 70,
    heightMm: 40,
  },
  {
    id: "shelf",
    name: "Shelf Display Tag",
    description: "90×50 mm high-visibility consumer verify flyer",
    widthMm: 90,
    heightMm: 50,
  },
];

/** CSV header from GET /api/identity-pools/:id/export */
export function parsePoolLabelCsv(csvText: string): LabelRow[] {
  const lines = csvText.split("\n").filter(Boolean);
  const dataLines = lines.slice(1);

  return dataLines
    .map((line) => {
      const cols = line
        .split(",")
        .map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
      return {
        serial: cols[0] ?? "",
        qrPayload: cols[1] ?? "",
        status: cols[2] ?? "",
        productName: cols[3] ?? "",
        sku: cols[4] ?? "",
        batchCode: cols[5] ?? "",
        createdAt: cols[6] ?? "",
      };
    })
    .filter((r) => r.serial && r.qrPayload);
}

export function verifyUrlForPayload(qrPayload: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(qrPayload)}`;
}

export const DEFAULT_PRINT_LIMIT = 100;
export const MAX_PRINT_LIMIT = 500;

/** Bind data fields when designing templates — keep these schema names. */
export const LABEL_BIND_FIELDS: Array<{
  name: string;
  label: string;
  sample: string;
}> = [
  { name: "qr", label: "QR payload / URL", sample: "84dd98c5-2cc0-47a6-9efc-01b33434cde0" },
  { name: "productName", label: "Product Name", sample: "Inyange Mineral Water 500ml" },
  { name: "serial", label: "Unique Serial (ST-…)", sample: "ST-INY-000001" },
  { name: "batchLine", label: "Batch · SKU", sample: "Batch LOT-42 · SKU-500ML" },
  { name: "hint", label: "Verification Prompt", sample: "Scan with camera to verify authenticity" },
  { name: "barcode", label: "Code 128 / Barcode", sample: "ST-INY-000001" },
  { name: "expiryDate", label: "Expiry / Best Before", sample: "EXP: 12/2027" },
  { name: "mfgDate", label: "Manufacture Date", sample: "MFG: 09/2026" },
];

function templateStorageKey(poolId: number, preset: LabelTemplateId): string {
  return `santrack-label-template:${poolId}:${preset}`;
}

export function loadSavedTemplate(
  poolId: number,
  preset: LabelTemplateId,
): Template | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(templateStorageKey(poolId, preset));
    if (!raw) return null;
    return JSON.parse(raw) as Template;
  } catch {
    return null;
  }
}

export function saveTemplateToStorage(
  poolId: number,
  preset: LabelTemplateId,
  template: Template,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    templateStorageKey(poolId, preset),
    JSON.stringify(template),
  );
}

export function clearSavedTemplate(
  poolId: number,
  preset: LabelTemplateId,
): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(templateStorageKey(poolId, preset));
}
