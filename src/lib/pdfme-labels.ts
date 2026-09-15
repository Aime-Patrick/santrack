import type { Template } from "@pdfme/common";
import { cloneDeep, getDefaultFont } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import {
  barcodes,
  dateTime,
  ellipse,
  image,
  line,
  rectangle,
  svg,
  text,
} from "@pdfme/schemas";
import type { LabelRow, LabelTemplateId } from "@/lib/label-studio";
import { verifyUrlForPayload } from "@/lib/label-studio";
import {
  renderTrustQrDataUrl,
  resolveTrustQrStyle,
  DEFAULT_TRUST_QR_STYLE,
  type TrustQrStyle,
} from "@/lib/trust-qr";

/** Full PDFme suite for professional packaging & label design. */
export const PDFME_LABEL_PLUGINS = {
  text,
  image,
  svg,
  line,
  rectangle,
  ellipse,
  dateTime,
  qrcode: barcodes.qrcode,
  code128: barcodes.code128,
  ean13: barcodes.ean13,
  ean8: barcodes.ean8,
  code39: barcodes.code39,
  itf14: barcodes.itf14,
  upca: barcodes.upca,
  upce: barcodes.upce,
  gs1datamatrix: barcodes.gs1datamatrix,
  pdf417: barcodes.pdf417,
};

const pad = 1.5;

function unitTemplate(): Template {
  return {
    basePdf: { width: 50, height: 30, padding: [pad, pad, pad, pad] },
    schemas: [
      [
        {
          name: "labelFrame",
          type: "rectangle",
          position: { x: 1, y: 1 },
          width: 48,
          height: 28,
          borderWidth: 0.35,
          borderColor: "#cbd5e1",
        },
        {
          name: "flagStripeBlue",
          type: "rectangle",
          position: { x: 2.5, y: 20.2 },
          width: 8.5,
          height: 0.9,
          color: "#067eda",
          borderWidth: 0,
        },
        {
          name: "flagStripeYellow",
          type: "rectangle",
          position: { x: 11, y: 20.2 },
          width: 8.5,
          height: 0.9,
          color: "#facb2d",
          borderWidth: 0,
        },
        {
          name: "flagStripeGreen",
          type: "rectangle",
          position: { x: 19.5, y: 20.2 },
          width: 8.5,
          height: 0.9,
          color: "#00953C",
          borderWidth: 0,
        },
        {
          name: "accentRule",
          type: "line",
          position: { x: 2.5, y: 21.4 },
          width: 26.5,
          height: 0.2,
          color: "#067eda",
          thickness: 0.2,
        },
        {
          name: "qr",
          type: "qrcode",
          position: { x: 31.5, y: 3 },
          width: 16.5,
          height: 16.5,
          trustQr: { ...DEFAULT_TRUST_QR_STYLE },
        },
        {
          name: "productName",
          type: "text",
          position: { x: 2.5, y: 2.5 },
          width: 26.5,
          height: 7,
          fontSize: 7.5,
          fontName: "Roboto",
          bold: true,
        },
        {
          name: "serial",
          type: "text",
          position: { x: 2.5, y: 10.5 },
          width: 26.5,
          height: 4,
          fontSize: 5.5,
          fontName: "Roboto",
          bold: true,
        },
        {
          name: "batchLine",
          type: "text",
          position: { x: 2.5, y: 15 },
          width: 26.5,
          height: 4.5,
          fontSize: 4.4,
          fontName: "Roboto",
        },
        {
          name: "hint",
          type: "text",
          position: { x: 2.5, y: 22.6 },
          width: 26.5,
          height: 3.5,
          fontSize: 4.2,
          fontName: "Roboto",
          bold: true,
        },
        {
          name: "trustMark",
          type: "text",
          position: { x: 31, y: 22.2 },
          width: 17.5,
          height: 4,
          fontSize: 4.2,
          fontName: "Roboto",
          fontColor: "#067eda",
          alignment: "center",
          bold: true,
        },
      ],
    ],
  };
}

function bottleWrapTemplate(): Template {
  return {
    basePdf: { width: 200, height: 65, padding: [2, 2, 2, 2] },
    schemas: [
      [
        // Left Column: Nutrition / Standard specs
        {
          name: "brandBox",
          type: "rectangle",
          position: { x: 4, y: 4 },
          width: 50,
          height: 57,
          borderWidth: 0.5,
          borderColor: "#cbd5e1",
        },
        {
          name: "specTitle",
          type: "text",
          position: { x: 6, y: 6 },
          width: 46,
          height: 6,
          fontSize: 8,
          fontName: "Roboto",
        },
        {
          name: "specBody",
          type: "text",
          position: { x: 6, y: 13 },
          width: 46,
          height: 45,
          fontSize: 6,
          fontName: "Roboto",
        },

        // Center Column: Main Brand & Product Logo Area
        {
          name: "productName",
          type: "text",
          position: { x: 60, y: 12 },
          width: 80,
          height: 12,
          fontSize: 16,
          fontName: "Roboto",
          alignment: "center",
        },
        {
          name: "subTitle",
          type: "text",
          position: { x: 60, y: 26 },
          width: 80,
          height: 8,
          fontSize: 10,
          fontName: "Roboto",
          alignment: "center",
        },
        {
          name: "volume",
          type: "text",
          position: { x: 60, y: 46 },
          width: 80,
          height: 8,
          fontSize: 12,
          fontName: "Roboto",
          alignment: "center",
        },

        // Right Column: Traceability & Serialized Stamp Panel
        {
          name: "traceBox",
          type: "rectangle",
          position: { x: 145, y: 4 },
          width: 51,
          height: 57,
          borderWidth: 0.8,
          borderColor: "#067eda",
        },
        {
          name: "qr",
          type: "qrcode",
          position: { x: 148, y: 8 },
          width: 22,
          height: 22,
          trustQr: { ...DEFAULT_TRUST_QR_STYLE },
        },
        {
          name: "serial",
          type: "text",
          position: { x: 148, y: 32 },
          width: 45,
          height: 5,
          fontSize: 6.5,
          fontName: "Roboto",
        },
        {
          name: "batchLine",
          type: "text",
          position: { x: 148, y: 38 },
          width: 45,
          height: 4.5,
          fontSize: 5.5,
          fontName: "Roboto",
        },
        {
          name: "expiryDate",
          type: "text",
          position: { x: 148, y: 43 },
          width: 45,
          height: 4.5,
          fontSize: 5.5,
          fontName: "Roboto",
        },
        {
          name: "hint",
          type: "text",
          position: { x: 148, y: 49 },
          width: 45,
          height: 4.5,
          fontSize: 5,
          fontName: "Roboto",
        },
      ],
    ],
  };
}

function securitySealTemplate(): Template {
  return {
    basePdf: { width: 30, height: 30, padding: [1, 1, 1, 1] },
    schemas: [
      [
        {
          name: "outerRing",
          type: "ellipse",
          position: { x: 1.2, y: 1.2 },
          width: 27.6,
          height: 27.6,
          borderWidth: 0.7,
          borderColor: "#067eda",
          color: "#ffffff",
        },
        {
          name: "flagArcBlue",
          type: "rectangle",
          position: { x: 2.2, y: 2.2 },
          width: 8.5,
          height: 1.1,
          color: "#067eda",
          borderWidth: 0,
        },
        {
          name: "flagArcYellow",
          type: "rectangle",
          position: { x: 10.7, y: 2.2 },
          width: 8.5,
          height: 1.1,
          color: "#facb2d",
          borderWidth: 0,
        },
        {
          name: "flagArcGreen",
          type: "rectangle",
          position: { x: 19.2, y: 2.2 },
          width: 8.5,
          height: 1.1,
          color: "#00953C",
          borderWidth: 0,
        },
        {
          name: "qr",
          type: "qrcode",
          position: { x: 6.2, y: 4.2 },
          width: 17.6,
          height: 17.6,
          trustQr: { ...DEFAULT_TRUST_QR_STYLE },
        },
        {
          name: "serial",
          type: "text",
          position: { x: 2, y: 22.2 },
          width: 26,
          height: 3.2,
          fontSize: 4.8,
          fontName: "Roboto",
          alignment: "center",
          bold: true,
        },
        {
          name: "hint",
          type: "text",
          position: { x: 2, y: 25.4 },
          width: 26,
          height: 2.8,
          fontSize: 4.2,
          fontName: "Roboto",
          alignment: "center",
          fontColor: "#067eda",
          bold: true,
        },
      ],
    ],
  };
}

function cartonTemplate(): Template {
  return {
    basePdf: { width: 70, height: 50, padding: [pad, pad, pad, pad] },
    schemas: [
      [
        {
          name: "productName",
          type: "text",
          position: { x: pad, y: pad },
          width: 66,
          height: 6,
          fontSize: 9,
          fontName: "Roboto",
        },
        // Unit serial — identifies the specific container identity
        {
          name: "barcode",
          type: "code128",
          position: { x: 8, y: 9 },
          width: 54,
          height: 14,
          includetext: true,
        },
        {
          name: "serial",
          type: "text",
          position: { x: pad, y: 24 },
          width: 66,
          height: 4,
          fontSize: 6,
          fontName: "Roboto",
        },
        // Batch code — scannable by a regulator in the field
        {
          name: "batchBarcode",
          type: "code128",
          position: { x: 8, y: 29 },
          width: 54,
          height: 12,
          includetext: true,
        },
        {
          name: "batchLine",
          type: "text",
          position: { x: pad, y: 42 },
          width: 66,
          height: 4,
          fontSize: 6,
          fontName: "Roboto",
        },
      ],
    ],
  };
}

function shelfTemplate(): Template {
  return {
    basePdf: { width: 90, height: 50, padding: [pad, pad, pad, pad] },
    schemas: [
      [
        {
          name: "productName",
          type: "text",
          position: { x: pad, y: pad },
          width: 86,
          height: 7,
          fontSize: 11,
          fontName: "Roboto",
          alignment: "center",
        },
        {
          name: "qr",
          type: "qrcode",
          position: { x: 28, y: 10 },
          width: 34,
          height: 34,
          trustQr: { ...DEFAULT_TRUST_QR_STYLE },
        },
        {
          name: "hint",
          type: "text",
          position: { x: pad, y: 44 },
          width: 86,
          height: 4,
          fontSize: 8,
          fontName: "Roboto",
          alignment: "center",
        },
      ],
    ],
  };
}

export function getPdfmeTemplate(id: LabelTemplateId): Template {
  switch (id) {
    case "bottle_wrap":
      return cloneDeep(bottleWrapTemplate());
    case "security_seal":
      return cloneDeep(securitySealTemplate());
    case "carton":
      return cloneDeep(cartonTemplate());
    case "shelf":
      return cloneDeep(shelfTemplate());
    default:
      return cloneDeep(unitTemplate());
  }
}

export function samplePdfmeInput(
  templateId: LabelTemplateId,
  origin: string,
): Record<string, string> {
  return labelRowToPdfmeInput(
    templateId,
    {
      serial: "ST-SKUD-000003",
      qrPayload: "84dd98c5-2cc0-47a6-9efc-01b33434cde0",
      status: "GENERATED",
      productName: "Inyange Mineral Water 500ml",
      sku: "SKU-500ML",
      batchCode: "LOT-42",
      createdAt: new Date().toISOString(),
    },
    origin,
  );
}

function formatBatchLine(row: LabelRow): string {
  const parts: string[] = [];
  if (row.batchCode) parts.push(`Batch ${row.batchCode}`);
  if (row.sku) parts.push(row.sku);
  return parts.join(" · ");
}

export function labelRowToPdfmeInput(
  templateId: LabelTemplateId,
  row: LabelRow,
  origin: string,
): Record<string, string> {
  const batchLine = formatBatchLine(row);
  const verifyUrl = verifyUrlForPayload(row.qrPayload, origin);

  switch (templateId) {
    case "bottle_wrap":
      return {
        productName: row.productName || "Inyange Mineral Water",
        subTitle: "Natural Pure Mineral Water",
        volume: "500 ml e",
        specTitle: "Composition (mg/L)",
        specBody: "Calcium: 12.4\nMagnesium: 4.8\nPotassium: 2.1\nSodium: 3.5\nBicarbonates: 64.0\npH: 7.2",
        qr: verifyUrl,
        serial: row.serial,
        batchLine,
        expiryDate: "EXP: 12/2027",
        hint: "Scan seal to verify",
      };
    case "security_seal":
      return {
        qr: verifyUrl,
        serial: row.serial,
        hint: "SANTRACK SEAL",
      };
    case "carton":
      return {
        productName: row.productName || "Product",
        barcode: row.serial,
        serial: row.serial,
        // batchCode falls back to batchLine text so the barcode slot is never
        // blank — a blank Code 128 would cause the PDF renderer to error.
        batchBarcode: row.batchCode || row.serial,
        batchLine,
      };
    case "shelf":
      return {
        productName: row.productName || "Product",
        qr: verifyUrl,
        hint: "Scan seal · " + row.serial,
      };
    default:
      return {
        // Always encode the openable verify URL so a phone camera opens
        // authenticity without pasting a raw UUID into /verify.
        qr: verifyUrl,
        productName: row.productName || "Product",
        serial: row.serial,
        batchLine,
        hint: "Scan seal to verify",
        trustMark: "SANTRACK SEAL",
      };
  }
}

export function rowsToPdfmeInputs(
  templateId: LabelTemplateId,
  rows: LabelRow[],
  origin: string,
): Record<string, string>[] {
  return rows.map((row) => labelRowToPdfmeInput(templateId, row, origin));
}

type StyledLabelTemplate = Template & { santrackPageBackgrounds?: string[] };

function withPrintablePageBackgrounds(template: Template): Template {
  const { santrackPageBackgrounds = [], ...plainTemplate } = template as StyledLabelTemplate;
  const basePdf = template.basePdf as Record<string, unknown> | null;
  const width = Number(basePdf?.width);
  const height = Number(basePdf?.height);

  // Uploaded artwork already owns the page background. Blank and generated
  // pages receive a printable full-page rectangle behind every other element.
  if (!Number.isFinite(width) || !Number.isFinite(height)) return plainTemplate as Template;

  const schemas = (plainTemplate.schemas ?? [[]]).map((page, pageIndex) => {
    const color = santrackPageBackgrounds[pageIndex] ?? "#ffffff";
    if (color.toLowerCase() === "#ffffff") return page;
    return [
      {
        name: `__pageBackground_${pageIndex + 1}`,
        type: "rectangle",
        position: { x: 0, y: 0 },
        width,
        height,
        color,
        borderColor: color,
        borderWidth: 0,
        readOnly: true,
      },
      ...page,
    ];
  });

  return { ...plainTemplate, schemas } as Template;
}

/**
 * pdfme’s built-in qrcode plugin draws a plain B&W matrix. Swap those
 * fields to images filled with SanTrack Trust QR so printed labels match
 * the designer preview (including per-label color edits).
 */
async function withBrandedTrustQr(
  template: Template,
  inputs: Record<string, string>[],
): Promise<{ template: Template; inputs: Record<string, string>[] }> {
  const qrStyles = new Map<string, TrustQrStyle>();
  const schemas = (template.schemas ?? [[]]).map((page) =>
    page.map((schema) => {
      const type = String((schema as { type?: string }).type ?? "");
      const name = String((schema as { name?: string }).name ?? "");
      if (type === "qrcode" && name) {
        qrStyles.set(
          name,
          resolveTrustQrStyle(
            ((schema as { trustQr?: Partial<TrustQrStyle> }).trustQr) ?? null,
          ),
        );
        return { ...schema, type: "image" };
      }
      return schema;
    }),
  );

  if (qrStyles.size === 0) {
    return { template, inputs };
  }

  const brandedInputs = await Promise.all(
    inputs.map(async (input) => {
      const next = { ...input };
      await Promise.all(
        [...qrStyles.entries()].map(async ([name, style]) => {
          const payload = next[name];
          if (!payload) return;
          next[name] = await renderTrustQrDataUrl(payload, {
            size: 640,
            margin: 1,
            style,
          });
        }),
      );
      return next;
    }),
  );

  return {
    template: { ...template, schemas } as Template,
    inputs: brandedInputs,
  };
}

/** One pool row → one PDF page ("label-sized sheet"). */
export async function generateLabelsPdf(
  templateId: LabelTemplateId,
  rows: LabelRow[],
  origin: string,
  templateOverride?: Template,
): Promise<Uint8Array> {
  const base = withPrintablePageBackgrounds(templateOverride ?? getPdfmeTemplate(templateId));
  const rawInputs = rowsToPdfmeInputs(templateId, rows, origin);
  const { template, inputs } = await withBrandedTrustQr(base, rawInputs);

  return generate({
    template,
    inputs,
    plugins: PDFME_LABEL_PLUGINS,
    options: { font: getDefaultFont() },
  });
}

export function downloadPdfBytes(pdf: Uint8Array, filename: string): void {
  const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openPdfBytes(pdf: Uint8Array): void {
  const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
}
