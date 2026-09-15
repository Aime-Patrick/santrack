"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

export const LABEL_MIN_ZOOM = 0.25;
export const LABEL_MAX_ZOOM = 5;
export const LABEL_ZOOM_STEP = 0.1;

/** Horizontal breathing room around the artboard (padding + ring). */
const FIT_GUTTER_X_PX = 72;
/**
 * Vertical room must include artboard padding, selection toolbar above the
 * page, and the “Add page” chrome under the page.
 */
const FIT_GUTTER_Y_PX = 120;

export type LabelViewportState = {
  zoom: number;
  panX: number;
  panY: number;
};

export function clampLabelZoom(zoom: number) {
  return Math.min(LABEL_MAX_ZOOM, Math.max(LABEL_MIN_ZOOM, zoom));
}

export function calculateLabelFitZoom({
  pageWidth,
  pageHeight,
  viewportWidth,
  viewportHeight,
  gutter,
  gutterX = gutter ?? FIT_GUTTER_X_PX,
  gutterY = gutter ?? FIT_GUTTER_Y_PX,
}: {
  pageWidth: number;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gutterX?: number;
  gutterY?: number;
  /** @deprecated use gutterX/gutterY */
  gutter?: number;
  /** @deprecated ignored — fit uses the full viewport (up to LABEL_MAX_ZOOM) */
  comfortCap?: number;
}) {
  if (pageWidth <= 0 || pageHeight <= 0) return 1;
  const horizontalRoom = Math.max(viewportWidth - gutterX, 120);
  const verticalRoom = Math.max(viewportHeight - gutterY, 120);
  const fitted = Math.min(horizontalRoom / pageWidth, verticalRoom / pageHeight);
  return clampLabelZoom(Math.floor(fitted * 20) / 20);
}

export function calculateLabelFitWidthZoom({
  pageWidth,
  viewportWidth,
  gutter,
  gutterX = gutter ?? FIT_GUTTER_X_PX,
}: {
  pageWidth: number;
  viewportWidth: number;
  gutterX?: number;
  /** @deprecated use gutterX */
  gutter?: number;
  /** @deprecated ignored — fit uses the full viewport (up to LABEL_MAX_ZOOM) */
  comfortCap?: number;
}) {
  if (pageWidth <= 0) return 1;
  const horizontalRoom = Math.max(viewportWidth - gutterX, 120);
  return clampLabelZoom(Math.floor((horizontalRoom / pageWidth) * 20) / 20);
}

type PanSession = {
  pointerId: number;
  clientX: number;
  clientY: number;
  scrollLeft: number;
  scrollTop: number;
};

export function useLabelEditorViewport({
  pageWidth,
  pageHeight,
}: {
  pageWidth: number;
  pageHeight: number;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panSessionRef = useRef<PanSession | null>(null);
  const zoomRef = useRef(1);
  /** When true, viewport resizes re-run fit-to-page. Manual zoom turns this off. */
  const autoFitRef = useRef(true);
  const [viewportState, setViewportState] = useState<LabelViewportState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const commitZoom = useCallback((next: number, options?: { autoFit?: boolean }) => {
    const zoom = Number(clampLabelZoom(next).toFixed(2));
    zoomRef.current = zoom;
    if (options?.autoFit !== undefined) {
      autoFitRef.current = options.autoFit;
    }
    setViewportState((current) => ({ ...current, zoom }));
  }, []);

  const setZoom = useCallback((next: number | ((current: number) => number)) => {
    const value = typeof next === "function" ? next(zoomRef.current) : next;
    // Slider / zoom buttons are intentional — stop fighting the user on resize.
    commitZoom(value, { autoFit: false });
  }, [commitZoom]);

  const zoomBy = useCallback((amount: number) => {
    setZoom((current) => current + amount);
  }, [setZoom]);

  const centerViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      left: Math.max((viewport.scrollWidth - viewport.clientWidth) / 2, 0),
      top: Math.max((viewport.scrollHeight - viewport.clientHeight) / 2, 0),
    });
    setViewportState((current) => ({
      ...current,
      panX: viewport.scrollLeft,
      panY: viewport.scrollTop,
    }));
  }, []);

  const fitPage = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    commitZoom(
      calculateLabelFitZoom({
        pageWidth,
        pageHeight,
        viewportWidth: viewport.clientWidth,
        viewportHeight: viewport.clientHeight,
      }),
      { autoFit: true },
    );
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(centerViewport);
    });
  }, [centerViewport, commitZoom, pageHeight, pageWidth]);

  const fitWidth = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    commitZoom(
      calculateLabelFitWidthZoom({
        pageWidth,
        viewportWidth: viewport.clientWidth,
      }),
      { autoFit: true },
    );
    window.requestAnimationFrame(() => {
      viewport.scrollTo({ left: 0, top: 0 });
      setViewportState((current) => ({
        ...current,
        panX: viewport.scrollLeft,
        panY: viewport.scrollTop,
      }));
    });
  }, [commitZoom, pageWidth]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const frame = window.requestAnimationFrame(fitPage);
    const observer = new ResizeObserver(() => {
      if (!autoFitRef.current) return;
      if (viewport.clientWidth > 0 && viewport.clientHeight > 0) fitPage();
    });
    observer.observe(viewport);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitPage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Space") {
        event.preventDefault();
        setSpacePressed(true);
      }
    };
    const releaseSpace = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpacePressed(false);
    };
    const resetInteraction = () => {
      panSessionRef.current = null;
      setSpacePressed(false);
      setIsPanning(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", releaseSpace);
    window.addEventListener("blur", resetInteraction);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", releaseSpace);
      window.removeEventListener("blur", resetInteraction);
    };
  }, []);

  const onPointerDownCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const shouldPan = event.button === 1 || (event.button === 0 && spacePressed);
    if (!shouldPan) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    panSessionRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setIsPanning(true);
  }, [spacePressed]);

  const onPointerMoveCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    const viewport = viewportRef.current;
    if (!session || !viewport || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    viewport.scrollLeft = session.scrollLeft - (event.clientX - session.clientX);
    viewport.scrollTop = session.scrollTop - (event.clientY - session.clientY);
    setViewportState((current) => ({
      ...current,
      panX: viewport.scrollLeft,
      panY: viewport.scrollTop,
    }));
  }, []);

  const stopPanning = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panSessionRef.current = null;
    setIsPanning(false);
  }, []);

  const onWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Plain wheel / trackpad: scroll the artboard (Fabric can swallow this otherwise).
    if (!event.ctrlKey && !event.metaKey) {
      if (viewport.scrollHeight <= viewport.clientHeight && viewport.scrollWidth <= viewport.clientWidth) {
        return;
      }
      event.preventDefault();
      viewport.scrollLeft += event.deltaX;
      viewport.scrollTop += event.deltaY;
      setViewportState((current) => ({
        ...current,
        panX: viewport.scrollLeft,
        panY: viewport.scrollTop,
      }));
      return;
    }

    event.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const contentX = viewport.scrollLeft + pointerX;
    const contentY = viewport.scrollTop + pointerY;
    const previousZoom = zoomRef.current;
    const nextZoom = clampLabelZoom(
      previousZoom + (event.deltaY < 0 ? LABEL_ZOOM_STEP : -LABEL_ZOOM_STEP),
    );
    commitZoom(nextZoom, { autoFit: false });
    window.requestAnimationFrame(() => {
      const ratio = nextZoom / previousZoom;
      viewport.scrollTo({
        left: Math.max(contentX * ratio - pointerX, 0),
        top: Math.max(contentY * ratio - pointerY, 0),
      });
    });
  }, [commitZoom]);

  const onScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setViewportState((current) => {
      if (current.panX === viewport.scrollLeft && current.panY === viewport.scrollTop) return current;
      return { ...current, panX: viewport.scrollLeft, panY: viewport.scrollTop };
    });
  }, []);

  return {
    viewportRef,
    viewportState,
    zoom: viewportState.zoom,
    setZoom,
    zoomBy,
    fitPage,
    fitWidth,
    isPanning,
    spacePressed,
    viewportInteractionProps: {
      onPointerDownCapture,
      onPointerMoveCapture,
      onPointerUpCapture: stopPanning,
      onPointerCancelCapture: stopPanning,
      onWheel,
      onScroll,
    },
  };
}
