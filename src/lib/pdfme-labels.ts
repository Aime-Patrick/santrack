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
          name: "qr",
          type: "qrcode",
          position: { x: pad, y: 5 },
          width: 20,
          height: 20,
        },
        {
          name: "productName",
          type: "text",
          position: { x: 23, y: 4 },
          width: 25,
          height: 6,
          fontSize: 7,
          fontName: "Roboto",
        },
        {
          name: "serial",
          type: "text",
          position: { x: 23, y: 11 },
          width: 25,
          height: 4,
          fontSize: 6,
          fontName: "Roboto",
        },
        {
          name: "batchLine",
          type: "text",
          position: { x: 23, y: 16 },
          width: 25,
          height: 4,
          fontSize: 5,
          fontName: "Roboto",
        },
        {
          name: "hint",
          type: "text",
          position: { x: 23, y: 22 },
          width: 25,
          height: 4,
          fontSize: 5,
          fontName: "Roboto",
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
          name: "border",
          type: "rectangle",
          position: { x: 1, y: 1 },
          width: 28,
          height: 28,
          borderWidth: 0.5,
          borderColor: "#00953C",
        },
        {
          name: "qr",
          type: "qrcode",
          position: { x: 6.5, y: 3 },
          width: 17,
          height: 17,
        },
        {
          name: "serial",
          type: "text",
          position: { x: 2, y: 21 },
          width: 26,
          height: 3.5,
          fontSize: 5,
          fontName: "Roboto",
          alignment: "center",
        },
        {
          name: "hint",
          type: "text",
          position: { x: 2, y: 25 },
          width: 26,
          height: 3,
          fontSize: 4.5,
          fontName: "Roboto",
          alignment: "center",
        },
      ],
    ],
  };
}

function cartonTemplate(): Template {
  return {
    basePdf: { width: 70, height: 40, padding: [pad, pad, pad, pad] },
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
        {
          name: "barcode",
          type: "code128",
          position: { x: 8, y: 10 },
          width: 54,
          height: 16,
          includetext: true,
        },
        {
          name: "serial",
          type: "text",
          position: { x: pad, y: 30 },
          width: 66,
          height: 5,
          fontSize: 7,
          fontName: "Roboto",
        },
        {
          name: "batchLine",
          type: "text",
          position: { x: pad, y: 35 },
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
        hint: "Scan to verify genuine Inyange",
      };
    case "security_seal":
      return {
        qr: row.qrPayload,
        serial: row.serial,
        hint: "RSB Authenticated",
      };
    case "carton":
      return {
        productName: row.productName || "Product",
        barcode: row.serial,
        serial: row.serial,
        batchLine,
      };
    case "shelf":
      return {
        productName: row.productName || "Product",
        qr: verifyUrl,
        hint: "Scan to verify · " + row.serial,
      };
    default:
      return {
        qr: row.qrPayload,
        productName: row.productName || "Product",
        serial: row.serial,
        batchLine,
        hint: "Scan to verify",
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

/** One pool row → one PDF page ("label-sized sheet"). */
export async function generateLabelsPdf(
  templateId: LabelTemplateId,
  rows: LabelRow[],
  origin: string,
  templateOverride?: Template,
): Promise<Uint8Array> {
  const template = templateOverride ?? getPdfmeTemplate(templateId);
  const inputs = rowsToPdfmeInputs(templateId, rows, origin);

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
