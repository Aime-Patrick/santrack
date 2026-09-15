import type { Template } from "@pdfme/common";

export type PdfmeSchema = Record<string, unknown> & {
  name: string;
  type: string;
  position?: { x?: number; y?: number };
  width?: number;
  height?: number;
};

export type LabelElementKind =
  | "text"
  | "dynamicText"
  | "qrcode"
  | "barcode"
  | "shape"
  | "image"
  | "line";

export type LabelPreviewValues = Record<string, string>;

export interface LabelDesignElement {
  id: string;
  kind: LabelElementKind;
  binding?: string;
  frame: { x: number; y: number; width: number; height: number; rotation: number };
  source: PdfmeSchema;
}

export interface LabelDesignPage {
  id: string;
  index: number;
  widthMm: number;
  heightMm: number;
  unit: "mm";
  background: string;
  elements: LabelDesignElement[];
}

export interface LabelDesignDocument {
  version: 1;
  pages: LabelDesignPage[];
}

type StyledLabelTemplate = Template & { santrackPageBackgrounds?: string[] };

const previewFallbacks: LabelPreviewValues = {
  productName: "Inyange Mineral Water 500ml",
  subTitle: "Natural Pure Mineral Water",
  volume: "500 ml e",
  specTitle: "Composition (mg/L)",
  specBody: "Calcium 12.4 · Magnesium 4.8 · pH 7.2",
  serial: "ST-SAMPLE-000001",
  batchLine: "Batch LOT-01 · SKU-500ML",
  expiryDate: "EXP: 12/2027",
  hint: "Scan to verify genuine product",
  trustMark: "SANTRACK SEAL",
  qr: "https://santrack.app/verify/sample",
  barcode: "ST-SAMPLE-000001",
  batchBarcode: "LOT-01",
};

export function asPdfmeSchema(value: unknown): PdfmeSchema | null {
  if (!value || typeof value !== "object") return null;
  const schema = value as Record<string, unknown>;
  if (typeof schema.name !== "string" || typeof schema.type !== "string") return null;
  return schema as PdfmeSchema;
}

export function getLabelElementKind(schema: PdfmeSchema): LabelElementKind {
  if (schema.type === "qrcode") return "qrcode";
  if (["code128", "barcode", "ean13", "ean8", "code39", "itf14", "upca", "upce"].includes(schema.type)) return "barcode";
  if (schema.type === "image" || schema.type === "svg") return "image";
  if (schema.type === "line") return "line";
  if (schema.type === "rectangle" || schema.type === "ellipse") return "shape";
  if (schema.name.startsWith("text_")) return "text";
  return "dynamicText";
}

export function resolveLabelPreview(
  schema: PdfmeSchema,
  values: LabelPreviewValues = {},
) {
  const explicitValue = values[schema.name];
  if (typeof explicitValue === "string" && explicitValue.trim()) return explicitValue;
  const fallback = previewFallbacks[schema.name];
  if (fallback) return fallback;
  if (getLabelElementKind(schema) === "text") {
    return typeof schema.content === "string" && schema.content.trim()
      ? schema.content
      : "Text label";
  }
  return schema.name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

export function templateToDesignDocument(
  template: Template,
  fallbackPage: { width: number; height: number },
): LabelDesignDocument {
  const basePdf = template.basePdf as Record<string, unknown> | null;
  const width = Number(basePdf?.width);
  const height = Number(basePdf?.height);
  const widthMm = Number.isFinite(width) ? width : fallbackPage.width;
  const heightMm = Number.isFinite(height) ? height : fallbackPage.height;
  const backgrounds = (template as StyledLabelTemplate).santrackPageBackgrounds ?? [];
  const pages = template.schemas?.length ? template.schemas : [[]];

  return {
    version: 1,
    pages: pages.map((pageSchemas, pageIndex) => ({
      id: `page-${pageIndex + 1}`,
      index: pageIndex,
      widthMm,
      heightMm,
      unit: "mm" as const,
      background: backgrounds[pageIndex] ?? "#ffffff",
      elements: pageSchemas
        .map(asPdfmeSchema)
        .filter((schema): schema is PdfmeSchema => schema !== null)
        .map((schema, elementIndex) => ({
          id: `${schema.name}-${elementIndex}`,
          kind: getLabelElementKind(schema),
          binding: getLabelElementKind(schema) === "text" ? undefined : schema.name,
          frame: {
            x: Number(schema.position?.x ?? 0),
            y: Number(schema.position?.y ?? 0),
            width: Number(schema.width ?? 20),
            height: Number(schema.height ?? 10),
            rotation: Number(schema.rotation ?? schema.angle ?? 0),
          },
          source: schema,
        })),
    })),
  };
}
