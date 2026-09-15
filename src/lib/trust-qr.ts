import QRCode from "qrcode";

/** Editable Trust QR look — uniqueness stays (dots + seal + Rwanda finders). */
export type TrustQrCenter = "seal" | "sun" | "none";

export type TrustQrStyle = {
  /** Data-module dots */
  moduleColor: string;
  backgroundColor: string;
  /** Finder pattern body */
  finderColor: string;
  /** Rwanda accents on the three finder eyes */
  accentBlue: string;
  accentYellow: string;
  accentGreen: string;
  /** Sun / seal fill */
  centerColor: string;
  center: TrustQrCenter;
  showRwandaFinders: boolean;
  /** Dot diameter relative to module (0.55–0.9) */
  dotScale: number;
  /** Outer plate border */
  borderColor: string;
  /** Border thickness as % of QR size (0–8) */
  borderWidth: number;
  /** Corner roundness as % of QR size (0–35) */
  cornerRadius: number;
};

export const DEFAULT_TRUST_QR_STYLE: TrustQrStyle = {
  moduleColor: "#067eda",
  backgroundColor: "#ffffff",
  finderColor: "#172033",
  accentBlue: "#067eda",
  accentYellow: "#facb2d",
  accentGreen: "#00953C",
  centerColor: "#facb2d",
  center: "seal",
  showRwandaFinders: true,
  dotScale: 0.72,
  borderColor: "#D9E1EA",
  borderWidth: 0,
  cornerRadius: 8,
};

export type TrustQrOptions = {
  size?: number;
  margin?: number;
  style?: Partial<TrustQrStyle>;
};

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function resolveTrustQrStyle(partial?: Partial<TrustQrStyle> | null): TrustQrStyle {
  const base = { ...DEFAULT_TRUST_QR_STYLE, ...(partial ?? {}) };
  return {
    moduleColor: isHex(base.moduleColor) ? base.moduleColor : DEFAULT_TRUST_QR_STYLE.moduleColor,
    backgroundColor: isHex(base.backgroundColor)
      ? base.backgroundColor
      : DEFAULT_TRUST_QR_STYLE.backgroundColor,
    finderColor: isHex(base.finderColor) ? base.finderColor : DEFAULT_TRUST_QR_STYLE.finderColor,
    accentBlue: isHex(base.accentBlue) ? base.accentBlue : DEFAULT_TRUST_QR_STYLE.accentBlue,
    accentYellow: isHex(base.accentYellow) ? base.accentYellow : DEFAULT_TRUST_QR_STYLE.accentYellow,
    accentGreen: isHex(base.accentGreen) ? base.accentGreen : DEFAULT_TRUST_QR_STYLE.accentGreen,
    centerColor: isHex(base.centerColor) ? base.centerColor : DEFAULT_TRUST_QR_STYLE.centerColor,
    center:
      base.center === "sun" || base.center === "none" || base.center === "seal"
        ? base.center
        : DEFAULT_TRUST_QR_STYLE.center,
    showRwandaFinders: base.showRwandaFinders !== false,
    dotScale: Math.min(0.9, Math.max(0.55, Number(base.dotScale) || DEFAULT_TRUST_QR_STYLE.dotScale)),
    borderColor: isHex(base.borderColor) ? base.borderColor : DEFAULT_TRUST_QR_STYLE.borderColor,
    borderWidth: Math.min(8, Math.max(0, Number(base.borderWidth) || 0)),
    cornerRadius: Math.min(35, Math.max(0, Number(base.cornerRadius) || 0)),
  };
}

function inFinder(row: number, col: number, n: number): boolean {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= n - 7) ||
    (row >= n - 7 && col < 7)
  );
}

function drawFinderEye(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  cell: number,
  body: string,
  accent: string | null,
) {
  const r = cell * 0.55;

  // Outer plate
  ctx.fillStyle = accent ?? body;
  roundRect(ctx, originX, originY, cell * 7, cell * 7, r);
  ctx.fill();

  // Quiet inset
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, originX + cell, originY + cell, cell * 5, cell * 5, r * 0.7);
  ctx.fill();

  // Core
  ctx.fillStyle = body;
  roundRect(ctx, originX + cell * 2, originY + cell * 2, cell * 3, cell * 3, r * 0.45);
  ctx.fill();
}

function drawCenterSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoPx: number,
  style: TrustQrStyle,
) {
  if (style.center === "none") return;

  // Soft white pad so modules never collide with the mark
  ctx.fillStyle = style.backgroundColor;
  ctx.beginPath();
  ctx.arc(cx, cy, logoPx * 0.56, 0, Math.PI * 2);
  ctx.fill();

  // Rwanda sun — authenticity mark
  ctx.fillStyle = style.centerColor;
  ctx.beginPath();
  ctx.arc(cx, cy, logoPx * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Inner disc
  ctx.fillStyle = style.backgroundColor;
  ctx.beginPath();
  ctx.arc(cx, cy, logoPx * 0.22, 0, Math.PI * 2);
  ctx.fill();

  if (style.center === "seal") {
    // ST = SanTrack Trust — short, readable at print size
    ctx.fillStyle = style.finderColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(10, logoPx * 0.28)}px Inter, system-ui, sans-serif`;
    ctx.fillText("ST", cx, cy + logoPx * 0.015);
  } else {
    // Pure sun core
    ctx.fillStyle = style.centerColor;
    ctx.beginPath();
    ctx.arc(cx, cy, logoPx * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thin brand ring
  ctx.strokeStyle = style.moduleColor;
  ctx.lineWidth = Math.max(1.25, logoPx * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy, logoPx * 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * SanTrack Trust QR — dotted matrix with a meaningful center seal.
 * Still scannable (ECC H + verify URL). Colors are editable in Label Studio.
 */
export async function renderTrustQrDataUrl(
  value: string,
  options: TrustQrOptions = {},
): Promise<string> {
  const size = options.size ?? 512;
  const margin = options.margin ?? 2;
  const style = resolveTrustQrStyle(options.style);

  const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for Trust QR");

  const cornerPx = (style.cornerRadius / 100) * size;
  const borderPx = (style.borderWidth / 100) * size;

  ctx.save();
  roundRect(ctx, 0, 0, size, size, cornerPx);
  ctx.clip();

  ctx.fillStyle = style.backgroundColor;
  ctx.fillRect(0, 0, size, size);

  const total = n + margin * 2;
  const cell = size / total;
  const dotR = (cell * style.dotScale) / 2;

  // Data + timing + alignment as clean dots (finders drawn separately).
  ctx.fillStyle = style.moduleColor;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!qr.modules.get(row, col)) continue;
      if (inFinder(row, col, n)) continue;

      const x = (col + margin) * cell + cell / 2;
      const y = (row + margin) * cell + cell / 2;
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const finders: Array<{ row: number; col: number; accent: string }> = [
    { row: 0, col: 0, accent: style.accentBlue },
    { row: 0, col: n - 7, accent: style.accentYellow },
    { row: n - 7, col: 0, accent: style.accentGreen },
  ];

  for (const eye of finders) {
    drawFinderEye(
      ctx,
      (eye.col + margin) * cell,
      (eye.row + margin) * cell,
      cell,
      style.finderColor,
      style.showRwandaFinders ? eye.accent : null,
    );
  }

  const logoModules = Math.max(5, Math.round(n * 0.2));
  drawCenterSeal(ctx, size / 2, size / 2, logoModules * cell, style);
  ctx.restore();

  if (borderPx > 0) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = borderPx;
    roundRect(
      ctx,
      borderPx / 2,
      borderPx / 2,
      size - borderPx,
      size - borderPx,
      Math.max(0, cornerPx - borderPx / 2),
    );
    ctx.stroke();
  }

  return canvas.toDataURL("image/png");
}

export async function renderTrustQrBlob(
  value: string,
  options: TrustQrOptions = {},
): Promise<Blob> {
  const dataUrl = await renderTrustQrDataUrl(value, options);
  const res = await fetch(dataUrl);
  return res.blob();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
