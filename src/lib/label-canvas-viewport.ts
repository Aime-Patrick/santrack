import type { Canvas } from "fabric";

export type LabelArtboardBounds = {
  width: number;
  height: number;
};

export type LabelCanvasViewport = {
  zoom: number;
  renderWidth: number;
  renderHeight: number;
};

/**
 * Applies one Fabric viewport transform to a fixed logical artboard.
 * Object coordinates and page bounds never depend on this render size.
 */
export function applyLabelCanvasViewport(
  canvas: Canvas,
  artboard: LabelArtboardBounds,
  zoom: number,
): LabelCanvasViewport {
  const renderWidth = Math.max(1, Math.round(artboard.width * zoom));
  const renderHeight = Math.max(1, Math.round(artboard.height * zoom));

  canvas.setDimensions({ width: renderWidth, height: renderHeight });
  canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  canvas.calcOffset();

  return { zoom, renderWidth, renderHeight };
}
