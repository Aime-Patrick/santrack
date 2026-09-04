"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Barcode,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Factory,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Package,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Tag,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import type { Template } from "@pdfme/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarcodePreview } from "@/components/barcode/barcode-preview";
import { PdfmeDesignerHost } from "@/components/labels/pdfme-designer-host";
import {
  useExportPool,
  useExportPoolImages,
  useIdentityPool,
} from "@/hooks/identity-pools";
import { usePoolLabelRows } from "@/hooks/label-studio";
import {
  clearSavedTemplate,
  DEFAULT_PRINT_LIMIT,
  LABEL_BIND_FIELDS,
  LABEL_TEMPLATES,
  loadSavedTemplate,
  MAX_PRINT_LIMIT,
  saveTemplateToStorage,
  verifyUrlForPayload,
  type LabelRow,
  type LabelStudioMode,
  type LabelTemplateId,
} from "@/lib/label-studio";
import {
  downloadPdfBytes,
  generateLabelsPdf,
  getPdfmeTemplate,
  labelRowToPdfmeInput,
  openPdfBytes,
  rowsToPdfmeInputs,
} from "@/lib/pdfme-labels";
import { cn } from "@/lib/utils";

export function LabelStudioWorkspace({
  poolId,
  initialPreset,
}: {
  poolId: number;
  initialPreset: LabelTemplateId;
}) {
  const { data: pool, isLoading: poolLoading } = useIdentityPool(poolId);
  const { data: rows = [], isLoading: rowsLoading } = usePoolLabelRows(poolId);
  const exportPool = useExportPool();
  const exportPoolImages = useExportPoolImages();

  const [mode, setMode] = useState<LabelStudioMode>("preview");
  const [preset, setPreset] = useState<LabelTemplateId>(initialPreset);
  const [template, setTemplate] = useState<Template>(() =>
    getPdfmeTemplate(initialPreset),
  );
  const [hostVersion, setHostVersion] = useState(0);
  const [printLimit, setPrintLimit] = useState(DEFAULT_PRINT_LIMIT);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFieldHelp, setShowFieldHelp] = useState(false);

  const artworkFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const presetMeta = useMemo(
    () => LABEL_TEMPLATES.find((t) => t.id === preset) ?? LABEL_TEMPLATES[0],
    [preset],
  );

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://santrack.app";

  const loadPresetTemplate = useCallback(
    (nextPreset: LabelTemplateId) => {
      const saved = loadSavedTemplate(poolId, nextPreset);
      setTemplate(saved ?? getPdfmeTemplate(nextPreset));
      setPreset(nextPreset);
      setHostVersion((v) => v + 1);
      setDirty(false);
      setPreviewIndex(0);
    },
    [poolId],
  );

  useEffect(() => {
    loadPresetTemplate(initialPreset);
  }, [poolId, initialPreset, loadPresetTemplate]);

  // Set initial default print limit to pool size if smaller
  useEffect(() => {
    if (rows.length > 0 && rows.length < DEFAULT_PRINT_LIMIT) {
      setPrintLimit(rows.length);
    }
  }, [rows.length]);

  const handleTemplateChange = useCallback((next: Template) => {
    setTemplate(next);
    setDirty(true);
  }, []);

  const saveTemplate = useCallback(() => {
    saveTemplateToStorage(poolId, preset, template);
    setDirty(false);
    toast.success("Packaging template saved", {
      description: `Layout stored for "${presetMeta.name}" (${presetMeta.widthMm}×${presetMeta.heightMm} mm).`,
    });
  }, [poolId, preset, template, presetMeta]);

  const resetTemplate = useCallback(() => {
    clearSavedTemplate(poolId, preset);
    setTemplate(getPdfmeTemplate(preset));
    setHostVersion((v) => v + 1);
    setDirty(false);
    toast.message("Reset template", {
      description: `Restored standard layout for ${presetMeta.name}.`,
    });
  }, [poolId, preset, presetMeta]);

  const copyFieldBinding = useCallback((fieldName: string) => {
    void navigator.clipboard.writeText(fieldName);
    setCopiedField(fieldName);
    toast.success(`Copied "${fieldName}"`, {
      description: "Paste as Schema Name in element properties to bind this data field.",
    });
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  /** Programmatic quick-add element onto the canvas */
  const handleQuickAddElement = (
    name: string,
    type: string,
    width: number,
    height: number,
    extra: Record<string, any> = {},
  ) => {
    const next = JSON.parse(JSON.stringify(template)) as Template;
    if (!next.schemas || next.schemas.length === 0) {
      next.schemas = [[]];
    }
    const pageSchemas = next.schemas[0] ?? [];
    const count = pageSchemas.filter((s) => s.name.startsWith(name)).length;
    const finalName = count > 0 ? `${name}_${count + 1}` : name;

    const newSchema = {
      name: finalName,
      type,
      position: {
        x: 5 + (pageSchemas.length * 3) % 25,
        y: 5 + (pageSchemas.length * 3) % 20,
      },
      width,
      height,
      ...extra,
    };

    next.schemas[0] = [...pageSchemas, newSchema];
    handleTemplateChange(next);
    toast.success(`Added ${name} to design`, {
      description: "Drag to position or resize on the canvas.",
    });
  };

  /** Upload background artwork (PNG, JPG, or PDF) to overlay dynamic QR/Serial codes */
  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setTemplate((prev) => ({
        ...prev,
        basePdf: result,
      }));
      setHostVersion((v) => v + 1);
      setDirty(true);
      toast.success("Packaging artwork loaded", {
        description: `Loaded "${file.name}". You can now drag QR and serial fields over your artwork.`,
      });
    };
    reader.readAsDataURL(file);
  };

  /** Upload company logo or certification image onto the canvas */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleQuickAddElement("logo", "image", 20, 20, {
        content: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const previewRows = useMemo(() => (rows.length > 0 ? rows : []), [rows]);

  const currentRow: LabelRow = useMemo(() => {
    if (previewRows.length > 0 && previewRows[previewIndex]) {
      return previewRows[previewIndex];
    }
    return {
      serial: "ST-SAMPLE-000001",
      qrPayload: "00000000-0000-0000-0000-000000000001",
      status: "GENERATED",
      productName: pool?.productName ?? "Inyange Mineral Water 500ml",
      sku: pool?.productSku ?? "SKU-500ML",
      batchCode: "LOT-01",
      createdAt: new Date().toISOString(),
    };
  }, [previewRows, previewIndex, pool?.productName, pool?.productSku]);

  // Keyboard navigation for preview
  useEffect(() => {
    if (mode !== "preview") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPreviewIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPreviewIndex((i) => Math.min(previewRows.length - 1, i + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, previewRows.length]);

  const effectivePrintLimit = useMemo(() => {
    return Math.min(printLimit, rows.length || DEFAULT_PRINT_LIMIT);
  }, [printLimit, rows.length]);

  const generateBatchPdf = useCallback(async () => {
    const batch = rows.slice(0, effectivePrintLimit);
    if (batch.length === 0) {
      toast.error("No codes available in this pool to print");
      return null;
    }
    setBusy(true);
    try {
      return await generateLabelsPdf(preset, batch, origin, template);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate PDF");
      return null;
    } finally {
      setBusy(false);
    }
  }, [rows, effectivePrintLimit, preset, origin, template]);

  const handleDownload = async () => {
    const pdf = await generateBatchPdf();
    if (pdf) {
      const count = Math.min(rows.length, effectivePrintLimit);
      downloadPdfBytes(
        pdf,
        `pool-${poolId}-${preset}-${count}-labels.pdf`,
      );
      toast.success(`Downloaded ${count} printable labels`, {
        description: `Format: ${presetMeta.name} (${presetMeta.widthMm}×${presetMeta.heightMm} mm) · 1 per page.`,
      });
    }
  };

  const handlePreviewPdf = async () => {
    const pdf = await generateBatchPdf();
    if (pdf) {
      openPdfBytes(pdf);
    }
  };

  const handleExportCsv = async () => {
    await exportPool.mutateAsync({
      id: poolId,
      filename: `pool-${poolId}-${pool?.productSku ?? "codes"}.csv`,
    });
  };

  const handleExportZip = async () => {
    try {
      await exportPoolImages.mutateAsync({
        id: poolId,
        filename: `pool-${poolId}-qr-codes.zip`,
      });
    } catch {
      // handled by mutation
    }
  };

  // Filtered rows for Data table tab
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.serial.toLowerCase().includes(q) ||
        r.qrPayload.toLowerCase().includes(q) ||
        r.batchCode.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  const hostKey = `${poolId}-${preset}-v${hostVersion}`;

  // Quantity presets
  const quantityOptions = useMemo(() => {
    const total = rows.length || 10;
    const base = [10, 25, 50, 100, 250, 500].filter((n) => n <= total);
    if (!base.includes(total) && total > 0) {
      base.push(total);
    }
    return base.sort((a, b) => a - b);
  }, [rows.length]);

  if (poolLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground">
          Loading Packaging Studio…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-1 flex-col overflow-hidden bg-[#fafbfc]">
      {/* Hidden file inputs */}
      <input
        ref={artworkFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={handleArtworkUpload}
      />
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* ── TOP HEADER (CLEAN & SPACIOUS) ── */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-border/80 bg-white px-4 md:px-6 shadow-2xs">
        {/* Left: Product & Pool Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            nativeButton={false}
            render={
              <Link
                href={
                  pool?.productId
                    ? `/dashboard/products/${pool.productId}?tab=identities`
                    : "/dashboard/products"
                }
              />
            }
          >
            <ArrowLeft className="size-3.5" />
            <span className="truncate max-w-[160px] font-semibold text-foreground">
              {pool?.productName ?? "Products"}
            </span>
          </Button>

          <span className="text-border">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Label Studio</span>
            <Badge
              variant="outline"
              className="bg-muted/40 font-mono text-[10px] text-muted-foreground"
            >
              Pool #{poolId}
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-300/80 font-mono text-[10px]"
            >
              {rows.length.toLocaleString()} codes
            </Badge>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "rounded-md px-3.5 py-1 text-xs font-medium transition-all",
              mode === "preview"
                ? "bg-white text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Live Proofing &amp; Print
          </button>
          <button
            type="button"
            onClick={() => setMode("design")}
            className={cn(
              "rounded-md px-3.5 py-1 text-xs font-medium transition-all",
              mode === "design"
                ? "bg-white text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Canvas Designer
          </button>
          <button
            type="button"
            onClick={() => setMode("data")}
            className={cn(
              "rounded-md px-3.5 py-1 text-xs font-medium transition-all",
              mode === "data"
                ? "bg-white text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Code Records ({rows.length})
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {mode === "design" && (
            <>
              {/* Preset Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                      <Tag className="size-3.5 text-primary" />
                      <span>{presetMeta.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({presetMeta.widthMm}×{presetMeta.heightMm}mm)</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-64 bg-white border border-border/80 shadow-md">
                  {LABEL_TEMPLATES.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => loadPresetTemplate(t.id)}
                      className={cn("cursor-pointer flex flex-col items-start gap-0.5 py-2", preset === t.id && "bg-primary-light")}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-foreground">{t.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{t.widthMm}×{t.heightMm}mm</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => artworkFileInputRef.current?.click()}
                title="Upload pre-designed packaging artwork (e.g. Inyange bottle sleeve PNG/PDF)"
              >
                <UploadCloud className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Upload Artwork</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setShowFieldHelp((v) => !v)}
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Field Keys</span>
              </Button>

              {dirty && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  onClick={saveTemplate}
                >
                  <Save className="size-3.5" /> Save Layout
                </Button>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border border-border/80 shadow-md">
              <DropdownMenuItem onClick={() => void handleExportCsv()} className="cursor-pointer gap-2 text-xs">
                <FileSpreadsheet className="size-4 text-emerald-600" /> Export Codes CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportZip()} className="cursor-pointer gap-2 text-xs">
                <FileArchive className="size-4 text-sky-600" /> Export QR ZIP Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetTemplate} className="cursor-pointer gap-2 text-xs text-muted-foreground">
                <RotateCcw className="size-4" /> Reset to Template Defaults
              </DropdownMenuItem>
              {pool?.productId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={<Link href="/dashboard/manufacturing/production" />}
                    nativeButton={false}
                    className="cursor-pointer gap-2 text-xs text-primary"
                  >
                    <Factory className="size-4" /> Assign to Production Order
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── WORKSPACE BODY ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── 1. PREVIEW & PRINT MODE ── */}
        {mode === "preview" ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Left/Center: Label Proofing Canvas */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-between p-4 md:p-6 overflow-y-auto">
              {/* Packaging Template Switcher */}
              <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-xl border border-border/80 bg-white p-1 shadow-2xs">
                {LABEL_TEMPLATES.map((t) => {
                  const active = preset === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => loadPresetTemplate(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        active
                          ? "bg-primary text-white shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {t.id === "unit" ? (
                        <QrCode className="size-3.5" />
                      ) : t.id === "bottle_wrap" ? (
                        <Package className="size-3.5" />
                      ) : t.id === "security_seal" ? (
                        <ShieldCheck className="size-3.5" />
                      ) : t.id === "carton" ? (
                        <Barcode className="size-3.5" />
                      ) : (
                        <Tag className="size-3.5" />
                      )}
                      <span>{t.name}</span>
                      <span
                        className={cn(
                          "font-mono text-[10px]",
                          active ? "text-white/80" : "text-muted-foreground/70",
                        )}
                      >
                        {t.widthMm}×{t.heightMm}mm
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Physical Label Realistic Proofing Box */}
              <div className="relative my-4 flex min-h-[340px] w-full max-w-4xl items-center justify-center rounded-2xl border border-dashed border-border/80 bg-[#f1f5f9]/60 p-6 overflow-x-auto">
                {/* Physical sticker representation */}
                <div
                  className={cn(
                    "relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-300/80 bg-white p-4 shadow-xl transition-all duration-200",
                    preset === "unit" && "w-[440px] h-[264px]",
                    preset === "bottle_wrap" && "w-[680px] h-[221px]",
                    preset === "security_seal" && "w-[240px] h-[240px]",
                    preset === "carton" && "w-[480px] h-[274px]",
                    preset === "shelf" && "w-[500px] h-[280px]",
                  )}
                >
                  {/* Dimension indicator badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                    {presetMeta.widthMm} × {presetMeta.heightMm} mm
                  </div>

                  {/* 1. UNIT STICKER (50×30 mm) */}
                  {preset === "unit" && (
                    <div className="flex h-full items-center gap-4">
                      <div className="flex shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white p-1 shadow-2xs">
                        <BarcodePreview
                          symbology="QR"
                          value={currentRow.qrPayload}
                          scale={3}
                          showText={false}
                          className="size-32"
                        />
                      </div>

                      <div className="flex h-full flex-1 flex-col justify-between py-1">
                        <div>
                          <p className="line-clamp-2 text-sm font-bold leading-tight text-slate-900">
                            {currentRow.productName || pool?.productName || "Inyange Mineral Water 500ml"}
                          </p>
                          <p className="mt-1 font-mono text-xs font-bold text-primary">
                            {currentRow.serial}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                            {currentRow.batchCode ? `Batch ${currentRow.batchCode}` : "Batch LOT-01"}{" "}
                            {currentRow.sku ? `· ${currentRow.sku}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <ShieldCheck className="size-3 text-emerald-600" />
                          <span>Scan to verify authenticity</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. FULL BOTTLE WRAP / PACKAGING SLEEVE (200×65 mm) */}
                  {preset === "bottle_wrap" && (
                    <div className="grid h-full grid-cols-12 gap-3 text-slate-800">
                      {/* Left: Product Info / Mineral Specs */}
                      <div className="col-span-3 flex flex-col justify-between rounded-lg border border-slate-200/80 bg-slate-100 p-2 text-[9px]">
                        <div>
                          <p className="font-bold uppercase tracking-wider text-slate-700">Mineral Analysis</p>
                          <div className="mt-1 space-y-0.5 font-mono text-[8px] text-slate-500">
                            <p>Ca2+: 12.4 mg/L</p>
                            <p>Mg2+: 4.8 mg/L</p>
                            <p>Na+: 3.5 mg/L</p>
                            <p>pH: 7.2 (Neutral)</p>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-400">RSB Certified #RS-102</p>
                      </div>

                      {/* Center: Brand Artwork Banner ("e.g. Inyange Logo") */}
                      <div className="col-span-5 flex flex-col items-center justify-center rounded-lg bg-gradient-to-b from-sky-50 via-white to-sky-100/50 p-2 text-center border border-sky-100">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-primary">Natural</span>
                        <h3 className="text-xl font-black tracking-tight text-[#0057B8]">
                          {currentRow.productName || "INYANGE"}
                        </h3>
                        <p className="text-[10px] italic font-serif text-sky-800">Natural Mineral Water</p>
                        <Badge className="mt-2 bg-[#0057B8] text-[9px] px-2 py-0">500 ml e</Badge>
                      </div>

                      {/* Right: Dynamic Traceability Stamp Panel */}
                      <div className="col-span-4 flex flex-col justify-between rounded-lg border-2 border-dashed border-primary/40 bg-primary-light p-2">
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 rounded bg-white p-0.5 border border-slate-200">
                            <BarcodePreview
                              symbology="QR"
                              value={verifyUrlForPayload(currentRow.qrPayload, origin)}
                              scale={2}
                              showText={false}
                              className="size-14"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-mono text-[9px] font-bold text-slate-900">
                              {currentRow.serial}
                            </p>
                            <p className="font-mono text-[8px] text-slate-500">
                              {currentRow.batchCode ? `B: ${currentRow.batchCode}` : "B: LOT-42"}
                            </p>
                            <p className="font-mono text-[8px] text-slate-500">EXP: 12/2027</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[8px] font-medium text-emerald-700">
                          <ShieldCheck className="size-2.5 text-emerald-600" />
                          <span>Official RSB / MINICOM QR</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. CAP / TAMPER-EVIDENT SECURITY SEAL (30×30 mm) */}
                  {preset === "security_seal" && (
                    <div className="flex h-full flex-col items-center justify-between p-1 text-center">
                      <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-800">
                        GENUINE PRODUCT
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-1 shadow-2xs">
                        <BarcodePreview
                          symbology="QR"
                          value={currentRow.qrPayload}
                          scale={2}
                          showText={false}
                          className="size-24"
                        />
                      </div>
                      <p className="font-mono text-[9px] font-bold text-slate-800">
                        {currentRow.serial}
                      </p>
                    </div>
                  )}

                  {/* 4. CARTON CASE (70×40 mm) */}
                  {preset === "carton" && (
                    <div className="flex h-full flex-col justify-between py-1">
                      <div>
                        <p className="truncate text-base font-bold text-slate-900">
                          {currentRow.productName || pool?.productName || "Product Name"}
                        </p>
                      </div>

                      <div className="flex flex-1 items-center justify-center my-1">
                        <BarcodePreview
                          symbology="CODE_128"
                          value={currentRow.serial}
                          scale={2}
                          showText={true}
                          className="h-20 w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[10px] font-mono text-slate-600">
                        <span>{currentRow.serial}</span>
                        <span>
                          {currentRow.batchCode ? `Batch ${currentRow.batchCode}` : "Batch LOT-01"}{" "}
                          {currentRow.sku ? `· ${currentRow.sku}` : ""}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 5. SHELF FLYER (90×50 mm) */}
                  {preset === "shelf" && (
                    <div className="flex h-full flex-col items-center justify-between py-2 text-center">
                      <p className="truncate text-base font-bold text-slate-900">
                        {currentRow.productName || pool?.productName || "Product Name"}
                      </p>

                      <div className="rounded-lg border border-slate-100 p-1 shadow-2xs">
                        <BarcodePreview
                          symbology="QR"
                          value={verifyUrlForPayload(currentRow.qrPayload, origin)}
                          scale={3}
                          showText={false}
                          className="size-28"
                        />
                      </div>

                      <p className="text-[11px] font-medium text-slate-500">
                        Scan to verify authentic product · <span className="font-mono">{currentRow.serial}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Carousel Code Navigation Bar */}
              <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-full border border-border/80 bg-white px-4 py-1.5 shadow-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Prev
                </Button>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Code {previewIndex + 1} of {Math.max(previewRows.length, 1)}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] bg-primary-light text-primary border-primary/20"
                  >
                    {currentRow.serial}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
                    nativeButton={false}
                    render={
                      <Link
                        href={verifyUrlForPayload(currentRow.qrPayload, origin)}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLink className="size-3" /> Test Link
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    disabled={previewIndex >= previewRows.length - 1}
                    onClick={() =>
                      setPreviewIndex((i) => Math.min(previewRows.length - 1, i + 1))
                    }
                  >
                    Next <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Bottom Quick-Jump Thumbnail Chips */}
              {previewRows.length > 1 ? (
                <div className="flex w-full max-w-xl items-center justify-center gap-1.5 overflow-x-auto py-2">
                  {previewRows.slice(0, 12).map((row, idx) => (
                    <button
                      key={row.serial}
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] transition-all whitespace-nowrap",
                        previewIndex === idx
                          ? "border-primary bg-primary text-white font-semibold shadow-xs"
                          : "border-border/60 bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      #{idx + 1} {row.serial.split("-").pop()}
                    </button>
                  ))}
                  {previewRows.length > 12 ? (
                    <button
                      type="button"
                      onClick={() => setMode("data")}
                      className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      +{previewRows.length - 12} more
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Right: Print & Output Control Panel */}
            <aside className="flex w-[290px] shrink-0 flex-col gap-4 border-l border-border/80 bg-white p-5">
              <div className="space-y-1">
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Print Output
                </h2>
                <p className="text-xs text-muted-foreground">
                  Download high-resolution vector PDF ready for thermal label printers.
                </p>
              </div>

              {/* Print Specs Card */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-semibold text-foreground">{presetMeta.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-mono text-foreground">{presetMeta.widthMm}×{presetMeta.heightMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pool codes:</span>
                  <span className="font-mono font-medium text-foreground">{rows.length.toLocaleString()}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Labels in PDF</label>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Max: {rows.length || 100}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {quantityOptions.slice(0, 5).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPrintLimit(n)}
                      className={cn(
                        "rounded-lg border py-1.5 text-center font-mono text-xs transition-colors",
                        effectivePrintLimit === n
                          ? "border-primary bg-primary text-white font-semibold shadow-xs"
                          : "border-border/80 bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      {n === rows.length ? `All (${n})` : n}
                    </button>
                  ))}
                  {rows.length > 50 && (
                    <button
                      type="button"
                      onClick={() => setPrintLimit(rows.length)}
                      className={cn(
                        "rounded-lg border py-1.5 text-center font-mono text-xs transition-colors",
                        effectivePrintLimit === rows.length
                          ? "border-primary bg-primary text-white font-semibold shadow-xs"
                          : "border-border/80 bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      All ({rows.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full h-10 gap-2 bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary/90"
                  onClick={() => void handleDownload()}
                  disabled={busy || rows.length === 0}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download {effectivePrintLimit} Labels PDF
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-9 gap-2 text-xs font-medium"
                  onClick={() => void handlePreviewPdf()}
                  disabled={busy || rows.length === 0}
                >
                  <Printer className="size-4" /> Direct Print ("Browser Dialog")
                </Button>
              </div>

              {/* Secondary Tools */}
              <div className="mt-auto space-y-2 border-t border-border/80 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Export Options
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[11px]"
                    onClick={() => void handleExportCsv()}
                    disabled={exportPool.isPending || rows.length === 0}
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-600" />
                    CSV File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[11px]"
                    onClick={() => void handleExportZip()}
                    disabled={exportPoolImages.isPending || rows.length === 0}
                  >
                    <FileArchive className="size-3.5 text-sky-600" />
                    QR ZIP
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {/* ── 2. FULL-CANVAS DESIGNER MODE (CLEAN & SPACIOUS) ── */}
        {mode === "design" ? (
          <div className="relative flex min-h-0 flex-1 flex-col p-3 md:p-4 overflow-hidden">
            {/* Field Keys Help Drawer */}
            {showFieldHelp ? (
              <div className="absolute right-6 top-6 z-30 w-80 rounded-xl border border-border/80 bg-white p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">
                      Dynamic Schema Names
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => setShowFieldHelp(false)}
                  >
                    ✕
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Click any name to copy. Paste into the element&#39;s &#34;Name&#34; field in the right sidebar to bind it to live pool data:
                </p>
                <div className="grid gap-1.5 max-h-64 overflow-y-auto">
                  {LABEL_BIND_FIELDS.map((f) => {
                    const isCopied = copiedField === f.name;
                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => copyFieldBinding(f.name)}
                        className={cn(
                          "group flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all",
                          isCopied
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-primary/5",
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-semibold text-foreground">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">· {f.label}</span>
                          </div>
                          <p className="font-mono text-[10px] text-muted-foreground/80 truncate">
                            {f.sample}
                          </p>
                        </div>
                        {isCopied ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3 text-muted-foreground group-hover:text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <PdfmeDesignerHost
                hostKey={hostKey}
                template={template}
                onTemplateChange={handleTemplateChange}
              />
            </div>
          </div>
        ) : null}

        {/* ── 3. CODE RECORDS TABLE MODE ── */}
        {mode === "data" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Pool Code Records
                </h2>
                <p className="text-xs text-muted-foreground">
                  {rowsLoading
                    ? "Loading…"
                    : `${rows.length.toLocaleString()} minted codes ready for label printing`}
                </p>
              </div>

              <div className="relative w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter by serial, batch or status…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Serial Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>QR Payload</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, idx) => (
                    <TableRow key={row.serial}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {row.serial}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 border-emerald-300 text-[10px] text-emerald-800"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {row.productName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.batchCode || "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate font-mono text-[10px] text-muted-foreground">
                        {row.qrPayload}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-medium text-primary hover:bg-primary/10"
                          onClick={() => {
                            const originalIndex = rows.findIndex(
                              (r) => r.serial === row.serial,
                            );
                            setPreviewIndex(
                              originalIndex >= 0 ? originalIndex : idx,
                            );
                            setMode("preview");
                          }}
                        >
                          Preview Label
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        {searchQuery
                          ? `No codes matched "${searchQuery}".`
                          : "No code records available."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
