import {
  resolveTrustQrStyle,
  renderTrustQrDataUrl,
  type TrustQrStyle,
} from "@/lib/trust-qr";
import {
  Control,
  controlsUtils,
  Ellipse,
  FabricImage,
  FabricText,
  Group,
  Line,
  Rect,
  Textbox,
  type FabricObject,
  type InteractiveFabricObject,
} from "fabric";
import {
  getLabelElementKind,
  resolveLabelPreview,
  type LabelElementKind,
  type LabelPreviewValues,
  type PdfmeSchema,
} from "@/lib/label-designer-model";
import { barcodeService } from "@/services/barcode.service";

function trustQrStyleFromSchema(schema: PdfmeSchema): TrustQrStyle {
  return resolveTrustQrStyle(
    (schema.trustQr as Partial<TrustQrStyle> | undefined) ?? null,
  );
}

export const LABEL_PX_PER_MM = 5;
/** Canva-like selection accent */
export const LABEL_SELECTION_COLOR = "#8b3dff";

export type LabelObjectMeta = {
  schemaName: string;
  schemaType: string;
  pdfme: PdfmeSchema;
  kind: LabelElementKind;
  locked?: boolean;
  /** Soft group id — members move together when selected as a set. */
  groupId?: string;
};

export type LabelFabricObject = FabricObject & {
  labelMeta?: LabelObjectMeta;
};

function renderPillControl(
  this: Control,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: object,
  fabricObject: InteractiveFabricObject,
) {
  const width = this.sizeX || fabricObject.cornerSize;
  const height = this.sizeY || fabricObject.cornerSize;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate((fabricObject.angle * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(width, height) / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = LABEL_SELECTION_COLOR;
  ctx.lineWidth = fabricObject.borderScaleFactor;
  ctx.stroke();
  ctx.restore();
}

/** Purple rotate disc with Lucide RefreshCw paths. */
function renderRotateControl(
  this: Control,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
) {
  const size = this.sizeX ?? 28;
  const radius = size / 2;
  ctx.save();
  ctx.translate(left, top);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = LABEL_SELECTION_COLOR;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // Lucide RefreshCw (viewBox 0 0 24 24), centered on the disc
  const iconSize = size * 0.55;
  const scale = iconSize / 24;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.25;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D("M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"));
  ctx.stroke(new Path2D("M21 3v5h-5"));
  ctx.stroke(new Path2D("M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"));
  ctx.stroke(new Path2D("M8 16H3v5"));
  ctx.restore();

  ctx.restore();
}

export function applyLabelSelectionStyle(object: LabelFabricObject) {
  const locked = object.labelMeta?.locked === true;

  object.set({
    borderColor: LABEL_SELECTION_COLOR,
    borderScaleFactor: 1.75,
    borderOpacityWhenMoving: 0.85,
    cornerColor: "#ffffff",
    cornerStrokeColor: LABEL_SELECTION_COLOR,
    cornerStyle: "circle",
    cornerSize: 12,
    touchCornerSize: 28,
    transparentCorners: false,
    padding: 4,
    // Rotate around the visual center (not top-left), so the element
    // doesn't swing sideways with other content looking "stuck together".
    centeredRotation: true,
    centeredScaling: false,
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    hasBorders: true,
  });

  if (locked) return object;

  const verticalHandles = [object.controls.ml, object.controls.mr].filter(Boolean);
  const horizontalHandles = [object.controls.mt, object.controls.mb].filter(Boolean);
  verticalHandles.forEach((control) => {
    control.sizeX = 6;
    control.sizeY = 16;
    control.render = renderPillControl;
  });
  horizontalHandles.forEach((control) => {
    control.sizeX = 16;
    control.sizeY = 6;
    control.render = renderPillControl;
  });

  const isText = object.labelMeta?.kind === "text" || object.labelMeta?.kind === "dynamicText";
  // Text height follows its content. Horizontal handles reflow the Textbox;
  // corners scale the type, so separate vertical stretch handles are misleading.
  object.setControlVisible("mt", !isText);
  object.setControlVisible("mb", !isText);

  // Dedicated rotate control under the selection (Canva-style).
  object.controls.mtr = new Control({
    x: 0,
    y: 0.5,
    offsetX: 0,
    offsetY: 36,
    withConnection: false,
    cursorStyleHandler: controlsUtils.rotationStyleHandler,
    actionHandler: controlsUtils.rotationWithSnapping,
    actionName: "rotate",
    sizeX: 30,
    sizeY: 30,
    touchSizeX: 44,
    touchSizeY: 44,
    render: renderRotateControl,
  });
  object.setControlVisible("mtr", true);

  return object;
}

export function setLabelObjectLocked(object: LabelFabricObject, locked: boolean) {
  if (!object.labelMeta) return object;
  object.labelMeta = { ...object.labelMeta, locked };
  applyLabelSelectionStyle(object);
  object.setCoords();
  return object;
}

export function normalizeLabelTextScale(object: LabelFabricObject) {
  const isText = object.labelMeta?.kind === "text" || object.labelMeta?.kind === "dynamicText";
  if (!isText) return false;

  const textbox = object as Textbox;
  const scaleX = textbox.scaleX ?? 1;
  const scaleY = textbox.scaleY ?? 1;
  const wasScaled = Math.abs(scaleX - 1) >= 0.001 || Math.abs(scaleY - 1) >= 0.001;
  if (wasScaled) {
    textbox.set({
      width: Math.max(12, textbox.width * scaleX),
      fontSize: Math.max(6, Math.min(192, textbox.fontSize * scaleY)),
      scaleX: 1,
      scaleY: 1,
    });
  }
  textbox.initDimensions();
  textbox.setCoords();
  return wasScaled;
}

/**
 * Bake scaleX/scaleY into shape geometry after resize.
 * Keeps stroke width constant, corner radius correct, and side-handle
 * resize predictable (otherwise scale compounds and shapes “jump”).
 */
export function normalizeLabelShapeScale(object: LabelFabricObject) {
  if (object.labelMeta?.kind !== "shape") return false;

  const scaleX = object.scaleX ?? 1;
  const scaleY = object.scaleY ?? 1;
  const wasScaled = Math.abs(scaleX - 1) >= 0.001 || Math.abs(scaleY - 1) >= 0.001;
  if (!wasScaled) return false;

  if (object instanceof Ellipse) {
    const rx = Math.max(1, (object.rx ?? 1) * scaleX);
    const ry = Math.max(1, (object.ry ?? 1) * scaleY);
    object.set({ rx, ry, scaleX: 1, scaleY: 1 });
  } else {
    const width = Math.max(1, (object.width ?? 1) * scaleX);
    const height = Math.max(1, (object.height ?? 1) * scaleY);
    const rx = Math.min(Math.max(0, Number(object.get("rx") ?? 0) * scaleX), width / 2);
    const ry = Math.min(Math.max(0, Number(object.get("ry") ?? 0) * scaleY), height / 2);
    object.set({ width, height, rx, ry, scaleX: 1, scaleY: 1 });
  }

  object.setCoords();
  return true;
}

/** Normalize text + shape scale after a transform settles. */
export function normalizeLabelObjectScale(object: LabelFabricObject) {
  const textChanged = normalizeLabelTextScale(object);
  const shapeChanged = normalizeLabelShapeScale(object);
  return textChanged || shapeChanged;
}

function getPosition(schema: PdfmeSchema) {
  return {
    x: Number(schema.position?.x ?? 0) * LABEL_PX_PER_MM,
    y: Number(schema.position?.y ?? 0) * LABEL_PX_PER_MM,
  };
}

function getSize(schema: PdfmeSchema) {
  return {
    width: Math.max(Number(schema.width ?? 20) * LABEL_PX_PER_MM, 12),
    height: Math.max(Number(schema.height ?? 10) * LABEL_PX_PER_MM, 8),
  };
}

function getColor(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function attachMeta(
  object: LabelFabricObject,
  schema: PdfmeSchema,
  kind = getLabelElementKind(schema),
) {
  object.labelMeta = {
    schemaName: schema.name,
    schemaType: schema.type,
    pdfme: { ...schema },
    kind,
    locked: schema.locked === true,
    groupId: typeof schema.groupId === "string" && schema.groupId.length > 0 ? schema.groupId : undefined,
  };
  object.set({
    // PDFme positions are measured from the element's top-left corner.
    // Fabric 7 defaults to centered origins, which shifts every element by
    // half its size and causes otherwise valid templates to overlap.
    originX: "left",
    originY: "top",
    centeredRotation: true,
    lockScalingFlip: true,
    // Text, codes, lines, and shapes should be redrawn at the active viewport
    // scale. Reusing a low-resolution object cache makes zoomed labels soft.
    objectCaching: kind === "image",
    visible: schema.visible !== false,
  });
  applyLabelSelectionStyle(object);
  object.setCoords();
  return object;
}

function makeCodeFallback(
  schema: PdfmeSchema,
  kind: "qrcode" | "barcode",
  value: string,
) {
  const { width, height } = getSize(schema);
  const { x, y } = getPosition(schema);
  const border = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: "#ffffff",
    stroke: "#0284c7",
    strokeWidth: 1,
    strokeDashArray: kind === "qrcode" ? [2, 2] : [5, 3],
    rx: kind === "qrcode" ? 3 : 0,
    ry: kind === "qrcode" ? 3 : 0,
    selectable: false,
    evented: false,
  });
  const label = new FabricText(kind === "qrcode" ? "QR" : value, {
    left: width / 2,
    top: height / 2,
    originX: "center",
    originY: "center",
    fontSize: Math.max(Math.min(height * 0.18, 14), 7),
    fontFamily: "Arial",
    fontWeight: "600",
    fill: "#0369a1",
    selectable: false,
    evented: false,
  });
  const group = new Group([border, label], { left: x, top: y });
  group.set({ angle: Number(schema.rotation ?? schema.angle ?? 0) });
  return attachMeta(group as LabelFabricObject, schema, kind);
}

async function makeCodeObject(
  schema: PdfmeSchema,
  kind: "qrcode" | "barcode",
  value: string,
): Promise<LabelFabricObject> {
  const { width, height } = getSize(schema);
  const { x, y } = getPosition(schema);
  let source: string | null = null;
  let objectUrl: string | null = null;

  try {
    if (kind === "qrcode") {
      // Render sharp enough for high editor zoom (scene px * retina headroom).
      const pixelTarget = Math.max(width, height) * 6;
      source = await renderTrustQrDataUrl(value, {
        size: Math.max(720, Math.min(1600, Math.round(pixelTarget))),
        margin: 1,
        style: trustQrStyleFromSchema(schema),
      });
    } else {
      objectUrl = await barcodeService.render({
        symbology: "CODE_128",
        value,
        scale: 3,
        showText: true,
        format: "svg",
      });
      source = objectUrl;
    }

    const image = await FabricImage.fromURL(source);
    image.set({
      left: x,
      top: y,
      angle: Number(schema.rotation ?? schema.angle ?? 0),
      scaleX: width / Math.max(image.width ?? width, 1),
      scaleY: height / Math.max(image.height ?? height, 1),
      // Trust QR is already a crisp bitmap — keep modules sharp when zooming.
      imageSmoothing: false,
      objectCaching: false,
    });
    return attachMeta(image as LabelFabricObject, schema, kind);
  } catch {
    return makeCodeFallback(schema, kind, value);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export async function createLabelFabricObject(
  schema: PdfmeSchema,
  previewValues: LabelPreviewValues,
): Promise<LabelFabricObject | null> {
  const { width, height } = getSize(schema);
  const { x, y } = getPosition(schema);
  const kind = getLabelElementKind(schema);
  const previewValue = resolveLabelPreview(schema, previewValues);

  if (kind === "qrcode" || kind === "barcode") {
    return makeCodeObject(schema, kind, previewValue);
  }

  if (
    kind === "image" &&
    typeof schema.content === "string" &&
    schema.content.startsWith("data:image")
  ) {
    const image = await FabricImage.fromURL(schema.content, { crossOrigin: "anonymous" });
    image.set({
      left: x,
      top: y,
      angle: Number(schema.rotation ?? schema.angle ?? 0),
      scaleX: width / Math.max(image.width ?? width, 1),
      scaleY: height / Math.max(image.height ?? height, 1),
    });
    return attachMeta(image as LabelFabricObject, schema, kind);
  }

  if (kind === "shape") {
    const shape = schema.type === "ellipse"
      ? new Ellipse({ left: x, top: y, rx: width / 2, ry: height / 2 })
      : new Rect({
          left: x,
          top: y,
          width,
          height,
          rx: Number(schema.borderRadius ?? 4),
          ry: Number(schema.borderRadius ?? 4),
        });
    shape.set({
      // Template frames are outlines unless the template explicitly supplies a fill.
      fill: getColor(schema.color ?? schema.fill, "transparent"),
      stroke: getColor(schema.borderColor, "#0284c7"),
      strokeWidth: Number(schema.borderWidth ?? 1),
      // Keep border thickness stable while resizing (Canva-like).
      strokeUniform: true,
      angle: Number(schema.rotation ?? schema.angle ?? 0),
      scaleX: 1,
      scaleY: 1,
    });
    return attachMeta(shape as LabelFabricObject, schema, kind);
  }

  if (kind === "line") {
    const line = new Line([0, 0, width, 0], {
      left: x,
      top: y,
      angle: Number(schema.rotation ?? schema.angle ?? 0),
      stroke: getColor(schema.color, "#0f172a"),
      strokeWidth: Number(schema.thickness ?? 1),
    });
    return attachMeta(line as LabelFabricObject, schema, kind);
  }

  const text = new Textbox(previewValue, {
    left: x,
    top: y,
    width,
    height,
    fontSize: Math.max(Number(schema.fontSize ?? 10) * 1.333, 8),
    fontFamily: getColor(schema.fontName, "Arial"),
    fontWeight: schema.bold ? "700" : "400",
    fontStyle: schema.italic ? "italic" : "normal",
    underline: schema.underline === true,
    linethrough: schema.linethrough === true,
    fill: getColor(schema.fontColor ?? schema.color, "#0f172a"),
    textAlign: getColor(schema.alignment, "left") as "left" | "center" | "right" | "justify",
    editable: false,
    angle: Number(schema.rotation ?? schema.angle ?? 0),
  });
  return attachMeta(text as LabelFabricObject, schema, kind);
}

export function labelFabricObjectToPdfme(object: LabelFabricObject): PdfmeSchema {
  const meta = object.labelMeta;
  const width = object.getScaledWidth() / LABEL_PX_PER_MM;
  const height = object.getScaledHeight() / LABEL_PX_PER_MM;
  const schema: PdfmeSchema = {
    ...(meta?.pdfme ?? { name: "text", type: "text" }),
    name: meta?.schemaName ?? "text",
    type: meta?.schemaType ?? "text",
    position: {
      x: Number(((object.left ?? 0) / LABEL_PX_PER_MM).toFixed(2)),
      y: Number(((object.top ?? 0) / LABEL_PX_PER_MM).toFixed(2)),
    },
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    rotation: Number((object.angle ?? 0).toFixed(2)),
    visible: object.visible !== false,
    locked: meta?.locked === true,
  };

  if (meta?.groupId) schema.groupId = meta.groupId;
  else delete schema.groupId;

  if (meta?.kind === "text" || meta?.kind === "dynamicText") {
    schema.fontSize = Number((Number(object.get("fontSize") ?? 10) / 1.333).toFixed(2));
    schema.fontColor = object.get("fill") ?? schema.fontColor;
    schema.fontName = object.get("fontFamily") ?? schema.fontName;
    schema.alignment = object.get("textAlign") ?? schema.alignment;
    schema.bold = object.get("fontWeight") === "700";
    schema.italic = object.get("fontStyle") === "italic";
    schema.underline = object.get("underline") === true;
    schema.linethrough = object.get("linethrough") === true;
  }

  if (meta?.kind === "shape") {
    const fill = object.get("fill");
    if (fill === "transparent") {
      delete schema.color;
      delete schema.fill;
    } else {
      schema.color = fill ?? schema.color;
    }
    schema.borderColor = object.get("stroke") ?? schema.borderColor;
    schema.borderWidth = object.get("strokeWidth") ?? schema.borderWidth;
    if (schema.type === "rectangle" || schema.type === "rect") {
      const radius = Number(object.get("rx") ?? object.get("ry") ?? 0);
      schema.borderRadius = Number(radius.toFixed(2));
    }
  }

  if (meta?.kind === "line") {
    schema.color = object.get("stroke") ?? schema.color;
    schema.thickness = object.get("strokeWidth") ?? schema.thickness;
  }

  if (meta?.kind === "qrcode") {
    schema.trustQr = resolveTrustQrStyle(
      (meta.pdfme.trustQr as Partial<TrustQrStyle> | undefined) ?? null,
    );
  }

  return schema;
}
