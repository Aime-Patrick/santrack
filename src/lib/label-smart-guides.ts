import type { Canvas, FabricObject } from "fabric";
import { LABEL_PX_PER_MM } from "@/lib/label-fabric-adapter";

export type SmartGuide = {
  orientation: "h" | "v";
  /** Line position in scene coords (x for vertical, y for horizontal). */
  position: number;
  start: number;
  end: number;
  kind: "align" | "size" | "spacing";
  /** Optional distance label in scene px (converted to mm when drawn). */
  label?: number;
};

export type SceneBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

/** Canva-style magenta. */
export const SMART_GUIDE_COLOR = "#f12c8c";

const DEFAULT_THRESHOLD_PX = 7;
const MATCH_EPSILON = 0.6;
/** Ignore micro-gaps / decorative noise below ~0.8 mm. */
const MIN_SPACING_SCENE_PX = LABEL_PX_PER_MM * 0.8;
/** Ignore siblings smaller than ~1.2 mm on both axes (QR module debris, etc.). */
const MIN_SIBLING_SCENE_PX = LABEL_PX_PER_MM * 1.2;

export function getSceneBounds(object: FabricObject): SceneBounds {
  const coords = object.getCoords();
  const xs = coords.map((point) => point.x);
  const ys = coords.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return {
    left,
    top,
    right,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

function pageBounds(width: number, height: number): SceneBounds {
  return {
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    centerX: width / 2,
    centerY: height / 2,
    width,
    height,
  };
}

function collectEdgePoints(bounds: SceneBounds, axis: "x" | "y"): number[] {
  return axis === "x"
    ? [bounds.left, bounds.centerX, bounds.right]
    : [bounds.top, bounds.centerY, bounds.bottom];
}

type AxisSnap = {
  delta: number;
  lines: number[];
};

function findAxisSnap(
  moving: SceneBounds,
  references: SceneBounds[],
  axis: "x" | "y",
  threshold: number,
): AxisSnap | null {
  const movingPoints = collectEdgePoints(moving, axis);
  let bestDelta: number | null = null;
  let bestDistance = threshold + 1;

  for (const reference of references) {
    for (const from of movingPoints) {
      for (const to of collectEdgePoints(reference, axis)) {
        const delta = to - from;
        const distance = Math.abs(delta);
        if (distance <= threshold && distance < bestDistance) {
          bestDistance = distance;
          bestDelta = delta;
        }
      }
    }
  }

  if (bestDelta === null) return null;

  const snappedPoints = movingPoints.map((point) => point + bestDelta);
  const lines = new Set<number>();
  for (const reference of references) {
    for (const refPoint of collectEdgePoints(reference, axis)) {
      if (snappedPoints.some((point) => Math.abs(point - refPoint) <= MATCH_EPSILON)) {
        lines.add(Number(refPoint.toFixed(2)));
      }
    }
  }

  return { delta: bestDelta, lines: [...lines] };
}

function spanForVerticalGuide(moving: SceneBounds, references: SceneBounds[], x: number) {
  const touching = references.filter((bounds) =>
    [bounds.left, bounds.centerX, bounds.right].some((value) => Math.abs(value - x) <= MATCH_EPSILON),
  );
  return {
    start: Math.min(moving.top, ...touching.map((bounds) => bounds.top)) - 12,
    end: Math.max(moving.bottom, ...touching.map((bounds) => bounds.bottom)) + 12,
  };
}

function spanForHorizontalGuide(moving: SceneBounds, references: SceneBounds[], y: number) {
  const touching = references.filter((bounds) =>
    [bounds.top, bounds.centerY, bounds.bottom].some((value) => Math.abs(value - y) <= MATCH_EPSILON),
  );
  return {
    start: Math.min(moving.left, ...touching.map((bounds) => bounds.left)) - 12,
    end: Math.max(moving.right, ...touching.map((bounds) => bounds.right)) + 12,
  };
}

type SpacingCandidate = {
  delta: number;
  guides: SmartGuide[];
};

function overlap1D(a0: number, a1: number, b0: number, b1: number) {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

function crossMid(a: SceneBounds, b: SceneBounds, axis: "x" | "y") {
  if (axis === "x") {
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    if (bottom > top) return (top + bottom) / 2;
    return (a.centerY + b.centerY) / 2;
  }
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  if (right > left) return (left + right) / 2;
  return (a.centerX + b.centerX) / 2;
}

function spacingGuide(axis: "x" | "y", from: number, to: number, cross: number): SmartGuide {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  if (axis === "x") {
    return {
      orientation: "h",
      position: cross,
      start,
      end,
      kind: "spacing",
      label: end - start,
    };
  }
  return {
    orientation: "v",
    position: cross,
    start,
    end,
    kind: "spacing",
    label: end - start,
  };
}

type SideGap = {
  sibling: SceneBounds;
  size: number;
  side: 1 | -1;
};

function collectSideGaps(moving: SceneBounds, siblings: SceneBounds[], axis: "x" | "y"): SideGap[] {
  const sideGaps: SideGap[] = [];
  for (const sibling of siblings) {
    if (axis === "x") {
      if (overlap1D(moving.top, moving.bottom, sibling.top, sibling.bottom) < -20) continue;
      if (moving.left >= sibling.right) {
        sideGaps.push({ sibling, size: moving.left - sibling.right, side: 1 });
      } else if (sibling.left >= moving.right) {
        sideGaps.push({ sibling, size: sibling.left - moving.right, side: -1 });
      }
    } else {
      if (overlap1D(moving.left, moving.right, sibling.left, sibling.right) < -20) continue;
      if (moving.top >= sibling.bottom) {
        sideGaps.push({ sibling, size: moving.top - sibling.bottom, side: 1 });
      } else if (sibling.top >= moving.bottom) {
        sideGaps.push({ sibling, size: sibling.top - moving.bottom, side: -1 });
      }
    }
  }
  return sideGaps;
}

function nearestGap(gaps: SideGap[]): SideGap | null {
  if (gaps.length === 0) return null;
  return gaps.reduce((best, gap) => (gap.size < best.size ? gap : best));
}

/**
 * Equal-spacing snap using nearest neighbors only (avoids snapping to
 * decorative micro-gaps between QR modules / color chips).
 */
function findSpacingSnap(
  moving: SceneBounds,
  siblings: SceneBounds[],
  axis: "x" | "y",
  threshold: number,
): SpacingCandidate | null {
  if (siblings.length === 0) return null;

  const sideGaps = collectSideGaps(moving, siblings, axis);
  const leftNeighbor = nearestGap(sideGaps.filter((gap) => gap.side === 1));
  const rightNeighbor = nearestGap(sideGaps.filter((gap) => gap.side === -1));

  let best: SpacingCandidate | null = null;
  const consider = (candidate: SpacingCandidate) => {
    const distance = Math.abs(candidate.delta);
    if (distance > threshold) return;
    if (!best || distance < Math.abs(best.delta)) best = candidate;
  };

  // 1) Center between nearest left and right (or top and bottom) neighbors.
  if (leftNeighbor && rightNeighbor) {
    const delta = (rightNeighbor.size - leftNeighbor.size) / 2;
    const nextLeft = leftNeighbor.size + delta;
    const nextRight = rightNeighbor.size - delta;
    if (nextLeft >= 0 && nextRight >= 0) {
      const guides =
        axis === "x"
          ? [
              spacingGuide("x", leftNeighbor.sibling.right, leftNeighbor.sibling.right + nextLeft, crossMid(moving, leftNeighbor.sibling, "x")),
              spacingGuide("x", rightNeighbor.sibling.left - nextRight, rightNeighbor.sibling.left, crossMid(moving, rightNeighbor.sibling, "x")),
            ]
          : [
              spacingGuide("y", leftNeighbor.sibling.bottom, leftNeighbor.sibling.bottom + nextLeft, crossMid(moving, leftNeighbor.sibling, "y")),
              spacingGuide("y", rightNeighbor.sibling.top - nextRight, rightNeighbor.sibling.top, crossMid(moving, rightNeighbor.sibling, "y")),
            ];
      consider({ delta, guides });
    }
  }

  // 2) Match nearest live gap to other nearest-pair gaps (skip micro gaps).
  const referenceSizes: number[] = [];
  for (let i = 0; i < siblings.length; i += 1) {
    for (let j = i + 1; j < siblings.length; j += 1) {
      const a = siblings[i]!;
      const b = siblings[j]!;
      let gap = -1;
      if (axis === "x") {
        if (overlap1D(a.top, a.bottom, b.top, b.bottom) < 0) continue;
        if (a.right <= b.left) gap = b.left - a.right;
        else if (b.right <= a.left) gap = a.left - b.right;
      } else {
        if (overlap1D(a.left, a.right, b.left, b.right) < 0) continue;
        if (a.bottom <= b.top) gap = b.top - a.bottom;
        else if (b.bottom <= a.top) gap = a.top - b.bottom;
      }
      if (gap >= MIN_SPACING_SCENE_PX) referenceSizes.push(gap);
    }
  }

  const live = leftNeighbor && rightNeighbor
    ? (leftNeighbor.size <= rightNeighbor.size ? leftNeighbor : rightNeighbor)
    : leftNeighbor ?? rightNeighbor;

  if (live && live.size >= 0) {
    for (const targetSize of referenceSizes) {
      if (Math.abs(targetSize - live.size) > threshold * 2) continue;
      const deltaSize = targetSize - live.size;
      const delta = live.side * deltaSize;
      const guides =
        axis === "x"
          ? live.side === 1
            ? [spacingGuide("x", live.sibling.right, live.sibling.right + targetSize, crossMid(moving, live.sibling, "x"))]
            : [spacingGuide("x", live.sibling.left - targetSize, live.sibling.left, crossMid(moving, live.sibling, "x"))]
          : live.side === 1
            ? [spacingGuide("y", live.sibling.bottom, live.sibling.bottom + targetSize, crossMid(moving, live.sibling, "y"))]
            : [spacingGuide("y", live.sibling.top - targetSize, live.sibling.top, crossMid(moving, live.sibling, "y"))];
      consider({ delta, guides });
    }
  }

  return best;
}

/** After a snap, rebuild spacing labels from the real gap (avoids stale math). */
function measureNearestSpacingGuides(moving: SceneBounds, siblings: SceneBounds[], axis: "x" | "y"): SmartGuide[] {
  const sideGaps = collectSideGaps(moving, siblings, axis);
  const leftNeighbor = nearestGap(sideGaps.filter((gap) => gap.side === 1));
  const rightNeighbor = nearestGap(sideGaps.filter((gap) => gap.side === -1));
  const guides: SmartGuide[] = [];

  if (leftNeighbor && leftNeighbor.size >= MIN_SPACING_SCENE_PX) {
    guides.push(
      axis === "x"
        ? spacingGuide("x", leftNeighbor.sibling.right, moving.left, crossMid(moving, leftNeighbor.sibling, "x"))
        : spacingGuide("y", leftNeighbor.sibling.bottom, moving.top, crossMid(moving, leftNeighbor.sibling, "y")),
    );
  }
  if (rightNeighbor && rightNeighbor.size >= MIN_SPACING_SCENE_PX) {
    guides.push(
      axis === "x"
        ? spacingGuide("x", moving.right, rightNeighbor.sibling.left, crossMid(moving, rightNeighbor.sibling, "x"))
        : spacingGuide("y", moving.bottom, rightNeighbor.sibling.top, crossMid(moving, rightNeighbor.sibling, "y")),
    );
  }
  return guides;
}

function findSizeGuides(
  moving: SceneBounds,
  siblings: SceneBounds[],
  threshold: number,
): { width?: number; height?: number; guides: SmartGuide[] } {
  const guides: SmartGuide[] = [];
  let width: number | undefined;
  let height: number | undefined;
  let bestWidthDist = threshold + 1;
  let bestHeightDist = threshold + 1;
  let widthRef: SceneBounds | undefined;
  let heightRef: SceneBounds | undefined;

  for (const reference of siblings) {
    const widthDist = Math.abs(reference.width - moving.width);
    if (widthDist <= threshold && widthDist < bestWidthDist && reference.width >= MIN_SIBLING_SCENE_PX) {
      bestWidthDist = widthDist;
      width = reference.width;
      widthRef = reference;
    }
    const heightDist = Math.abs(reference.height - moving.height);
    if (heightDist <= threshold && heightDist < bestHeightDist && reference.height >= MIN_SIBLING_SCENE_PX) {
      bestHeightDist = heightDist;
      height = reference.height;
      heightRef = reference;
    }
  }

  if (width !== undefined && widthRef) {
    const y = Math.min(moving.top, widthRef.top) - 16;
    guides.push(
      {
        orientation: "h",
        position: y,
        start: moving.left,
        end: moving.left + width,
        kind: "size",
        label: width,
      },
      {
        orientation: "h",
        position: y,
        start: widthRef.left,
        end: widthRef.right,
        kind: "size",
        label: width,
      },
    );
  }
  if (height !== undefined && heightRef) {
    const x = Math.min(moving.left, heightRef.left) - 16;
    guides.push(
      {
        orientation: "v",
        position: x,
        start: moving.top,
        end: moving.top + height,
        kind: "size",
        label: height,
      },
      {
        orientation: "v",
        position: x,
        start: heightRef.top,
        end: heightRef.bottom,
        kind: "size",
        label: height,
      },
    );
  }

  return { width, height, guides };
}

/**
 * Snaps a moving/scaling object and returns guides to draw.
 */
export function applySmartGuides(
  target: FabricObject,
  siblings: FabricObject[],
  page: { width: number; height: number },
  options: { mode: "move" | "scale"; threshold?: number } = { mode: "move" },
): SmartGuide[] {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD_PX;
  const pageBox = pageBounds(page.width, page.height);
  const siblingBounds = siblings
    .map(getSceneBounds)
    .filter((bounds) => bounds.width >= MIN_SIBLING_SCENE_PX || bounds.height >= MIN_SIBLING_SCENE_PX);
  const references = [pageBox, ...siblingBounds];
  let moving = getSceneBounds(target);
  const guides: SmartGuide[] = [];

  if (options.mode === "scale") {
    // Rotated AABBs don't match object-local width/height — snapping here
    // fights the resize handle and makes shapes jump. Guides only.
    const angle = Math.abs(target.angle ?? 0) % 180;
    const rotated = angle > 1 && angle < 179;
    if (rotated) {
      return findSizeGuides(moving, siblingBounds, MATCH_EPSILON).guides;
    }

    const size = findSizeGuides(moving, siblingBounds, threshold);
    // Use live scaled size so snap matches what the user sees, not the
    // pre-scale width/height (which breaks mid-drag and after free resize).
    const scaledWidth = Math.max(target.getScaledWidth(), 1);
    const scaledHeight = Math.max(target.getScaledHeight(), 1);
    const next: { scaleX?: number; scaleY?: number } = {};
    if (size.width !== undefined) {
      next.scaleX = (target.scaleX ?? 1) * (size.width / scaledWidth);
    }
    if (size.height !== undefined) {
      next.scaleY = (target.scaleY ?? 1) * (size.height / scaledHeight);
    }
    if (next.scaleX !== undefined || next.scaleY !== undefined) {
      target.set(next);
      target.setCoords();
      moving = getSceneBounds(target);
    }
    return findSizeGuides(moving, siblingBounds, MATCH_EPSILON).guides;
  }

  const snapX = findAxisSnap(moving, references, "x", threshold);
  const snapY = findAxisSnap(moving, references, "y", threshold);
  const spacingX = snapX ? null : findSpacingSnap(moving, siblingBounds, "x", threshold);
  const spacingY = snapY ? null : findSpacingSnap(moving, siblingBounds, "y", threshold);

  const dx = snapX?.delta ?? spacingX?.delta ?? 0;
  const dy = snapY?.delta ?? spacingY?.delta ?? 0;

  if (dx !== 0 || dy !== 0) {
    target.set({
      left: (target.left ?? 0) + dx,
      top: (target.top ?? 0) + dy,
    });
    target.setCoords();
    moving = getSceneBounds(target);
  }

  if (snapX) {
    for (const x of snapX.lines) {
      const span = spanForVerticalGuide(moving, references, x);
      guides.push({ orientation: "v", position: x, start: span.start, end: span.end, kind: "align" });
    }
  } else if (spacingX) {
    // Remeasure from final position so badge matches the true gap.
    guides.push(...measureNearestSpacingGuides(moving, siblingBounds, "x"));
  }

  if (snapY) {
    for (const y of snapY.lines) {
      const span = spanForHorizontalGuide(moving, references, y);
      guides.push({ orientation: "h", position: y, start: span.start, end: span.end, kind: "align" });
    }
  } else if (spacingY) {
    guides.push(...measureNearestSpacingGuides(moving, siblingBounds, "y"));
  }

  guides.push(...findSizeGuides(moving, siblingBounds, MATCH_EPSILON).guides);
  return guides;
}

function drawBracket(
  ctx: CanvasRenderingContext2D,
  orientation: "h" | "v",
  position: number,
  start: number,
  end: number,
  zoom: number,
) {
  const cap = 5 / Math.max(zoom, 0.01);
  ctx.beginPath();
  if (orientation === "h") {
    ctx.moveTo(start, position);
    ctx.lineTo(end, position);
    ctx.moveTo(start, position - cap);
    ctx.lineTo(start, position + cap);
    ctx.moveTo(end, position - cap);
    ctx.lineTo(end, position + cap);
  } else {
    ctx.moveTo(position, start);
    ctx.lineTo(position, end);
    ctx.moveTo(position - cap, start);
    ctx.lineTo(position + cap, start);
    ctx.moveTo(position - cap, end);
    ctx.lineTo(position + cap, end);
  }
  ctx.stroke();
}

function drawLabelBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  zoom: number,
) {
  const z = Math.max(zoom, 0.01);
  const fontSize = 10 / z;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(text).width;
  const padX = 4.5 / z;
  const padY = 2.5 / z;
  const boxW = width + padX * 2;
  const boxH = fontSize + padY * 2;

  ctx.fillStyle = SMART_GUIDE_COLOR;
  ctx.beginPath();
  ctx.roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 2.5 / z);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, cx, cy + 0.15 / z);
}

function formatMm(scenePx: number) {
  const mm = Math.abs(scenePx) / LABEL_PX_PER_MM;
  if (mm < 0.05) return "0 mm";
  if (mm >= 10) return `${Math.round(mm)} mm`;
  const rounded = Math.round(mm * 10) / 10;
  return `${rounded.toFixed(1)} mm`;
}

export function drawSmartGuides(canvas: Canvas, guides: SmartGuide[], zoom: number) {
  if (guides.length === 0) return;
  const ctx = canvas.contextContainer;
  const vpt = canvas.viewportTransform;
  if (!ctx || !vpt) return;

  const z = Math.max(zoom, 0.01);
  ctx.save();
  ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
  ctx.strokeStyle = SMART_GUIDE_COLOR;
  ctx.fillStyle = SMART_GUIDE_COLOR;
  ctx.lineWidth = 1.25 / z;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);

  for (const guide of guides) {
    if (guide.kind === "align") {
      ctx.beginPath();
      if (guide.orientation === "v") {
        ctx.moveTo(guide.position, guide.start);
        ctx.lineTo(guide.position, guide.end);
      } else {
        ctx.moveTo(guide.start, guide.position);
        ctx.lineTo(guide.end, guide.position);
      }
      ctx.stroke();

      const tick = 4.5 / z;
      ctx.beginPath();
      if (guide.orientation === "v") {
        ctx.moveTo(guide.position - tick, guide.start);
        ctx.lineTo(guide.position + tick, guide.start);
        ctx.moveTo(guide.position - tick, guide.end);
        ctx.lineTo(guide.position + tick, guide.end);
      } else {
        ctx.moveTo(guide.start, guide.position - tick);
        ctx.lineTo(guide.start, guide.position + tick);
        ctx.moveTo(guide.end, guide.position - tick);
        ctx.lineTo(guide.end, guide.position + tick);
      }
      ctx.stroke();
      continue;
    }

    if (guide.kind === "size") {
      drawBracket(ctx, guide.orientation, guide.position, guide.start, guide.end, zoom);
      if (guide.label !== undefined) {
        const cx = guide.orientation === "h" ? (guide.start + guide.end) / 2 : guide.position;
        const cy = guide.orientation === "h" ? guide.position : (guide.start + guide.end) / 2;
        drawLabelBadge(ctx, formatMm(guide.label), cx, cy, zoom);
      }
      continue;
    }

    if (guide.kind === "spacing") {
      drawBracket(ctx, guide.orientation, guide.position, guide.start, guide.end, zoom);
      if (guide.label !== undefined) {
        const cx = guide.orientation === "h" ? (guide.start + guide.end) / 2 : guide.position;
        const cy = guide.orientation === "h" ? guide.position : (guide.start + guide.end) / 2;
        drawLabelBadge(ctx, formatMm(guide.label), cx, cy, zoom);
      }
    }
  }

  ctx.restore();
}

export function getGuideSiblings(canvas: Canvas, target: FabricObject): FabricObject[] {
  const selected = new Set<FabricObject>();
  selected.add(target);
  const active = canvas.getActiveObject();
  if (active && "getObjects" in active && typeof (active as { getObjects: () => FabricObject[] }).getObjects === "function") {
    for (const object of (active as { getObjects: () => FabricObject[] }).getObjects()) {
      selected.add(object);
    }
  }
  return canvas.getObjects().filter((object) => {
    if (selected.has(object) || object.visible === false) return false;
    const bounds = getSceneBounds(object);
    return bounds.width >= MIN_SIBLING_SCENE_PX || bounds.height >= MIN_SIBLING_SCENE_PX;
  });
}
