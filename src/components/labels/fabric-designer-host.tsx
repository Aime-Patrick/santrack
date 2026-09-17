"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { Template } from "@pdfme/common";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Blocks,
  BringToFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  ClipboardPaste,
  CloudUpload,
  Copy,
  CopyPlus,
  Crown,
  Folder,
  FolderPlus,
  Grid3X3,
  Group,
  Highlighter,
  ImagePlus,
  Images,
  LayoutTemplate,
  ListFilter,
  LockKeyhole,
  Maximize2,
  Minus,
  MoveDown,
  Move,
  MousePointer2,
  Palette,
  PenLine,
  Plus,
  Redo2,
  RefreshCw,
  Search,
  Shapes,
  Square,
  Star,
  StickyNote,
  Table2,
  Trash2,
  Type,
  Underline,
  Ungroup,
  UnlockKeyhole,
  Italic,
  Strikethrough,
  Undo2,
  WandSparkles,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Canvas, ActiveSelection, type FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LABEL_ZOOM_STEP, useLabelEditorViewport } from "@/hooks/use-label-editor-viewport";
import { applyLabelCanvasViewport } from "@/lib/label-canvas-viewport";
import { LABEL_BIND_FIELDS, bindFieldsForKind } from "@/lib/label-studio";
import { resolveLabelPreview, templateToDesignDocument, type LabelPreviewValues, type PdfmeSchema } from "@/lib/label-designer-model";
import {
  applyLabelSelectionStyle,
  createLabelFabricObject,
  LABEL_PX_PER_MM,
  LABEL_SELECTION_COLOR,
  labelFabricObjectToPdfme,
  normalizeLabelObjectScale,
  setLabelObjectLocked,
  type LabelFabricObject,
} from "@/lib/label-fabric-adapter";
import {
  canGroupLabelSelection,
  collectLabelSelection,
  createLabelGroupId,
  expandSelectionToLabelGroup,
  getLabelGroupId,
  groupLabelSelection,
  selectionHasLabelGroup,
  setLabelGroupId,
  ungroupLabelSelection,
} from "@/lib/label-grouping";
import {
  applySmartGuides,
  drawSmartGuides,
  getGuideSiblings,
  type SmartGuide,
} from "@/lib/label-smart-guides";
import {
  DEFAULT_TRUST_QR_STYLE,
  resolveTrustQrStyle,
  type TrustQrStyle,
} from "@/lib/trust-qr";
import { cn } from "@/lib/utils";

const PX_PER_MM = LABEL_PX_PER_MM;
const DEFAULT_CANVAS_SIZE = { width: 100, height: 60 };

type LabelObject = LabelFabricObject;

type StudioTool = "templates" | "elements" | "text" | "brand" | "uploads" | "tools" | "projects";
type ProjectTab = "all" | "designs" | "folders" | "images";
type PageContextPosition = { x: number; y: number };
type TemplatePage = NonNullable<Template["schemas"]>[number];
type StyledLabelTemplate = Template & { santrackPageBackgrounds?: string[] };
type PageClipboard = { schemas: TemplatePage; backgroundColor: string };

const DEFAULT_PAGE_BACKGROUND = "#ffffff";

type StudioTemplateOption = {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description?: string;
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function pageBackgrounds(template: Template): string[] {
  return [...((template as StyledLabelTemplate).santrackPageBackgrounds ?? [])];
}

function colorInputValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function PageMenuItem({
  icon,
  label,
  shortcut,
  checked,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span><span className="min-w-0 flex-1 truncate">{label}</span>{checked ? <Check className="size-4 text-primary" /> : null}{shortcut ? <kbd className="shrink-0 rounded-md bg-muted px-2 py-1 font-sans text-[10px] text-muted-foreground">{shortcut}</kbd> : null}</button>;
}

export function FabricDesignerHost({
  template,
  onTemplateChange,
  hostKey,
  pageWidthMm,
  pageHeightMm,
  onAddImage,
  onUploadArtwork,
  onShowDataFields,
  previewValues = {},
  templateOptions = [],
  activeTemplateId,
  onSelectTemplate,
  onCreateBlank,
}: {
  template: Template;
  onTemplateChange: (template: Template) => void;
  hostKey: string;
  pageWidthMm?: number;
  pageHeightMm?: number;
  onAddImage?: (targetPage: number) => void;
  onUploadArtwork?: () => void;
  onShowDataFields?: () => void;
  previewValues?: LabelPreviewValues;
  templateOptions?: StudioTemplateOption[];
  activeTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
  onCreateBlank?: () => void;
}) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const selectionToolbarRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const smartGuidesRef = useRef<SmartGuide[]>([]);
  const artboardSizeRef = useRef({ width: 100 * PX_PER_MM, height: 60 * PX_PER_MM });
  const templateRef = useRef(template);
  const historyRef = useRef<Template[]>([]);
  const historyIndexRef = useRef(-1);
  const pageClipboardRef = useRef<PageClipboard | null>(null);
  const [selectedObject, setSelectedObject] = useState<LabelObject | null>(null);
  const [pageSelected, setPageSelected] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageContextMenu, setPageContextMenu] = useState<PageContextPosition | null>(null);
  const [pageClipboardAvailable, setPageClipboardAvailable] = useState(false);
  const [backgroundLocked, setBackgroundLocked] = useState(false);
  const [objectCount, setObjectCount] = useState(0);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<StudioTool | null>(null);
  const [elementCategory, setElementCategory] = useState<string | null>(null);
  const [panelQuery, setPanelQuery] = useState("");
  const [projectTab, setProjectTab] = useState<ProjectTab>("all");

  const pageCount = Math.max(template.schemas?.length ?? 0, 1);

  useEffect(() => {
    templateRef.current = template;
    setPageIndex((current) => Math.min(current, Math.max((template.schemas?.length ?? 1) - 1, 0)));
  }, [template]);

  const refreshSelection = useCallback(() => {
    const active = canvasRef.current?.getActiveObject() as LabelObject | undefined;
    setSelectedObject(active ?? null);
    setSelectionVersion((version) => version + 1);
  }, []);

  const syncSelectionToolbarPosition = useCallback((canvas?: Canvas | null) => {
    const toolbar = selectionToolbarRef.current;
    const activeCanvas = canvas ?? canvasRef.current;
    const active = activeCanvas?.getActiveObject() as LabelObject | undefined;
    if (!toolbar || !active) return;

    // getBoundingRect is scene-space; artboard CSS is scene * zoom.
    const bound = active.getBoundingRect();
    const z = Math.max(zoomRef.current, 0.01);
    const artboard = artboardSizeRef.current;
    const toolbarHeight = toolbar.offsetHeight || 44;
    const toolbarWidth = toolbar.offsetWidth || 360;
    const gap = 12;
    const handlePad = 8;
    const edgePad = 8;

    const objectTop = bound.top * z;
    const centerX = (bound.left + bound.width / 2) * z;
    const pageWidth = artboard.width * z;

    // Always float above the selection (Canva-style). Negative top is OK —
    // it hangs into the viewport padding above the page instead of covering
    // the object or jumping to the bottom of the artboard.
    const top = objectTop - toolbarHeight - gap - handlePad;

    const halfW = toolbarWidth / 2;
    const left = Math.min(
      Math.max(centerX, halfW + edgePad),
      Math.max(halfW + edgePad, pageWidth - halfW - edgePad),
    );

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }, []);

  const rememberTemplate = useCallback((nextTemplate: Template) => {
    if (historyIndexRef.current === -1) {
      historyRef.current = [templateRef.current];
      historyIndexRef.current = 0;
    }
    const current = historyRef.current[historyIndexRef.current];
    const nextSignature = JSON.stringify({ basePdf: nextTemplate.basePdf, backgrounds: pageBackgrounds(nextTemplate), schemas: nextTemplate.schemas ?? [] });
    const currentSignature = current ? JSON.stringify({ basePdf: current.basePdf, backgrounds: pageBackgrounds(current), schemas: current.schemas ?? [] }) : null;
    if (nextSignature === currentSignature) return;

    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(nextTemplate);
    historyRef.current = nextHistory.slice(-40);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setHistoryVersion((version) => version + 1);
  }, []);

  const emitTemplate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pages = [...(templateRef.current.schemas ?? [[]])];
    pages[pageIndex] = canvas.getObjects().map((object) => labelFabricObjectToPdfme(object as LabelObject)) as TemplatePage;
    const nextTemplate = {
      ...templateRef.current,
      schemas: pages,
    } as Template;
    setObjectCount(canvas.getObjects().length);
    rememberTemplate(nextTemplate);
    templateRef.current = nextTemplate;
    onTemplateChange(nextTemplate);
  }, [onTemplateChange, pageIndex, rememberTemplate]);

  useEffect(() => {
    const element = canvasElementRef.current;
    if (!element) return;

    let cancelled = false;
    const currentTemplate = templateRef.current;
    const designDocument = templateToDesignDocument(currentTemplate, {
      width: pageWidthMm ?? DEFAULT_CANVAS_SIZE.width,
      height: pageHeightMm ?? DEFAULT_CANVAS_SIZE.height,
    });
    const activeDesignPage = designDocument.pages[pageIndex] ?? designDocument.pages[0];
    if (!activeDesignPage) return;
    const pageSize = {
      width: activeDesignPage.widthMm,
      height: activeDesignPage.heightMm,
    };
    const artboardBounds = {
      width: pageSize.width * PX_PER_MM,
      height: pageSize.height * PX_PER_MM,
    };
    artboardSizeRef.current = artboardBounds;
    const canvas = new Canvas(element, {
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: "transparent",
      // Free resize by default; hold Shift for proportional (Canva-like).
      uniformScaling: false,
      uniScaleKey: "shiftKey",
      centeredScaling: false,
    });
    canvas.setDimensions(artboardBounds);
    canvas.set({
      selectionColor: "rgba(139, 61, 255, 0.06)",
      selectionBorderColor: LABEL_SELECTION_COLOR,
    });
    canvasRef.current = canvas;

    const clearSmartGuides = () => {
      if (smartGuidesRef.current.length === 0) return;
      smartGuidesRef.current = [];
      canvas.requestRenderAll();
    };

    const runSmartGuides = (mode: "move" | "scale") => {
      const active = canvas.getActiveObject();
      if (!active) {
        clearSmartGuides();
        return;
      }
      const threshold = 8 / Math.max(zoomRef.current, 0.01);
      smartGuidesRef.current = applySmartGuides(
        active,
        getGuideSiblings(canvas, active),
        artboardSizeRef.current,
        { mode, threshold },
      );
      syncSelectionToolbarPosition(canvas);
      canvas.requestRenderAll();
    };

    const load = async () => {
      const objects = await Promise.all(
        activeDesignPage.elements.map((element) => createLabelFabricObject(element.source, previewValues)),
      );
      if (cancelled) return;
      objects.filter((object): object is LabelObject => object !== null).forEach((object) => {
        normalizeLabelObjectScale(object);
        canvas.add(object);
      });
      setObjectCount(canvas.getObjects().length);
      refreshSelection();
      canvas.requestRenderAll();
    };

    const handleModified = () => {
      const active = canvas.getActiveObject() as LabelObject | undefined;
      if (active) {
        if (active instanceof ActiveSelection) {
          for (const item of active.getObjects()) {
            normalizeLabelObjectScale(item as LabelObject);
          }
        } else {
          normalizeLabelObjectScale(active);
        }
      }
      clearSmartGuides();
      refreshSelection();
      emitTemplate();
      syncSelectionToolbarPosition(canvas);
    };
    const handleMoving = () => {
      runSmartGuides("move");
    };
    const handleScaling = () => {
      runSmartGuides("scale");
    };
    const handleRotating = () => {
      // Update toolbar via DOM only — avoid React remounts mid-drag (insertBefore crash).
      clearSmartGuides();
      syncSelectionToolbarPosition(canvas);
    };
    const handleAfterRender = () => {
      drawSmartGuides(canvas, smartGuidesRef.current, zoomRef.current);
    };
    canvas.on("object:modified", handleModified);
    canvas.on("object:moving", handleMoving);
    canvas.on("object:scaling", handleScaling);
    canvas.on("object:rotating", handleRotating);
    canvas.on("after:render", handleAfterRender);
    canvas.on("mouse:up", clearSmartGuides);
    const handleSelectionCreated = () => {
      setPageSelected(false);
      let active = canvas.getActiveObject() as LabelObject | undefined;
      if (active && expandSelectionToLabelGroup(canvas, active)) {
        active = canvas.getActiveObject() as LabelObject | undefined;
      }
      if (active) applyLabelSelectionStyle(active);
      if (active instanceof ActiveSelection) {
        active.getObjects().forEach((object) => applyLabelSelectionStyle(object as LabelObject));
      }
      refreshSelection();
      canvas.requestRenderAll();
      // Position after React paints the toolbar
      requestAnimationFrame(() => syncSelectionToolbarPosition(canvas));
    };
    const handleSelectionCleared = () => {
      clearSmartGuides();
      refreshSelection();
    };
    const handleCanvasPointer = (event: { target?: FabricObject }) => {
      setPageSelected(!event.target);
    };
    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionCreated);
    canvas.on("selection:cleared", handleSelectionCleared);
    canvas.on("mouse:down", handleCanvasPointer);
    void load();

    return () => {
      cancelled = true;
      canvas.off("object:modified", handleModified);
      canvas.off("object:moving", handleMoving);
      canvas.off("object:scaling", handleScaling);
      canvas.off("object:rotating", handleRotating);
      canvas.off("after:render", handleAfterRender);
      canvas.off("mouse:up", clearSmartGuides);
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionCreated);
      canvas.off("selection:cleared", handleSelectionCleared);
      canvas.off("mouse:down", handleCanvasPointer);
      canvasRef.current = null;
      setSelectedObject(null);
      void canvas.dispose();
    };
  }, [canvasVersion, emitTemplate, hostKey, pageHeightMm, pageIndex, pageWidthMm, previewValues, refreshSelection, syncSelectionToolbarPosition]);

  const addObject = useCallback(async (schema: PdfmeSchema) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const object = await createLabelFabricObject(schema, previewValues);
    if (!object) return;
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    refreshSelection();
    emitTemplate();
  }, [emitTemplate, previewValues, refreshSelection]);

  const addText = () => {
    const count = (canvasRef.current?.getObjects().length ?? 0) + 1;
    void addObject({
      name: `text_${count}`,
      type: "text",
      position: { x: 8, y: 8 },
      width: 32,
      height: 8,
      fontSize: 10,
      fontColor: "#0f172a",
    });
  };

  const addBoundText = (name: string, fontSize = 10, width = 32) => {
    void addObject({
      name,
      type: "text",
      position: { x: 8, y: 8 },
      width,
      height: Math.max(fontSize * 0.8, 7),
      fontSize,
      fontColor: "#0f172a",
      bold: fontSize >= 13,
    });
  };

  const addShape = (
    type: "rectangle" | "ellipse" = "rectangle",
    style: {
      color?: string;
      borderColor?: string;
      width?: number;
      height?: number;
      borderRadius?: number;
      borderWidth?: number;
    } = {},
  ) => {
    const count = (canvasRef.current?.getObjects().length ?? 0) + 1;
    const width = style.width ?? (type === "ellipse" ? 20 : 30);
    const height = style.height ?? (type === "ellipse" ? 20 : 15);
    void addObject({
      name: `shape_${count}`,
      type,
      position: { x: 8, y: 8 },
      width,
      height,
      color: style.color ?? "#e0f2fe",
      borderColor: style.borderColor ?? "#0284c7",
      borderWidth: style.borderWidth ?? 1,
      borderRadius: style.borderRadius ?? (type === "ellipse" ? 0 : 4),
    });
  };

  const addLine = (rotation = 0, color = "#172033", thickness = 1) => {
    const count = (canvasRef.current?.getObjects().length ?? 0) + 1;
    void addObject({
      name: `line_${count}`,
      type: "line",
      position: { x: 8, y: 8 },
      width: 30,
      height: 1,
      color,
      thickness,
      rotation,
    });
  };

  const addVectorShape = (name: string, markup: string, width = 20, height = 20) => {
    const count = (canvasRef.current?.getObjects().length ?? 0) + 1;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#172033">${markup}</g></svg>`;
    void addObject({
      name: `${name}_${count}`,
      type: "image",
      position: { x: 8, y: 8 },
      width,
      height,
      content: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    });
  };

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    if (active instanceof ActiveSelection) {
      canvas.remove(...active.getObjects());
    } else {
      canvas.remove(active);
    }
    canvas.discardActiveObject();
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  }, [emitTemplate, refreshSelection]);

  const duplicateSelected = useCallback(async () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject() as LabelObject | undefined;
    if (!canvas || !active) return;

    if (active instanceof ActiveSelection) {
      const sourceItems = collectLabelSelection(active);
      const cloned: LabelObject[] = [];
      const sharedGroupId = sourceItems.some((item) => getLabelGroupId(item))
        ? createLabelGroupId()
        : undefined;
      for (const item of sourceItems) {
        const duplicate = (await item.clone()) as LabelObject;
        duplicate.set({ left: (item.left ?? 0) + 8, top: (item.top ?? 0) + 8 });
        duplicate.labelMeta = item.labelMeta
          ? { ...item.labelMeta, pdfme: { ...item.labelMeta.pdfme } }
          : undefined;
        if (duplicate.labelMeta) {
          if (sharedGroupId) setLabelGroupId(duplicate, sharedGroupId);
          else setLabelGroupId(duplicate, undefined);
        }
        applyLabelSelectionStyle(duplicate);
        canvas.add(duplicate);
        cloned.push(duplicate);
      }
      if (cloned.length > 0) {
        canvas.setActiveObject(new ActiveSelection(cloned, { canvas }));
      }
    } else {
      const duplicate = (await active.clone()) as LabelObject;
      duplicate.set({ left: (active.left ?? 0) + 8, top: (active.top ?? 0) + 8 });
      duplicate.labelMeta = active.labelMeta
        ? { ...active.labelMeta, pdfme: { ...active.labelMeta.pdfme } }
        : undefined;
      if (duplicate.labelMeta && getLabelGroupId(duplicate)) {
        // Duplicating a single grouped member creates an independent copy.
        setLabelGroupId(duplicate, undefined);
      }
      applyLabelSelectionStyle(duplicate);
      canvas.add(duplicate);
      canvas.setActiveObject(duplicate);
    }
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  }, [emitTemplate, refreshSelection]);

  const groupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !groupLabelSelection(canvas)) return;
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  }, [emitTemplate, refreshSelection]);

  const ungroupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ungroupLabelSelection(canvas)) return;
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  }, [emitTemplate, refreshSelection]);

  const reorderSelected = (direction: "front" | "back") => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    const items = active instanceof ActiveSelection ? active.getObjects() : [active];
    if (direction === "front") items.forEach((object) => canvas.bringObjectToFront(object));
    else items.forEach((object) => canvas.sendObjectToBack(object));
    emitTemplate();
    canvas.requestRenderAll();
  };

  const currentDocument = templateToDesignDocument(template, {
    width: pageWidthMm ?? DEFAULT_CANVAS_SIZE.width,
    height: pageHeightMm ?? DEFAULT_CANVAS_SIZE.height,
  });
  const currentDesignPage = currentDocument.pages[pageIndex] ?? currentDocument.pages[0];
  const pageSize = {
    width: currentDesignPage?.widthMm ?? pageWidthMm ?? DEFAULT_CANVAS_SIZE.width,
    height: currentDesignPage?.heightMm ?? pageHeightMm ?? DEFAULT_CANVAS_SIZE.height,
  };
  const baseWidth = pageSize.width * PX_PER_MM;
  const baseHeight = pageSize.height * PX_PER_MM;
  const {
    viewportRef: canvasViewportRef,
    zoom,
    setZoom,
    zoomBy,
    fitPage: fitCanvas,
    fitWidth,
    viewportState,
    isPanning,
    spacePressed,
    viewportInteractionProps,
  } = useLabelEditorViewport({ pageWidth: baseWidth, pageHeight: baseHeight });
  const currentPageBackgrounds = pageBackgrounds(template);
  const pageBackgroundColor = currentPageBackgrounds[pageIndex] ?? DEFAULT_PAGE_BACKGROUND;
  const sceneCoordinateSignature = currentDesignPage?.elements
    .map(({ id, frame }) => `${id}:${frame.x},${frame.y},${frame.width},${frame.height},${frame.rotation}`)
    .join("|") ?? "";

  const commitPageTemplate = useCallback((nextTemplate: Template, nextPageIndex = pageIndex) => {
    rememberTemplate(nextTemplate);
    templateRef.current = nextTemplate;
    onTemplateChange(nextTemplate);
    setPageIndex(nextPageIndex);
    setPageSelected(true);
    setSelectedObject(null);
    setPageContextMenu(null);
    setCanvasVersion((version) => version + 1);
  }, [onTemplateChange, pageIndex, rememberTemplate]);

  const copyPage = useCallback(() => {
    const pages = templateRef.current.schemas ?? [[]];
    pageClipboardRef.current = {
      schemas: cloneValue(pages[pageIndex] ?? []),
      backgroundColor: pageBackgrounds(templateRef.current)[pageIndex] ?? DEFAULT_PAGE_BACKGROUND,
    };
    setPageClipboardAvailable(true);
    setPageContextMenu(null);
  }, [pageIndex]);

  const pastePage = useCallback(() => {
    if (!pageClipboardRef.current) return;
    const pages = [...(templateRef.current.schemas ?? [[]])];
    const backgrounds = pageBackgrounds(templateRef.current);
    pages[pageIndex] = cloneValue(pageClipboardRef.current.schemas);
    backgrounds[pageIndex] = pageClipboardRef.current.backgroundColor;
    commitPageTemplate({ ...templateRef.current, schemas: pages, santrackPageBackgrounds: backgrounds } as StyledLabelTemplate);
  }, [commitPageTemplate, pageIndex]);

  const addPage = useCallback(() => {
    const pages = [...(templateRef.current.schemas ?? [[]])];
    const backgrounds = pageBackgrounds(templateRef.current);
    const nextIndex = Math.min(pageIndex + 1, pages.length);
    pages.splice(nextIndex, 0, []);
    backgrounds.splice(nextIndex, 0, DEFAULT_PAGE_BACKGROUND);
    commitPageTemplate({ ...templateRef.current, schemas: pages, santrackPageBackgrounds: backgrounds } as StyledLabelTemplate, nextIndex);
  }, [commitPageTemplate, pageIndex]);

  const duplicatePage = useCallback(() => {
    const pages = [...(templateRef.current.schemas ?? [[]])];
    const backgrounds = pageBackgrounds(templateRef.current);
    const nextIndex = Math.min(pageIndex + 1, pages.length);
    pages.splice(nextIndex, 0, cloneValue(pages[pageIndex] ?? []));
    backgrounds.splice(nextIndex, 0, backgrounds[pageIndex] ?? DEFAULT_PAGE_BACKGROUND);
    commitPageTemplate({ ...templateRef.current, schemas: pages, santrackPageBackgrounds: backgrounds } as StyledLabelTemplate, nextIndex);
  }, [commitPageTemplate, pageIndex]);

  const deletePage = useCallback(() => {
    const pages = [...(templateRef.current.schemas ?? [[]])];
    const backgrounds = pageBackgrounds(templateRef.current);
    if (pages.length <= 1) return;
    pages.splice(pageIndex, 1);
    backgrounds.splice(pageIndex, 1);
    const nextIndex = Math.min(pageIndex, pages.length - 1);
    commitPageTemplate({ ...templateRef.current, schemas: pages, santrackPageBackgrounds: backgrounds } as StyledLabelTemplate, nextIndex);
  }, [commitPageTemplate, pageIndex]);

  const updatePageBackground = useCallback((color: string) => {
    if (backgroundLocked || !/^#[0-9a-f]{6}$/i.test(color)) return;
    const backgrounds = pageBackgrounds(templateRef.current);
    while (backgrounds.length <= pageIndex) backgrounds.push(DEFAULT_PAGE_BACKGROUND);
    backgrounds[pageIndex] = color;
    commitPageTemplate({ ...templateRef.current, santrackPageBackgrounds: backgrounds } as StyledLabelTemplate);
  }, [backgroundLocked, commitPageTemplate, pageIndex]);

  const deleteBackground = useCallback(() => {
    const nextTemplate = {
      ...templateRef.current,
      basePdf: { width: pageSize.width, height: pageSize.height, padding: [0, 0, 0, 0] },
    } as Template;
    commitPageTemplate(nextTemplate);
  }, [commitPageTemplate, pageSize.height, pageSize.width]);

  const switchPage = useCallback((nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(nextIndex, pageCount - 1));
    if (boundedIndex === pageIndex) return;
    setPageIndex(boundedIndex);
    setPageSelected(true);
    setPageContextMenu(null);
    setCanvasVersion((version) => version + 1);
  }, [pageCount, pageIndex]);

  const openPageContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    canvasRef.current?.discardActiveObject();
    canvasRef.current?.requestRenderAll();
    refreshSelection();
    setPageSelected(true);
    const menuWidth = 288;
    const menuHeight = 520;
    setPageContextMenu({
      x: Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12)),
      y: Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12)),
    });
  }, [refreshSelection]);

  useEffect(() => {
    if (!pageContextMenu) return;
    const closeMenu = (event?: Event) => {
      if (event?.target instanceof Element && event.target.closest("[data-page-context-menu]")) return;
      setPageContextMenu(null);
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [pageContextMenu]);

  const updateBinding = (value: string) => {
    const object = canvasRef.current?.getActiveObject() as LabelObject | undefined;
    if (!object || !value.trim()) return;
    const meta = object.labelMeta;
    if (!meta) return;
    const schemaName = value.trim().replace(/\s+/g, "_");
    object.labelMeta = { ...meta, schemaName, pdfme: { ...meta.pdfme, name: schemaName } };
    if (meta.kind === "text" || meta.kind === "dynamicText") {
      object.set({ text: resolveLabelPreview({ ...meta.pdfme, name: schemaName }, previewValues) });
    }
    object.setCoords();
    setSelectionVersion((version) => version + 1);
    emitTemplate();
    canvasRef.current?.requestRenderAll();
    if (meta.kind === "qrcode" || meta.kind === "barcode") {
      setCanvasVersion((version) => version + 1);
    }
  };

  const updateTrustQrStyle = async (patch: Partial<TrustQrStyle>) => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject() as LabelObject | undefined;
    const meta = object?.labelMeta;
    if (!canvas || !object || !meta || meta.kind !== "qrcode") return;

    const nextStyle = resolveTrustQrStyle({
      ...((meta.pdfme.trustQr as Partial<TrustQrStyle> | undefined) ?? null),
      ...patch,
    });
    const nextSchema: PdfmeSchema = {
      ...labelFabricObjectToPdfme(object),
      trustQr: nextStyle,
    };
    const replacement = await createLabelFabricObject(nextSchema, previewValues);
    if (!replacement) return;

    const index = canvas.getObjects().indexOf(object);
    canvas.remove(object);
    if (index >= 0) canvas.insertAt(index, replacement);
    else canvas.add(replacement);
    canvas.setActiveObject(replacement);
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  };

  const updateSelectedStyle = (properties: Record<string, unknown>) => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject() as LabelObject | undefined;
    if (!canvas || !object) return;
    object.set(properties);
    normalizeLabelObjectScale(object);
    object.setCoords();
    setSelectionVersion((version) => version + 1);
    emitTemplate();
    canvas.requestRenderAll();
  };

  const updateMetric = (metric: "x" | "y" | "width" | "height" | "rotation", raw: string) => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject() as LabelObject | undefined;
    if (!canvas || !object) return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;

    if (metric === "rotation") {
      object.set({ angle: value });
    } else if (metric === "x") {
      object.set({ left: value * PX_PER_MM });
    } else if (metric === "y") {
      object.set({ top: value * PX_PER_MM });
    } else if (metric === "width" || metric === "height") {
      const next = Math.max(value, 1) * PX_PER_MM;
      const isShape = object.labelMeta?.kind === "shape";
      if (isShape && Math.abs(object.angle ?? 0) < 0.01) {
        // Direct geometry edit — avoids scale compounding on shapes.
        normalizeLabelObjectScale(object);
        if (object.type === "Ellipse") {
          if (metric === "width") object.set({ rx: next / 2, scaleX: 1 });
          else object.set({ ry: next / 2, scaleY: 1 });
        } else if (metric === "width") {
          const width = next;
          const rx = Math.min(Number(object.get("rx") ?? 0), width / 2);
          object.set({ width, rx, scaleX: 1 });
        } else {
          const height = next;
          const ry = Math.min(Number(object.get("ry") ?? 0), height / 2);
          object.set({ height, ry, scaleY: 1 });
        }
      } else if (metric === "width") {
        const current = Math.max(object.getScaledWidth(), 1);
        object.set({ scaleX: (object.scaleX ?? 1) * (next / current) });
      } else {
        const current = Math.max(object.getScaledHeight(), 1);
        object.set({ scaleY: (object.scaleY ?? 1) * (next / current) });
      }
    }
    normalizeLabelObjectScale(object);
    object.setCoords();
    setSelectionVersion((version) => version + 1);
    emitTemplate();
    canvas.requestRenderAll();
  };

  const changeSelectedFontSize = (amount: number) => {
    const object = canvasRef.current?.getActiveObject();
    if (!object) return;
    const currentSize = Number(object.get("fontSize") ?? 12);
    updateSelectedStyle({ fontSize: Math.max(6, Math.min(144, currentSize + amount)) });
  };

  const cycleSelectedTextAlignment = () => {
    const object = canvasRef.current?.getActiveObject();
    if (!object) return;
    const current = String(object.get("textAlign") ?? "left");
    const next = current === "left" ? "center" : current === "center" ? "right" : "left";
    updateSelectedStyle({ textAlign: next });
  };

  const alignSelected = (axis: "horizontal" | "vertical") => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    const pageWidth = pageSize.width * PX_PER_MM;
    const pageHeight = pageSize.height * PX_PER_MM;
    if (axis === "horizontal") object.set({ left: (pageWidth - object.getScaledWidth()) / 2 });
    else object.set({ top: (pageHeight - object.getScaledHeight()) / 2 });
    object.setCoords();
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
    syncSelectionToolbarPosition(canvas);
  };

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const next = historyRef.current[historyIndexRef.current];
    templateRef.current = next;
    onTemplateChange(next);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
    setHistoryVersion((version) => version + 1);
    setCanvasVersion((version) => version + 1);
  }, [onTemplateChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const next = historyRef.current[historyIndexRef.current];
    templateRef.current = next;
    onTemplateChange(next);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setHistoryVersion((version) => version + 1);
    setCanvasVersion((version) => version + 1);
  }, [onTemplateChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (pageSelected && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copyPage();
        return;
      }
      if (pageSelected && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pastePage();
        return;
      }
      if (pageSelected && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        addPage();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
        event.preventDefault();
        if (event.shiftKey) ungroupSelected();
        else groupSelected();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (pageSelected) duplicatePage();
        else void duplicateSelected();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === "]" || event.key === "}")) {
        event.preventDefault();
        reorderSelected("front");
        return;
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === "[" || event.key === "{")) {
        event.preventDefault();
        reorderSelected("back");
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.discardActiveObject();
        const objects = canvas.getObjects();
        if (objects.length === 0) return;
        // Select first object as a practical “focus”; multi-select via shift-click remains available.
        canvas.setActiveObject(objects[objects.length - 1]!);
        setPageSelected(false);
        refreshSelection();
        canvas.requestRenderAll();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (pageSelected && !backgroundLocked && typeof templateRef.current.basePdf === "string") deleteBackground();
        else deleteSelected();
        return;
      }
      const canvas = canvasRef.current;
      const active = canvas?.getActiveObject() as LabelObject | undefined;
      if (canvas && active && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 5 : 1;
        active.set({
          left: (active.left ?? 0) + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0),
          top: (active.top ?? 0) + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
        });
        active.setCoords();
        refreshSelection();
        emitTemplate();
        canvas.requestRenderAll();
      }
      if (event.key === "Escape") {
        setPageContextMenu(null);
        setPageSelected(false);
        canvasRef.current?.discardActiveObject();
        canvasRef.current?.requestRenderAll();
        refreshSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addPage, backgroundLocked, copyPage, deleteBackground, deleteSelected, duplicatePage, duplicateSelected, emitTemplate, groupSelected, pageSelected, pastePage, redo, refreshSelection, reorderSelected, undo, ungroupSelected]);

  const basePdf = template.basePdf as unknown;
  const artwork = typeof basePdf === "string" && basePdf.startsWith("data:image") ? basePdf : null;

  useLayoutEffect(() => {
    zoomRef.current = zoom;
    artboardSizeRef.current = { width: baseWidth, height: baseHeight };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const artboardBounds = { width: baseWidth, height: baseHeight };
    applyLabelCanvasViewport(canvas, artboardBounds, zoom);
    canvas.getElement().style.backgroundColor = artwork ? "transparent" : pageBackgroundColor;
    canvas.getObjects().forEach((object) => {
      applyLabelSelectionStyle(object as LabelObject);
      object.setCoords();
    });
    canvas.requestRenderAll();
    syncSelectionToolbarPosition(canvas);
  }, [artwork, baseHeight, baseWidth, canvasVersion, objectCount, pageBackgroundColor, syncSelectionToolbarPosition, zoom]);

  useLayoutEffect(() => {
    if (!selectedObject || pageSelected) return;
    syncSelectionToolbarPosition();
  }, [pageSelected, selectedObject, selectionVersion, syncSelectionToolbarPosition]);

  const selectedMeta = selectedObject?.labelMeta;
  const selectedIsText = selectedMeta?.kind === "text" || selectedMeta?.kind === "dynamicText";
  const selectedIsQr = selectedMeta?.kind === "qrcode";
  const selectedTrustQr = resolveTrustQrStyle(
    ((selectedMeta?.pdfme.trustQr as Partial<TrustQrStyle> | undefined) ?? null),
  );
  const selectedFontFamily = String(selectedObject?.get("fontFamily") ?? "Roboto");
  const selectedFontSize = Math.round(Number(selectedObject?.get("fontSize") ?? 12));
  const selectedFontColor = String(selectedObject?.get("fill") ?? "#172033");
  const selectedFontWeight = String(selectedObject?.get("fontWeight") ?? "400");
  const selectedItalic = String(selectedObject?.get("fontStyle") ?? "normal") === "italic";
  const selectedUnderline = Boolean(selectedObject?.get("underline"));
  const selectedLinethrough = Boolean(selectedObject?.get("linethrough"));
  const selectedTextAlign = String(selectedObject?.get("textAlign") ?? "left");
  const selectedFillColor = colorInputValue(selectedObject?.get("fill"), "#e0f2fe");
  const selectedStrokeColor = colorInputValue(selectedObject?.get("stroke"), "#0284c7");
  const selectedStrokeWidth = Number(selectedObject?.get("strokeWidth") ?? 1);
  const selectedCornerRadius = Math.round(Number(selectedObject?.get("rx") ?? selectedObject?.get("ry") ?? 0));
  const selectedIsRectShape =
    selectedMeta?.kind === "shape" &&
    (selectedMeta.schemaType === "rectangle" || selectedMeta.schemaType === "rect");
  const selectedX = Number((((selectedObject?.left ?? 0) / PX_PER_MM)).toFixed(1));
  const selectedY = Number((((selectedObject?.top ?? 0) / PX_PER_MM)).toFixed(1));
  const selectedWidth = Number((((selectedObject?.getScaledWidth() ?? 0) / PX_PER_MM)).toFixed(1));
  const selectedHeight = Number((((selectedObject?.getScaledHeight() ?? 0) / PX_PER_MM)).toFixed(1));
  const selectedRotation = Math.round(Number(selectedObject?.angle ?? 0));

  const toolItems: Array<{ id: StudioTool; label: string; icon: ReactNode; premium?: boolean }> = [
    { id: "templates", label: "Templates", icon: <LayoutTemplate className="size-5" /> },
    { id: "elements", label: "Elements", icon: <Shapes className="size-5" /> },
    { id: "text", label: "Text", icon: <Type className="size-5" /> },
    { id: "brand", label: "Brand", icon: <Palette className="size-5" />, premium: true },
    { id: "uploads", label: "Uploads", icon: <CloudUpload className="size-5" /> },
    { id: "tools", label: "Tools", icon: <Wrench className="size-5" /> },
    { id: "projects", label: "Projects", icon: <Folder className="size-5" /> },
  ];

  const toolTitle = activeTool === "elements" && elementCategory === "shapes"
    ? "Shapes"
    : activeTool ? toolItems.find((item) => item.id === activeTool)?.label : null;
  const normalizedPanelQuery = panelQuery.trim().toLowerCase();
  const visibleTemplates = templateOptions.filter((option) => !normalizedPanelQuery || `${option.name} ${option.description ?? ""}`.toLowerCase().includes(normalizedPanelQuery));
  const elementCategories = [
    { id: "shapes", label: "Shapes", icon: <Shapes className="size-8" />, color: "bg-primary/10 text-primary" },
    { id: "graphics", label: "Graphics", icon: <WandSparkles className="size-8" />, color: "bg-warning/20 text-warning-foreground" },
    { id: "photos", label: "Photos", icon: <ImagePlus className="size-8" />, color: "bg-success/10 text-success" },
    { id: "charts", label: "Charts", icon: <Move className="size-8" />, color: "bg-primary/10 text-primary" },
    { id: "forms", label: "Forms", icon: <Square className="size-8" />, color: "bg-success/10 text-success" },
    { id: "tables", label: "Tables", icon: <LayoutTemplate className="size-8" />, color: "bg-warning/20 text-warning-foreground" },
    { id: "frames", label: "Frames", icon: <Copy className="size-8" />, color: "bg-primary/10 text-primary" },
    { id: "grids", label: "Grids", icon: <Blocks className="size-8" />, color: "bg-success/10 text-success" },
    { id: "mockups", label: "Mockups", icon: <Palette className="size-8" />, color: "bg-primary/10 text-primary" },
  ].filter((category) => !normalizedPanelQuery || category.label.toLowerCase().includes(normalizedPanelQuery));

  const shapeGroups: Array<{ title: string; items: Array<{ label: string; preview: ReactNode; action: () => void }> }> = [
    { title: "Lines", items: [
      { label: "Horizontal line", preview: <span className="h-0.5 w-12 bg-foreground" />, action: () => addLine(0) },
      { label: "Diagonal line", preview: <span className="h-0.5 w-12 rotate-45 bg-foreground" />, action: () => addLine(45) },
      { label: "Vertical line", preview: <span className="h-12 w-0.5 bg-foreground" />, action: () => addLine(90) },
    ] },
    { title: "Basic shapes", items: [
      { label: "Square", preview: <span className="size-11 bg-foreground" />, action: () => addShape("rectangle", { width: 20, height: 20, borderRadius: 0 }) },
      { label: "Rounded rectangle", preview: <span className="h-10 w-12 rounded-xl bg-foreground" />, action: () => addShape("rectangle", { width: 28, height: 16, borderRadius: 8 }) },
      { label: "Circle", preview: <span className="size-11 rounded-full bg-foreground" />, action: () => addShape("ellipse", { width: 20, height: 20 }) },
      { label: "Triangle", preview: <svg viewBox="0 0 100 100" className="size-12 fill-current"><polygon points="50,5 96,95 4,95" /></svg>, action: () => addVectorShape("triangle", '<polygon points="50,5 96,95 4,95"/>') },
      { label: "Diamond", preview: <svg viewBox="0 0 100 100" className="size-12 fill-current"><polygon points="50,3 97,50 50,97 3,50" /></svg>, action: () => addVectorShape("diamond", '<polygon points="50,3 97,50 50,97 3,50"/>') },
    ] },
    { title: "Polygons", items: [
      { label: "Pentagon", preview: <svg viewBox="0 0 100 100" className="size-12 fill-current"><polygon points="50,3 97,38 79,94 21,94 3,38" /></svg>, action: () => addVectorShape("pentagon", '<polygon points="50,3 97,38 79,94 21,94 3,38"/>') },
      { label: "Hexagon", preview: <svg viewBox="0 0 100 100" className="size-12 fill-current"><polygon points="25,5 75,5 98,50 75,95 25,95 2,50" /></svg>, action: () => addVectorShape("hexagon", '<polygon points="25,5 75,5 98,50 75,95 25,95 2,50"/>') },
      { label: "Octagon", preview: <svg viewBox="0 0 100 100" className="size-12 fill-current"><polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" /></svg>, action: () => addVectorShape("octagon", '<polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30"/>') },
    ] },
    { title: "Stars", items: [
      { label: "Four-point star", preview: <span className="text-5xl leading-none">✦</span>, action: () => addVectorShape("star_4", '<polygon points="50,0 62,38 100,50 62,62 50,100 38,62 0,50 38,38"/>') },
      { label: "Five-point star", preview: <span className="text-5xl leading-none">★</span>, action: () => addVectorShape("star_5", '<polygon points="50,2 61,36 98,36 68,57 79,93 50,72 21,93 32,57 2,36 39,36"/>') },
      { label: "Eight-point star", preview: <span className="text-5xl leading-none">✹</span>, action: () => addVectorShape("star_8", '<polygon points="50,0 61,26 85,15 74,39 100,50 74,61 85,85 61,74 50,100 39,74 15,85 26,61 0,50 26,39 15,15 39,26"/>') },
    ] },
    { title: "Arrows", items: [
      { label: "Right arrow", preview: <span className="text-5xl leading-none">→</span>, action: () => addVectorShape("arrow_right", '<polygon points="0,32 62,32 62,8 100,50 62,92 62,68 0,68"/>', 28, 14) },
      { label: "Left arrow", preview: <span className="text-5xl leading-none">←</span>, action: () => addVectorShape("arrow_left", '<polygon points="100,32 38,32 38,8 0,50 38,92 38,68 100,68"/>', 28, 14) },
      { label: "Up arrow", preview: <span className="text-5xl leading-none">↑</span>, action: () => addVectorShape("arrow_up", '<polygon points="32,100 32,38 8,38 50,0 92,38 68,38 68,100"/>', 14, 28) },
      { label: "Down arrow", preview: <span className="text-5xl leading-none">↓</span>, action: () => addVectorShape("arrow_down", '<polygon points="32,0 32,62 8,62 50,100 92,62 68,62 68,0"/>', 14, 28) },
    ] },
  ];

  const renderToolPanel = () => {
    if (activeTool === "templates") {
      return <div className="space-y-3">
        {onCreateBlank ? <button type="button" onClick={() => { setActiveTool(null); setPageSelected(false); onCreateBlank(); }} className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-left transition-colors hover:border-primary hover:bg-primary/[0.08]"><span className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-white shadow-xs"><Plus className="size-6 text-primary transition-transform group-hover:scale-110" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-foreground">Start with a blank page</span><span className="mt-1 block text-[13px] leading-4 text-muted-foreground">Empty {pageSize.width} × {pageSize.height} mm page. Add everything yourself.</span></span></button> : null}
        <div className="flex items-center gap-2"><span className="h-px flex-1 bg-border" /><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Or use a template</span><span className="h-px flex-1 bg-border" /></div>
        <div className="relative"><Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={panelQuery} onChange={(event) => setPanelQuery(event.target.value)} className="h-11 rounded-xl bg-card pl-9 text-xs" placeholder="Describe your ideal design" /></div>
        <div className="grid grid-cols-[1fr_1.1fr] gap-2"><Button type="button" variant="outline" className="h-10" disabled title="AI template generation is not connected yet"><WandSparkles className="size-4 text-primary" /> Generate</Button><Button type="button" className="h-10"><Search className="size-4" /> Search</Button></div>
        <div className="grid grid-cols-2 gap-2 pt-1">{visibleTemplates.map((option, index) => <button key={option.id} type="button" onClick={() => { setActiveTool(null); setPageSelected(false); onSelectTemplate?.(option.id); }} className={cn("group overflow-hidden rounded-md border text-left transition-colors", option.id === activeTemplateId ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/50")}><div className={cn("relative aspect-[1.42] overflow-hidden p-2", index % 4 === 0 ? "bg-primary/10" : index % 4 === 1 ? "bg-success/10" : index % 4 === 2 ? "bg-warning/20" : "bg-foreground/5")}><div className="h-full rounded border border-border/70 bg-card p-2 shadow-xs"><div className="h-1.5 w-1/2 rounded bg-primary/70" /><div className="mt-2 flex items-end justify-between"><div className="space-y-1"><div className="h-1 w-10 rounded bg-foreground/50" /><div className="h-1 w-8 rounded bg-foreground/25" /><div className="h-1 w-12 rounded bg-foreground/25" /></div><div className="grid size-8 grid-cols-3 gap-0.5 border border-foreground/20 p-0.5">{Array.from({ length: 9 }).map((_, cell) => <span key={cell} className={cn("bg-foreground", cell % 3 === 1 && "opacity-25")} />)}</div></div></div></div><div className="bg-card p-2"><div className="flex items-center justify-between gap-1"><span className="truncate text-[13px] font-semibold text-foreground">{option.name}</span>{option.id === activeTemplateId ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}</div><span className="font-mono text-[9px] text-muted-foreground">{option.widthMm} × {option.heightMm} mm</span></div></button>)}</div>
        {visibleTemplates.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No label templates match “{panelQuery}”.</p> : null}
      </div>;
    }
    if (activeTool === "elements") {
      if (elementCategory === "shapes") {
        return <div className="space-y-5">
          <div className="relative"><Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={panelQuery} onChange={(event) => setPanelQuery(event.target.value)} className="h-11 rounded-xl bg-card pl-9 text-xs" placeholder="Describe your ideal element" /></div>
          <div className="grid grid-cols-[1fr_1.1fr] gap-2"><Button type="button" variant="outline" className="h-10" disabled title="AI element generation is not connected yet"><WandSparkles className="size-4 text-primary" /> Generate</Button><Button type="button" className="h-10"><Search className="size-4" /> Search</Button></div>
          {shapeGroups.filter((group) => !normalizedPanelQuery || group.title.toLowerCase().includes(normalizedPanelQuery) || group.items.some((item) => item.label.toLowerCase().includes(normalizedPanelQuery))).map((group) => <section key={group.title}><div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-semibold text-foreground">{group.title}</h4><span className="text-[10px] text-muted-foreground">Click to add</span></div><div className="grid grid-cols-4 gap-2">{group.items.filter((item) => !normalizedPanelQuery || group.title.toLowerCase().includes(normalizedPanelQuery) || item.label.toLowerCase().includes(normalizedPanelQuery)).map((item) => <button key={item.label} type="button" onClick={item.action} title={item.label} className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-card text-foreground ring-1 ring-border transition hover:ring-primary">{item.preview}</button>)}</div></section>)}
        </div>;
      }
      return <div className="space-y-4">
        <div className="relative"><Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={panelQuery} onChange={(event) => setPanelQuery(event.target.value)} className="h-11 rounded-xl bg-card pl-9 text-xs" placeholder="Describe your ideal element" /></div>
        <div className="grid grid-cols-[1fr_1.1fr] gap-2"><Button type="button" variant="outline" className="h-10" disabled title="AI element generation is not connected yet"><WandSparkles className="size-4 text-primary" /> Generate</Button><Button type="button" className="h-10"><Search className="size-4" /> Search</Button></div>
        <div><h4 className="mb-3 text-sm font-semibold text-foreground">Browse categories</h4><div className="grid grid-cols-3 gap-x-2 gap-y-4">{elementCategories.map((category) => <button key={category.id} type="button" onClick={() => category.id === "shapes" ? setElementCategory("shapes") : undefined} aria-disabled={category.id !== "shapes"} title={category.id === "shapes" ? `Browse ${category.label}` : `${category.label} is coming soon`} className="group flex flex-col items-center gap-2 text-center"><span className={cn("flex size-16 items-center justify-center rounded-2xl shadow-sm ring-1 ring-border transition-transform group-hover:-translate-y-0.5", category.color)}>{category.icon}</span><span className="text-[13px] font-medium text-foreground">{category.label}</span></button>)}</div></div>
      </div>;
    }
    if (activeTool === "text") {
      return <div className="space-y-2"><Button type="button" className="w-full" onClick={addText}><Type className="size-4" /> Add text box</Button><button type="button" onClick={() => addBoundText("productName", 14, 40)} className="w-full rounded-lg border border-border bg-card p-3 text-left text-base font-bold text-foreground hover:border-primary/50">Add product name</button><button type="button" onClick={() => addBoundText("serial", 10, 34)} className="w-full rounded-lg border border-border bg-card p-3 text-left font-mono text-sm text-foreground hover:border-primary/50">Add serial number</button><button type="button" onClick={() => addBoundText("batchLine", 8, 38)} className="w-full rounded-lg border border-border bg-card p-3 text-left text-xs text-muted-foreground hover:border-primary/50">Add batch and SKU</button></div>;
    }
    if (activeTool === "brand") {
      return <div className="space-y-3"><div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center"><Palette className="mx-auto size-7 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Brand assets</p><p className="mt-1 text-[13px] leading-4 text-muted-foreground">Add your company logo or certification mark.</p></div>{onAddImage ? <Button type="button" variant="outline" className="w-full" onClick={() => onAddImage(pageIndex)}><ImagePlus className="size-4" /> Add logo</Button> : null}</div>;
    }
    if (activeTool === "uploads") {
      return <div className="space-y-2">{onUploadArtwork ? <Button type="button" className="w-full" onClick={onUploadArtwork}><CloudUpload className="size-4" /> Upload background</Button> : null}{onAddImage ? <Button type="button" variant="outline" className="w-full" onClick={() => onAddImage(pageIndex)}><ImagePlus className="size-4" /> Add image</Button> : null}<p className="pt-2 text-[13px] leading-4 text-muted-foreground">PNG, JPG, WebP, SVG, or PDF artwork.</p></div>;
    }
    if (activeTool === "tools") return null;
    if (activeTool === "projects") {
      const showDesigns = projectTab === "all" || projectTab === "designs";
      const showFolders = projectTab === "all" || projectTab === "folders";
      return <div className="space-y-4">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={panelQuery} onChange={(event) => setPanelQuery(event.target.value)} className="h-11 rounded-xl bg-card pl-9 text-xs" placeholder="Search your content" /></div>
        <button type="button" className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-left text-sm font-medium text-foreground"><span className="flex min-w-0 items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Folder className="size-3.5" /></span><span className="truncate">Your projects</span></span><ChevronDown className="size-4 text-muted-foreground" /></button>
        <div className="grid grid-cols-4 border-b border-border">
          {(["all", "designs", "folders", "images"] as ProjectTab[]).map((tab) => <button key={tab} type="button" onClick={() => setProjectTab(tab)} className={cn("relative px-1 pb-2 text-[13px] font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground", projectTab === tab && "text-primary after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary")}>{tab}</button>)}
        </div>
        {showDesigns ? <section className="space-y-2"><div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-foreground">Designs</h4><span className="text-[10px] text-muted-foreground">{visibleTemplates.length} labels</span></div><div className="grid grid-cols-2 gap-2">{visibleTemplates.map((option, index) => <button key={option.id} type="button" onClick={() => { setActiveTool(null); setPageSelected(false); onSelectTemplate?.(option.id); }} className={cn("overflow-hidden rounded-lg border bg-card text-left transition hover:border-primary", option.id === activeTemplateId ? "border-primary ring-2 ring-primary/15" : "border-border")}><div className={cn("aspect-[1.55] p-2", index % 3 === 0 ? "bg-primary/10" : index % 3 === 1 ? "bg-success/10" : "bg-warning/15")}><div className="relative h-full overflow-hidden rounded-sm border border-border/70 bg-white p-1.5 shadow-xs"><div className="h-1 w-1/2 rounded bg-primary/70" /><div className="mt-1.5 h-0.5 w-2/3 rounded bg-foreground/30" /><div className="absolute bottom-1.5 right-1.5 grid size-7 grid-cols-3 gap-px border border-foreground/20 p-0.5">{Array.from({ length: 9 }).map((_, cell) => <span key={cell} className={cn("bg-foreground", cell % 4 === 1 && "opacity-20")} />)}</div></div></div><div className="p-2"><p className="truncate text-[13px] font-semibold text-foreground">{option.name}</p><p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{option.widthMm} × {option.heightMm} mm</p></div></button>)}</div>{visibleTemplates.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground">No projects match “{panelQuery}”.</p> : null}</section> : null}
        {showFolders ? <section className="space-y-2"><h4 className="text-xs font-semibold text-foreground">Folders</h4><div className="space-y-2"><button type="button" className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card p-3 text-left hover:border-primary"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><FolderPlus className="size-5" /></span><span className="text-xs font-semibold text-foreground">Create folder</span></button><button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><Star className="size-5" /></span><span className="text-xs font-semibold text-foreground">Starred</span></button></div></section> : null}
        {projectTab === "images" ? <section className="rounded-xl border border-dashed border-border bg-card p-5 text-center"><Images className="mx-auto size-7 text-primary" /><p className="mt-2 text-xs font-semibold text-foreground">Your uploaded images</p><p className="mt-1 text-[13px] leading-4 text-muted-foreground">Upload logos and artwork to reuse across label projects.</p>{onAddImage ? <Button type="button" size="sm" className="mt-3" onClick={() => onAddImage(pageIndex)}><ImagePlus className="size-4" /> Upload image</Button> : null}</section> : null}
      </div>;
    }
    return null;
  };

  const toggleSelectedLock = () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    const items = collectLabelSelection(active);
    if (items.length === 0) return;
    const nextLocked = !items.every((object) => object.labelMeta?.locked === true);
    items.forEach((object) => setLabelObjectLocked(object, nextLocked));
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
  };

  const rotateSelectedBy = (degrees: number) => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject() as LabelObject | undefined;
    if (!canvas || !object) return;
    const items = collectLabelSelection(object);
    if (items.some((item) => item.labelMeta?.locked)) return;
    object.set({
      centeredRotation: true,
      angle: Number(((object.angle ?? 0) + degrees).toFixed(1)),
    });
    object.setCoords();
    refreshSelection();
    emitTemplate();
    canvas.requestRenderAll();
    syncSelectionToolbarPosition(canvas);
  };

  const showSelectionToolbar = Boolean(selectedObject && !pageSelected);
  const selectedLocked = collectLabelSelection(selectedObject).some((object) => object.labelMeta?.locked === true);
  const canGroupSelection = canGroupLabelSelection(selectedObject);
  const canUngroupSelection = selectionHasLabelGroup(selectedObject);

  // The returned handlers access the Fabric ref only after a user click.
  // eslint-disable-next-line react-hooks/refs
  const toolPanelContent = renderToolPanel();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div data-history-version={historyVersion} className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur-md">
        {selectedIsText ? <>
          <select aria-label="Font family" value={selectedFontFamily} onChange={(event) => updateSelectedStyle({ fontFamily: event.target.value })} className="h-9 w-36 shrink-0 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none focus:border-primary">
            {[selectedFontFamily, "Roboto", "Arial", "Poppins", "Georgia", "Times New Roman"].filter((font, index, fonts) => fonts.indexOf(font) === index).map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <div className="flex h-9 shrink-0 items-center rounded-lg border border-border bg-card">
            <Button type="button" size="icon" variant="ghost" className="size-8 rounded-r-none" onClick={() => changeSelectedFontSize(-1)} title="Decrease font size"><Minus className="size-3.5" /></Button>
            <span className="w-9 text-center text-sm font-semibold tabular-nums text-foreground">{selectedFontSize}</span>
            <Button type="button" size="icon" variant="ghost" className="size-8 rounded-l-none" onClick={() => changeSelectedFontSize(1)} title="Increase font size"><Plus className="size-3.5" /></Button>
          </div>
          <label className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-muted" title="Text color"><span className="text-lg font-bold leading-none" style={{ color: selectedFontColor }}>A</span><span className="absolute bottom-1 h-0.5 w-5 rounded" style={{ backgroundColor: selectedFontColor }} /><input type="color" value={selectedFontColor.startsWith("#") ? selectedFontColor : "#172033"} onChange={(event) => updateSelectedStyle({ fill: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Text color" /></label>
          <Button type="button" size="icon" variant={selectedFontWeight === "700" ? "secondary" : "ghost"} className="size-9 shrink-0" onClick={() => updateSelectedStyle({ fontWeight: selectedFontWeight === "700" ? "400" : "700" })} title="Bold"><Bold className="size-4" /></Button>
          <Button type="button" size="icon" variant={selectedItalic ? "secondary" : "ghost"} className="size-9 shrink-0" onClick={() => updateSelectedStyle({ fontStyle: selectedItalic ? "normal" : "italic" })} title="Italic"><Italic className="size-4" /></Button>
          <Button type="button" size="icon" variant={selectedUnderline ? "secondary" : "ghost"} className="size-9 shrink-0" onClick={() => updateSelectedStyle({ underline: !selectedUnderline })} title="Underline"><Underline className="size-4" /></Button>
          <Button type="button" size="icon" variant={selectedLinethrough ? "secondary" : "ghost"} className="size-9 shrink-0" onClick={() => updateSelectedStyle({ linethrough: !selectedLinethrough })} title="Strikethrough"><Strikethrough className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0" onClick={cycleSelectedTextAlignment} title={`Text alignment: ${selectedTextAlign}`}>{selectedTextAlign === "center" ? <AlignCenter className="size-4" /> : selectedTextAlign === "right" ? <AlignRight className="size-4" /> : <AlignLeft className="size-4" />}</Button>
        </> : selectedIsQr ? <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[13px] font-semibold text-primary">Trust QR</span>
          <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted">
            <span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: selectedTrustQr.moduleColor }} />
            Dots
            <input type="color" value={selectedTrustQr.moduleColor} onChange={(event) => void updateTrustQrStyle({ moduleColor: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Dot color" />
          </label>
          <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted">
            <span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: selectedTrustQr.backgroundColor }} />
            Fill
            <input type="color" value={selectedTrustQr.backgroundColor} onChange={(event) => void updateTrustQrStyle({ backgroundColor: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Background color" />
          </label>
          <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted">
            <span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: selectedTrustQr.centerColor }} />
            Seal
            <input type="color" value={selectedTrustQr.centerColor} onChange={(event) => void updateTrustQrStyle({ centerColor: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Seal color" />
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="sm" variant="outline" className="h-9 gap-2 px-2.5 text-xs font-semibold">
                  <span className="size-4 rounded-sm border-2 bg-white" style={{ borderColor: selectedTrustQr.borderColor }} />
                  Border
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64 border border-border bg-card p-3 shadow-lg">
              <p className="mb-2 text-[13px] font-semibold text-foreground">QR frame</p>
              <label className="relative mb-3 flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted">
                <span className="size-5 rounded-full border-4 bg-white" style={{ borderColor: selectedTrustQr.borderColor }} />
                Border color
                <input type="color" value={selectedTrustQr.borderColor} onChange={(event) => void updateTrustQrStyle({ borderColor: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Border color" />
              </label>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Thickness</p>
              <div className="mb-3 grid grid-cols-4 gap-1.5">
                {([
                  { label: "Off", value: 0 },
                  { label: "Thin", value: 1.5 },
                  { label: "Medium", value: 3 },
                  { label: "Thick", value: 5 },
                ] as const).map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => void updateTrustQrStyle({ borderWidth: option.value })}
                    className={cn(
                      "rounded-lg border px-1 py-2 text-[13px] font-semibold transition-colors",
                      selectedTrustQr.borderWidth === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Corners</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { label: "Square", value: 0, radius: "rounded-none" },
                  { label: "Soft", value: 10, radius: "rounded-md" },
                  { label: "Round", value: 22, radius: "rounded-2xl" },
                ] as const).map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => void updateTrustQrStyle({ cornerRadius: option.value })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors",
                      Math.abs(selectedTrustQr.cornerRadius - option.value) < 3
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    <span className={cn("size-7 border-2 border-current", option.radius)} />
                    {option.label}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border p-0.5">
            {([
              { id: "seal" as const, label: "ST seal" },
              { id: "sun" as const, label: "Sun" },
              { id: "none" as const, label: "None" },
            ]).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => void updateTrustQrStyle({ center: option.id })}
                className={cn(
                  "h-8 rounded-md px-2.5 text-[13px] font-semibold transition-colors",
                  selectedTrustQr.center === option.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={option.id === "seal" ? "SanTrack Trust seal in the center" : option.id === "sun" ? "Rwanda sun only" : "No center mark"}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 text-xs font-semibold"
            title="Restore SanTrack brand look"
            onClick={() => void updateTrustQrStyle({ ...DEFAULT_TRUST_QR_STYLE })}
          >
            <Palette className="size-3.5 text-primary" /> Brand
          </Button>
        </div> : selectedObject ? <span className="shrink-0 rounded-lg bg-muted px-3 py-2 text-xs font-semibold capitalize text-foreground">{selectedMeta?.kind}</span> : pageSelected ? <div className="flex shrink-0 items-center gap-1"><span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Page {pageIndex + 1}</span><Button type="button" size="sm" variant="ghost" className="h-9 text-xs font-semibold" onClick={() => setActiveTool("templates")}>Edit page</Button>{onUploadArtwork ? <Button type="button" size="sm" variant="ghost" className="h-9 text-xs font-semibold" onClick={onUploadArtwork} disabled={backgroundLocked} title={backgroundLocked ? "Unlock the background to replace it" : "Replace page background"}>Replace background</Button> : null}<span className="mx-1 h-5 w-px bg-border" /><Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs font-semibold" onClick={fitCanvas}><Maximize2 className="size-4" /> Position</Button></div> : <span className="shrink-0 px-1 text-xs text-muted-foreground">Select the page or an element to edit it</span>}

        {pageSelected && !selectedObject ? <label className={cn("relative flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted", backgroundLocked && "cursor-not-allowed opacity-45")} title={backgroundLocked ? "Unlock the background to change its color" : "Page background color"}><span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: pageBackgroundColor }} /><span>Background</span><input type="color" value={colorInputValue(pageBackgroundColor, DEFAULT_PAGE_BACKGROUND)} onChange={(event) => updatePageBackground(event.target.value)} disabled={backgroundLocked} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed" aria-label="Page background color" /></label> : null}

        {selectedMeta?.kind === "shape" ? <div className="flex shrink-0 items-center gap-1 border-l border-border pl-1.5">
          <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted"><span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: selectedFillColor }} /><span>Fill</span><input type="color" value={selectedFillColor} onChange={(event) => updateSelectedStyle({ fill: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Shape fill color" /></label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="sm" variant="outline" className="h-9 gap-2 px-2.5 text-xs font-semibold">
                  <span className="size-4 rounded-sm border-2 bg-white" style={{ borderColor: selectedStrokeColor }} />
                  Border
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64 border border-border bg-card p-3 shadow-lg">
              <p className="mb-2 text-[13px] font-semibold text-foreground">Shape border</p>
              <label className="relative mb-3 flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted">
                <span className="size-5 rounded-full border-4 bg-white" style={{ borderColor: selectedStrokeColor }} />
                Border color
                <input type="color" value={selectedStrokeColor} onChange={(event) => updateSelectedStyle({ stroke: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Shape border color" />
              </label>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Thickness</p>
              <div className={cn("mb-3 grid gap-1.5", selectedIsRectShape ? "grid-cols-4" : "grid-cols-4")}>
                {([
                  { label: "Off", value: 0 },
                  { label: "Thin", value: 1 },
                  { label: "Medium", value: 2 },
                  { label: "Thick", value: 4 },
                ] as const).map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => updateSelectedStyle({ strokeWidth: option.value })}
                    className={cn(
                      "rounded-lg border px-1 py-2 text-[13px] font-semibold transition-colors",
                      Math.abs(selectedStrokeWidth - option.value) < 0.3
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedIsRectShape ? (
                <>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Corners</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { label: "Square", value: 0, radius: "rounded-none" },
                      { label: "Soft", value: 6, radius: "rounded-md" },
                      { label: "Round", value: 16, radius: "rounded-2xl" },
                    ] as const).map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => updateSelectedStyle({ rx: option.value, ry: option.value })}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors",
                          Math.abs(selectedCornerRadius - option.value) < 2
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground hover:border-primary/40",
                        )}
                      >
                        <span className={cn("size-7 border-2 border-current", option.radius)} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div> : selectedMeta?.kind === "line" ? <label className="relative flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted" title="Line color"><span className="h-1 w-6 rounded-full" style={{ backgroundColor: selectedStrokeColor }} /><span>Line color</span><input type="color" value={selectedStrokeColor} onChange={(event) => updateSelectedStyle({ stroke: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Line color" /></label> : null}

        {selectedMeta && (selectedMeta.kind === "dynamicText" || selectedMeta.kind === "barcode") ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="sm" variant="outline" className="h-9 max-w-52 gap-2 px-2.5 text-xs font-semibold">
                  <span className="truncate text-muted-foreground">Shows</span>
                  <span className="truncate">
                    {LABEL_BIND_FIELDS.find((f) => f.name === selectedMeta.schemaName)?.label
                      ?? selectedMeta.schemaName}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64 border border-border bg-card shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="text-[13px] font-semibold text-foreground">What prints here</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                  Pick which product data fills this text or barcode when you print.
                </p>
              </div>
              {bindFieldsForKind(selectedMeta.kind).map((field) => (
                <DropdownMenuItem
                  key={field.name}
                  onClick={() => updateBinding(field.name)}
                  className={cn(
                    "cursor-pointer text-xs",
                    selectedMeta.schemaName === field.name && "bg-primary/10 font-semibold text-primary",
                  )}
                >
                  {field.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : selectedIsQr ? (
          <span className="hidden h-9 items-center rounded-lg bg-muted/60 px-2.5 text-[13px] font-medium text-muted-foreground lg:inline-flex" title="This QR always encodes the unit verify link">
            Encodes verify link
          </span>
        ) : null}

        {selectedObject ? <div className="flex shrink-0 items-center gap-1 border-l border-border pl-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs font-semibold">
                  <Maximize2 className="size-3.5" /> Size
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-56 border border-border bg-card p-3 shadow-lg">
              <p className="mb-2 text-[13px] font-semibold text-foreground">Position &amp; size</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["Left", "x", selectedX],
                  ["Top", "y", selectedY],
                  ["Width", "width", selectedWidth],
                  ["Height", "height", selectedHeight],
                ] as const).map(([label, metric, value]) => (
                  <label key={metric} className="space-y-1 text-[10px] font-medium text-muted-foreground">
                    {label} <span className="text-faint">(mm)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(event) => updateMetric(metric, event.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-2 block space-y-1 text-[10px] font-medium text-muted-foreground">
                Rotate (°)
                <Input
                  type="number"
                  step="1"
                  value={selectedRotation}
                  onChange={(event) => updateMetric("rotation", event.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </label>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={() => alignSelected("horizontal")} title="Center horizontally"><AlignCenter className="size-4" /> Center</Button>
          <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={groupSelected} disabled={!canGroupSelection} title="Group (Ctrl/Cmd+G)"><Group className="size-4" /> Group</Button>
          <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={ungroupSelected} disabled={!canUngroupSelection} title="Ungroup (Ctrl/Cmd+Shift+G)"><Ungroup className="size-4" /> Ungroup</Button>
          <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={() => reorderSelected("front")} title="Bring to front (Ctrl/Cmd+])"><BringToFront className="size-4" /> Front</Button>
          <Button type="button" size="sm" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={() => reorderSelected("back")} title="Send to back (Ctrl/Cmd+[)"><MoveDown className="size-4" /> Back</Button>
          <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => void duplicateSelected()} title="Duplicate (Ctrl/Cmd+D)"><Copy className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="size-9 text-danger hover:text-danger" onClick={deleteSelected} title="Delete (Del)"><Trash2 className="size-4" /></Button>
        </div> : null}

        <div className="ml-auto flex shrink-0 items-center gap-1 border-l border-border pl-1.5">
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)"><Undo2 className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)"><Redo2 className="size-4" /></Button>
          <Button type="button" size="icon" variant={showGrid ? "secondary" : "ghost"} className="size-8" onClick={() => setShowGrid((value) => !value)} title="Toggle alignment grid"><Move className="size-4" /></Button>
        </div>
      </div>

      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1.5 lg:hidden" aria-label="Design tools">
        {toolItems.map((item) => <button key={item.id} type="button" onClick={() => { setActiveTool((current) => current === item.id ? null : item.id); if (item.id === "elements") setElementCategory(null); setPanelQuery(""); }} className={cn("flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium text-muted-foreground", activeTool === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted hover:text-foreground")}><span className="relative">{item.icon}{item.premium ? <Crown className="absolute -right-1.5 -top-1.5 size-2.5 fill-warning text-warning" /> : null}</span>{item.label}</button>)}
      </nav>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="hidden shrink-0 border-r border-border bg-card lg:order-1 lg:flex">
          <nav className="flex w-[86px] shrink-0 flex-col overflow-y-auto py-2" aria-label="Design tools">
            {toolItems.map((item, index) => <div key={item.id} className={cn(index === toolItems.length - 1 && "mt-2 border-t border-border pt-2")}><button type="button" onClick={() => { setActiveTool((current) => current === item.id ? null : item.id); if (item.id === "elements") setElementCategory(null); setPanelQuery(""); }} className="group relative flex w-full flex-col items-center gap-1 px-1 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"><span className={cn("relative flex size-9 items-center justify-center rounded-lg transition-colors", activeTool === item.id ? "bg-primary text-primary-foreground shadow-sm" : "group-hover:bg-muted")}>{item.icon}{item.premium ? <Crown className="absolute -right-1 -top-1 size-3 fill-warning text-warning" /> : null}</span><span className={cn("leading-4", activeTool === item.id && "font-semibold text-foreground")}>{item.label}</span></button></div>)}
          </nav>
          {activeTool && activeTool !== "tools" ? <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-muted/20"><div className="flex h-12 items-center justify-between border-b border-border px-3"><div className="flex items-center gap-1">{activeTool === "elements" && elementCategory ? <Button type="button" size="icon" variant="ghost" className="size-7 text-foreground" onClick={() => { setElementCategory(null); setPanelQuery(""); }} title="Back to categories"><ChevronLeft className="size-4" /></Button> : null}<p className="text-sm font-semibold text-foreground">{toolTitle}</p></div><Button type="button" size="icon" variant="ghost" className="size-7 text-muted-foreground" onClick={() => setActiveTool(null)} title="Close panel"><X className="size-4" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-3">{toolPanelContent}</div></aside> : null}
        </div>

        <main className="order-1 flex min-h-[420px] min-w-0 flex-1 flex-col bg-muted/40 sm:min-h-[520px] lg:order-2">
          {activeTool && activeTool !== "tools" ? <aside className="absolute inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100%-3rem))] flex-col border-r border-border bg-card shadow-2xl lg:hidden"><div className="flex h-12 items-center justify-between border-b border-border px-3"><div className="flex items-center gap-1">{activeTool === "elements" && elementCategory ? <Button type="button" size="icon" variant="ghost" className="size-7 text-foreground" onClick={() => { setElementCategory(null); setPanelQuery(""); }} title="Back to categories"><ChevronLeft className="size-4" /></Button> : null}<p className="text-sm font-semibold text-foreground">{toolTitle}</p></div><Button type="button" size="icon" variant="ghost" className="size-7 text-muted-foreground" onClick={() => setActiveTool(null)} title="Close panel"><X className="size-4" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-3">{toolPanelContent}</div></aside> : null}
          <div ref={canvasViewportRef} {...viewportInteractionProps} data-label-viewport data-zoom={zoom} data-pan-x={viewportState.panX} data-pan-y={viewportState.panY} className={cn("relative min-h-0 flex-1 overflow-auto overscroll-contain", isPanning ? "cursor-grabbing select-none" : spacePressed ? "cursor-grab" : "cursor-default", showGrid ? "bg-[radial-gradient(#b7c8d9_0.8px,transparent_0.8px)] [background-size:18px_18px]" : "bg-muted/30")}>
            {activeTool === "tools" ? <div className="sticky left-4 top-4 z-40 h-0 w-fit">
              <div className="flex flex-col items-center gap-2">
                <Button type="button" size="icon" variant="outline" className="size-10 rounded-full bg-card shadow-lg" onClick={() => setActiveTool(null)} title="Close tools"><X className="size-5" /></Button>
                <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2 shadow-xl">
                  <Button type="button" size="icon" variant="secondary" className="size-10 rounded-xl text-primary" onClick={() => { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); setPageSelected(false); refreshSelection(); }} title="Select"><MousePointer2 className="size-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl text-danger" onClick={() => addLine(-8, "#f43f5e", 2.5)} title="Add highlight stroke"><Highlighter className="size-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl" onClick={() => addShape("rectangle")} title="Add shape"><Shapes className="size-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl text-primary" onClick={() => addLine(0)} title="Add line"><Minus className="size-6 -rotate-45" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl text-warning" onClick={() => addShape("rectangle", { color: "#fef3c7", borderColor: "#f59e0b" })} title="Add note"><StickyNote className="size-5 fill-current" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl text-primary" onClick={addText} title="Add text"><Type className="size-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl" onClick={() => addVectorShape("signature", '<path fill="none" stroke="#172033" stroke-width="5" stroke-linecap="round" d="M8 70 C20 18 28 18 32 67 C36 86 43 38 49 53 C55 70 63 43 69 57 C75 68 82 51 94 52"/>', 34, 12)} title="Add signature line"><PenLine className="size-5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl text-primary" onClick={() => addVectorShape("table", '<path fill="none" stroke="#172033" stroke-width="4" d="M4 4 H96 V96 H4 Z M4 35 H96 M4 66 H96 M35 4 V96 M66 4 V96"/>', 28, 20)} title="Add table"><Table2 className="size-5" /></Button>
                  {onShowDataFields ? <><span className="my-0.5 h-px w-7 bg-border" /><Button type="button" size="icon" variant="ghost" className="size-10 rounded-xl" onClick={onShowDataFields} title="Data fields"><ListFilter className="size-5" /></Button></> : null}
                </div>
              </div>
            </div> : null}
            <div className="grid h-max min-h-full w-max min-w-full place-items-center p-8 pb-12 pt-16 md:p-10 md:pb-14 md:pt-20">
              <div className="flex flex-col items-center gap-4">
                <div data-label-artboard data-logical-width={baseWidth} data-logical-height={baseHeight} data-render-width={Math.round(baseWidth * zoom)} data-render-height={Math.round(baseHeight * zoom)} data-scene-coordinates={sceneCoordinateSignature} data-object-count={objectCount} aria-label={`Label page ${pageIndex + 1} of ${pageCount}`} onContextMenu={openPageContextMenu} className={cn("relative shrink-0 overflow-visible bg-white shadow-[0_18px_45px_rgba(23,32,51,0.16)] transition-[width,height] duration-200", pageSelected ? "ring-2 ring-primary" : "ring-1 ring-border")} style={{ width: Math.round(baseWidth * zoom), height: Math.round(baseHeight * zoom) }}>
                  {/* Keep overlays as siblings of a stable Fabric host — never of the <canvas>.
                      Fabric wraps the canvas in .canvas-container; React insertBefore crashes if it
                      tries to reconcile against the moved canvas node. */}
                  <div
                    className={cn(
                      "pointer-events-none absolute -top-11 right-0 z-30 flex items-center gap-1 rounded-full border border-white/20 bg-foreground p-1 text-white shadow-[0_10px_28px_rgba(23,32,51,0.4)] ring-2 ring-white/90",
                      !pageSelected && "invisible",
                    )}
                  >
                    <Button type="button" size="icon" variant="ghost" className="pointer-events-auto size-7 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => setBackgroundLocked((value) => !value)} title={backgroundLocked ? "Unlock page background" : "Lock page background"}>{backgroundLocked ? <UnlockKeyhole className="size-3.5" /> : <LockKeyhole className="size-3.5" />}</Button>
                    <Button type="button" size="icon" variant="ghost" className="pointer-events-auto size-7 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={duplicatePage} title="Duplicate page"><CopyPlus className="size-3.5" /></Button>
                    <Button type="button" size="icon" variant="ghost" className="pointer-events-auto size-7 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={addPage} title="Add page"><Plus className="size-3.5" /></Button>
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    {artwork ? (
                      <img
                        src={artwork}
                        alt="Page background artwork"
                        className="h-full w-full object-fill [image-rendering:auto]"
                      />
                    ) : null}
                  </div>
                  <div data-label-fabric-host className="absolute inset-0 z-10 overflow-hidden [&_[data-fabric=wrapper]]:h-full [&_[data-fabric=wrapper]]:w-full">
                    <canvas ref={canvasElementRef} data-label-fabric-canvas className={cn("block", artwork && "bg-transparent")} />
                  </div>
                  <div
                    ref={selectionToolbarRef}
                    data-selection-toolbar
                    className={cn(
                      "absolute z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/20 bg-foreground p-1 text-white shadow-[0_12px_40px_rgba(23,32,51,0.45)] ring-2 ring-white/90",
                      !showSelectionToolbar && "invisible pointer-events-none",
                    )}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => rotateSelectedBy(-15)} title="Rotate left 15°">
                      <RefreshCw className="size-4 -scale-x-100" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => rotateSelectedBy(15)} title="Rotate right 15°">
                      <RefreshCw className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={toggleSelectedLock} title={selectedLocked ? "Unlock element" : "Lock element"}>
                      {selectedLocked ? <UnlockKeyhole className="size-4" /> : <LockKeyhole className="size-4" />}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => void duplicateSelected()} title="Duplicate (Ctrl/Cmd+D)">
                      <Copy className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white disabled:opacity-40" onClick={groupSelected} disabled={!canGroupSelection} title="Group (Ctrl/Cmd+G)">
                      <Group className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white disabled:opacity-40" onClick={ungroupSelected} disabled={!canUngroupSelection} title="Ungroup (Ctrl/Cmd+Shift+G)">
                      <Ungroup className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => reorderSelected("front")} title="Bring to front">
                      <BringToFront className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => reorderSelected("back")} title="Send to back">
                      <MoveDown className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-white hover:bg-white/15 hover:text-white" onClick={() => alignSelected("horizontal")} title="Center horizontally">
                      <AlignCenter className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 rounded-full text-red-300 hover:bg-white/15 hover:text-red-200" onClick={deleteSelected} title="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className={cn("pointer-events-none absolute inset-0 z-20", pageSelected ? "border-2 border-primary" : "border border-dashed border-primary/20")} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm" onClick={addPage}>
                    <Plus className="size-4" /> Add page
                  </Button>
                  {pageCount > 1 ? (
                    <span className="text-[13px] font-medium text-muted-foreground">Page {pageIndex + 1} of {pageCount}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="flex min-h-12 shrink-0 items-center gap-3 overflow-x-auto border-t border-border bg-card px-2 sm:px-3">
            <div className="hidden items-center gap-2 text-[13px] text-muted-foreground xl:flex"><Move className="size-3.5" /> Smart guides · Shift+resize locks ratio · Ctrl/Cmd+G group · Arrows nudge · Space pan</div>
            <div className="ml-auto flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => switchPage(pageIndex - 1)} disabled={pageIndex === 0} title="Previous page"><ChevronLeft className="size-3.5" /></Button>
              <span className="min-w-16 text-center text-[13px] font-semibold tabular-nums text-foreground">Page {pageIndex + 1} / {pageCount}</span>
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => switchPage(pageIndex + 1)} disabled={pageIndex >= pageCount - 1} title="Next page"><ChevronRight className="size-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={addPage} title="Add page"><Plus className="size-3.5" /></Button>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 border-l border-border pl-2"><Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => zoomBy(-LABEL_ZOOM_STEP)} title="Zoom out"><ZoomOut className="size-3.5" /></Button><input aria-label="Page zoom" type="range" min="25" max="500" step="5" value={Math.round(zoom * 100)} onChange={(event) => setZoom(Number(event.target.value) / 100)} className="h-1.5 w-20 cursor-pointer accent-primary sm:w-32 md:w-40" /><Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => zoomBy(LABEL_ZOOM_STEP)} title="Zoom in"><ZoomIn className="size-3.5" /></Button><span className="w-11 text-right font-mono text-[10px] text-foreground">{Math.round(zoom * 100)}%</span><Button type="button" size="icon" variant="ghost" className="size-7" onClick={fitCanvas} title="Fit page"><Maximize2 className="size-3.5" /></Button><Button type="button" size="icon" variant="ghost" className="size-7" onClick={fitWidth} title="Fit width"><Square className="size-3.5 scale-x-125" /></Button></div>
          </div>
        </main>

        {pageContextMenu ? <div data-page-context-menu role="menu" aria-label={`Page ${pageIndex + 1} actions`} onContextMenu={(event) => event.preventDefault()} className="fixed z-[100] w-72 rounded-2xl border border-border bg-card p-2 shadow-[0_20px_60px_rgba(15,23,42,0.24)]" style={{ left: pageContextMenu.x, top: pageContextMenu.y }}>
          <div className="flex items-center justify-between px-2.5 pb-1 pt-1"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Page {pageIndex + 1} of {pageCount}</span><span className="font-mono text-[9px] text-muted-foreground">{pageSize.width} × {pageSize.height} mm</span></div>
          <PageMenuItem icon={<Clipboard className="size-4" />} label="Copy page" shortcut="Ctrl+C" onClick={copyPage} />
          <PageMenuItem icon={<ClipboardPaste className="size-4" />} label="Paste page contents" shortcut="Ctrl+V" disabled={!pageClipboardAvailable} onClick={pastePage} />
          <div className="my-1 border-t border-border" />
          <PageMenuItem icon={<Plus className="size-4" />} label="Add page" shortcut="Ctrl+Enter" onClick={addPage} />
          <PageMenuItem icon={<Maximize2 className="size-4" />} label="Resize page" onClick={() => { setPageContextMenu(null); setActiveTool("templates"); }} />
          <PageMenuItem icon={<CopyPlus className="size-4" />} label="Duplicate page" shortcut="Ctrl+D" onClick={duplicatePage} />
          {pageCount > 1 ? <PageMenuItem icon={<Trash2 className="size-4" />} label="Delete page" onClick={deletePage} /> : null}
          <label className={cn("relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-muted", backgroundLocked && "cursor-not-allowed opacity-40")}><span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"><Palette className="size-4" /></span><span className="flex-1">Background color</span><span className="size-5 rounded-full border border-border shadow-inner" style={{ backgroundColor: pageBackgroundColor }} /><input type="color" value={colorInputValue(pageBackgroundColor, DEFAULT_PAGE_BACKGROUND)} onChange={(event) => updatePageBackground(event.target.value)} disabled={backgroundLocked} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed" aria-label="Page background color" /></label>
          <PageMenuItem icon={<Trash2 className="size-4" />} label="Delete background" shortcut="Delete" disabled={!artwork || backgroundLocked} onClick={deleteBackground} />
          <div className="my-1 border-t border-border" />
          <PageMenuItem icon={backgroundLocked ? <UnlockKeyhole className="size-4" /> : <LockKeyhole className="size-4" />} label={backgroundLocked ? "Unlock background" : "Lock background"} checked={backgroundLocked} onClick={() => { setBackgroundLocked((value) => !value); setPageContextMenu(null); }} />
          <PageMenuItem icon={<Grid3X3 className="size-4" />} label="Guides" checked={showGrid} onClick={() => { setShowGrid((value) => !value); setPageContextMenu(null); }} />
        </div> : null}

        {/* Inspector retired: selected-element controls now live in the contextual top toolbar.
        <aside className={cn("order-3 w-full shrink-0 overflow-auto border-t border-border bg-card lg:w-[296px] lg:border-l lg:border-t-0", !selectedObject?.labelMeta && "hidden")}>
          <div className="border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><RotateCw className="size-4 text-primary" /> Inspector</div><p className="mt-1 text-[13px] leading-4 text-muted-foreground">Fine-tune the selected element or use the canvas handles.</p></div>
          {selectedObject?.labelMeta ? <div className="space-y-4 p-4">
            <div><div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor="fabric-binding" className="text-[13px] font-semibold text-muted-foreground">Binding key</label><span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary">{selectedObject.labelMeta.kind === "dynamicText" ? "Data field" : selectedObject.labelMeta.kind}</span></div><Input id="fabric-binding" value={selectedObject.labelMeta.schemaName} onChange={(event) => updateBinding(event.target.value)} onBlur={() => { if (selectedObject.labelMeta?.kind === "qrcode" || selectedObject.labelMeta?.kind === "barcode") setCanvasVersion((version) => version + 1); }} className="h-9 font-mono text-xs" spellCheck={false} /><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">Use <code className="rounded bg-muted px-1">serial</code>, <code className="rounded bg-muted px-1">qr</code>, or <code className="rounded bg-muted px-1">productName</code>.</p>{selectedObject.labelMeta.kind === "dynamicText" || selectedObject.labelMeta.kind === "qrcode" || selectedObject.labelMeta.kind === "barcode" ? <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2.5"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Live data preview</p><p className="mt-1 break-words text-[13px] leading-4 text-foreground">{selectedPreviewValue}</p></div> : null}</div>
            <div className="border-t border-border pt-4"><p className="mb-2 text-[13px] font-semibold text-foreground">Position &amp; size <span className="font-normal text-muted-foreground">(mm)</span></p><div className="grid grid-cols-2 gap-2">{([["X", "x", selectedX], ["Y", "y", selectedY], ["W", "width", Number(selectedWidth.toFixed(1))], ["H", "height", Number(selectedHeight.toFixed(1))]] as const).map(([label, metric, value]) => <label key={metric} className="space-y-1 text-[10px] font-medium text-muted-foreground">{label}<Input type="number" step="0.1" value={value} onChange={(event) => updateMetric(metric, event.target.value)} className="h-8 bg-muted/20 font-mono text-xs" /></label>)}</div><label className="mt-2 block space-y-1 text-[10px] font-medium text-muted-foreground">Rotation (°)<Input type="number" step="1" value={selectedRotation} onChange={(event) => updateMetric("rotation", event.target.value)} className="h-8 bg-muted/20 font-mono text-xs" /></label></div>
            <div className="border-t border-border pt-4"><p className="mb-2 text-[13px] font-semibold text-foreground">Align on label</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => alignSelected("horizontal")}><AlignCenter className="size-3.5" /> Horizontal</Button><Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => alignSelected("vertical")}><AlignCenter className="size-3.5 rotate-90" /> Vertical</Button></div></div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4"><Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={() => reorderSelected("back")}>Send back</Button><Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={() => reorderSelected("front")}>Bring front</Button><Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px] text-danger hover:text-danger" onClick={deleteSelected}>Delete</Button></div>
          </div> : <div className="space-y-4 p-4"><div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">Select a layer or click an element on the label to edit its binding, position, size, and rotation.</div><div className="rounded-lg bg-muted/40 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shortcuts</p><div className="mt-2 space-y-1.5 text-[13px] text-muted-foreground"><p><kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">Delete</kbd> remove selected</p><p><kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">Ctrl/Cmd+D</kbd> duplicate</p><p><kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">Arrow keys</kbd> nudge · Shift = 5px</p></div></div></div>}
          <div className="border-t border-border px-4 py-3 text-[10px] leading-4 text-muted-foreground"><span className="font-medium text-foreground">Live preview</span> uses the first pool record. Save the layout when you are ready to print.</div>
        </aside> */}
      </div>
    </div>
  );
  /*
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
        <span className="mr-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-500">Add</span>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={addText}>
          <Type className="size-3.5" /> Text
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => addCode("qrcode")}>
          <QrCode className="size-3.5" /> QR
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => addCode("barcode")}>
          <BarcodeIcon className="size-3.5" /> Barcode
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={addShape}>
          <Square className="size-3.5" /> Shape
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" onClick={duplicateSelected} disabled={!selectedObject}>
          <Copy className="size-3.5" /> Duplicate
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => reorderSelected("front")} disabled={!selectedObject}>
          <BringToFront className="size-3.5" /> Front
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => reorderSelected("back")} disabled={!selectedObject}>
          <MoveDown className="size-3.5" /> Back
        </Button>
        <Button type="button" size="sm" variant="ghost" className="ml-auto h-8 gap-1.5 text-red-600 hover:text-red-700" onClick={deleteSelected} disabled={!selectedObject}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative flex min-h-[360px] min-w-0 flex-1 items-start justify-center overflow-auto bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:16px_16px] p-6">
          <div
            className="relative shrink-0 overflow-hidden rounded-[3px] bg-white shadow-[0_16px_35px_rgba(15,23,42,0.14)] ring-1 ring-slate-300"
            style={{ width: pageSize.width * PX_PER_MM, height: pageSize.height * PX_PER_MM }}
          >
            {artwork ? <img src={artwork} alt="Packaging artwork" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill" /> : null}
            <canvas ref={canvasElementRef} className={cn("relative z-10 block", artwork && "bg-transparent")} />
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-slate-200 bg-white p-4 lg:w-64 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers className="size-4 text-sky-600" /> Inspector
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Drag, resize, and rotate elements directly on the sticker.</p>

          {selectedObject?.labelMeta ? (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="fabric-binding" className="text-xs font-medium text-slate-600">Binding key</label>
                <Input
                  key={selectionVersion}
                  id="fabric-binding"
                  value={selectedObject.labelMeta.schemaName}
                  onChange={(event) => updateBinding(event.target.value)}
                  className="mt-1.5 h-9 font-mono text-xs"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-[13px] leading-4 text-slate-500">Use keys such as <code>serial</code>, <code>qr</code>, or <code>productName</code>.</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2"><span>Element</span><span className="font-medium text-slate-900">{selectedObject.labelMeta.kind}</span></div>
                <div className="mt-2 flex items-center justify-between gap-2"><span>Canvas items</span><span className="font-medium text-slate-900">{objectCount}</span></div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">Select an element to edit its binding key and arrange its layer.</div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-[13px] leading-5 text-slate-500">
            <div className="flex items-center gap-1.5 font-medium text-slate-700"><Minus className="size-3.5" /> {pageSize.width} × {pageSize.height} mm</div>
            <p className="mt-1">The live preview uses real batch values. The canvas is the layout editor.</p>
          </div>
        </aside>
      </div>
    </div>
  );
  */
}
