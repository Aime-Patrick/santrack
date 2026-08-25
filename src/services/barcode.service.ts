import { api } from "@/lib/api";

/**
 * The code types the platform can print. Names match the backend's Symbology
 * enum; the catalogue itself is fetched, so this type is the only thing that
 * needs to stay in step.
 */
export type Symbology =
  | "QR"
  | "GS1_QR"
  | "DATA_MATRIX"
  | "GS1_DATA_MATRIX"
  | "PDF417"
  | "AZTEC"
  | "EAN_13"
  | "EAN_8"
  | "UPC_A"
  | "UPC_E"
  | "ISBN"
  | "ITF_14"
  | "GS1_128"
  | "SSCC_18"
  | "CODE_128"
  | "CODE_39"
  | "CODE_93"
  | "CODABAR";

export type SymbologyDimension = "1D" | "2D";

export type SymbologyUse =
  | "IDENTITY"
  | "RETAIL"
  | "PUBLICATION"
  | "LOGISTICS"
  | "INTERNAL";

export interface SymbologySpec {
  symbology: Symbology;
  label: string;
  dimension: SymbologyDimension;
  use: SymbologyUse;
  /** One sentence: what this is for and when to reach for it. */
  purpose: string;
  /** What the operator should type, in plain words. */
  accepts: string;
  /** A value that renders — seeds the preview before anything is typed. */
  example: string;
  printsText: boolean;
}

export interface SymbologyCatalogue {
  symbologies: SymbologySpec[];
  /** What to print by default, per kind of label. */
  defaults: Record<SymbologyUse, Symbology>;
}

export type CheckResult =
  | { valid: true; encodes: string }
  | { valid: false; problem: string };

export interface RenderOptions {
  symbology: Symbology;
  value: string;
  /** Module size. 2 for a screen preview, 3+ for a printable label. */
  scale?: number;
  /** Bar height in millimetres; ignored by the 2D symbologies. */
  height?: number;
  showText?: boolean;
  format?: "png" | "svg";
}

export const barcodeService = {
  /** What the platform can print and what each type is for. */
  catalogue(): Promise<SymbologyCatalogue> {
    return api
      .get<SymbologyCatalogue>("/api/barcodes/symbologies")
      .then((r) => r.data);
  },

  /**
   * Validates without drawing, so a form can say "that check digit is wrong"
   * while the operator is still typing rather than after a thousand labels.
   */
  check(symbology: Symbology, value: string): Promise<CheckResult> {
    return api
      .get<CheckResult>("/api/barcodes/check", { params: { symbology, value } })
      .then((r) => r.data);
  },

  /** Renders a label and hands back an object URL the caller must revoke. */
  async render(options: RenderOptions): Promise<string> {
    const response = await api.get("/api/barcodes/render", {
      params: options,
      responseType: "blob",
    });
    return URL.createObjectURL(response.data as Blob);
  },

  /**
   * Same as render() but returns the raw Blob.
   * Use this when you need to package many images (e.g. into a ZIP) without
   * creating and revoking object URLs for each one.
   */
  async renderBlob(options: RenderOptions): Promise<Blob> {
    const response = await api.get("/api/barcodes/render", {
      params: options,
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
