"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileArchive,
  FilePlus2,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import type { Template } from "@pdfme/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FabricDesignerHost } from "@/components/labels/fabric-designer-host";
import {
  useExportPool,
  useExportPoolImages,
  useIdentityPool,
} from "@/hooks/identity-pools";
import { usePoolLabelRows } from "@/hooks/label-studio";
import {
  labelPrintJobService,
} from "@/services/label-print-job.service";
import {
  clearSavedTemplate,
  DEFAULT_PRINT_LIMIT,
  LABEL_BIND_FIELDS,
  LABEL_TEMPLATES,
  loadSavedTemplate,
  saveTemplateToStorage,
  type LabelRow,
  type LabelTemplateId,
} from "@/lib/label-studio";
import {
  downloadPdfBytes,
  generateLabelsPdf,
  getPdfmeTemplate,
  labelRowToPdfmeInput,
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
  const { data: rows = [] } = usePoolLabelRows(poolId);
  const exportPool = useExportPool();
  const exportPoolImages = useExportPoolImages();

  const [preset, setPreset] = useState<LabelTemplateId>(initialPreset);
  const [template, setTemplate] = useState<Template>(() =>
    getPdfmeTemplate(initialPreset),
  );
  const [hostVersion, setHostVersion] = useState(0);
  const [printLimit, setPrintLimit] = useState(DEFAULT_PRINT_LIMIT);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFieldHelp, setShowFieldHelp] = useState(false);
  const [isBlankDesign, setIsBlankDesign] = useState(false);

  const artworkFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoTargetPageRef = useRef(0);

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
      setIsBlankDesign(false);
      setHostVersion((v) => v + 1);
      setDirty(false);
      setSaveStatus("saved");
    },
    [poolId],
  );

  const startBlankDesign = useCallback(() => {
    const blankTemplate = {
      basePdf: {
        width: presetMeta.widthMm,
        height: presetMeta.heightMm,
        padding: [0, 0, 0, 0],
      },
      schemas: [[]],
      santrackPageBackgrounds: ["#ffffff"],
    } as Template;
    setTemplate(blankTemplate);
    setIsBlankDesign(true);
    setHostVersion((version) => version + 1);
    setDirty(true);
    toast.message("Blank page ready", {
      description: `Start designing on an empty ${presetMeta.widthMm}×${presetMeta.heightMm} mm page.`,
    });
  }, [presetMeta]);

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
    setSaveStatus("unsaved");
  }, []);

  const saveTemplate = useCallback(
    (opts?: { silent?: boolean }) => {
      saveTemplateToStorage(poolId, preset, template);
      setDirty(false);
      setSaveStatus("saved");
      if (!opts?.silent) {
        toast.success("Packaging template saved", {
          description: `Layout stored for "${presetMeta.name}" (${presetMeta.widthMm}×${presetMeta.heightMm} mm).`,
        });
      }
    },
    [poolId, preset, template, presetMeta],
  );

  // Auto-save shortly after edits so designers don’t lose work.
  useEffect(() => {
    if (!dirty) return;
    setSaveStatus("unsaved");
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      saveTemplateToStorage(poolId, preset, template);
      setDirty(false);
      setSaveStatus("saved");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, poolId, preset, template]);

  const resetTemplate = useCallback(() => {
    clearSavedTemplate(poolId, preset);
    setTemplate(getPdfmeTemplate(preset));
    setIsBlankDesign(false);
    setHostVersion((v) => v + 1);
    setDirty(false);
    setSaveStatus("saved");
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

  /** Programmatic quick-add element onto a label page. */
  const handleQuickAddElement = (
    name: string,
    type: string,
    width: number,
    height: number,
    extra: Record<string, unknown> = {},
    targetPage = 0,
  ) => {
    const next = JSON.parse(JSON.stringify(template)) as Template;
    if (!next.schemas || next.schemas.length === 0) {
      next.schemas = [[]];
    }
    while (next.schemas.length <= targetPage) next.schemas.push([]);
    const pageSchemas = next.schemas[targetPage] ?? [];
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

    next.schemas[targetPage] = [...pageSchemas, newSchema];
    handleTemplateChange(next);
    setHostVersion((v) => v + 1);
    toast.success(`Added ${name} to design`, {
      description: "Drag to position or resize on the page.",
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

  /** Upload company logo or certification image onto the active page. */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleQuickAddElement("logo", "image", 20, 20, {
        content: dataUrl,
      }, logoTargetPageRef.current);
    };
    reader.readAsDataURL(file);
  };

  const currentRow: LabelRow = useMemo(() => {
    if (rows[0]) return rows[0];
    return {
      serial: "ST-SAMPLE-000001",
      qrPayload: "00000000-0000-0000-0000-000000000001",
      status: "GENERATED",
      productName: pool?.productName ?? "Inyange Mineral Water 500ml",
      sku: pool?.productSku ?? "SKU-500ML",
      batchCode: "LOT-01",
      createdAt: new Date().toISOString(),
    };
  }, [rows, pool?.productName, pool?.productSku]);

  const designerPreviewValues = useMemo(
    () => labelRowToPdfmeInput(preset, currentRow, origin),
    [currentRow, origin, preset],
  );

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

  const recordPrintJob = useCallback(
    async (count: number) => {
      try {
        await labelPrintJobService.create({
          poolId,
          template: preset,
          quantity: count,
          renderedCount: count,
        });
      } catch (error) {
        console.warn('Print job record failed:', error);
      }
    },
    [poolId, preset],
  );

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
      await recordPrintJob(count);
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

  /**
   * "Export for print vendor" — gives the external printing house everything
   * they need in one action: the CSV of codes + the ZIP of QR images.
   */
  const handleExportForVendor = async () => {
    await handleExportCsv();
    await handleExportZip();
  };

  const hostKey = `${poolId}-${preset}-v${hostVersion}`;

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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#fafbfc]">
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

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 shadow-sm backdrop-blur-md md:px-4">
        {/* Left: Back + pool title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            nativeButton={false}
            title="Back to product identities"
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
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to product identities</span>
          </Button>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-foreground">Label studio</p>
            <p className="truncate text-[10px] text-muted-foreground">
              Pool {poolId} · {rows.length.toLocaleString()} codes
              {pool?.productName ? ` · ${pool.productName}` : ""}
            </p>
          </div>
        </div>

        {/* Right: single-row actions — never wrap */}
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 max-w-36 gap-1.5 px-2.5 text-[13px] font-medium"
                >
                  <Tag className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    {isBlankDesign ? "Blank" : presetMeta.name}
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64 border border-border/80 bg-white shadow-md">
              <DropdownMenuItem onClick={startBlankDesign} className="cursor-pointer gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/50 bg-primary/5 text-primary">
                  <FilePlus2 className="size-4" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-foreground">Blank design</span>
                  <span className="block text-[10px] text-muted-foreground">
                    Empty {presetMeta.widthMm}×{presetMeta.heightMm} mm page
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {LABEL_TEMPLATES.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => loadPresetTemplate(t.id)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-0.5 py-2",
                    !isBlankDesign && preset === t.id && "bg-primary-light",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{t.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {t.widthMm}×{t.heightMm}mm
                    </span>
                  </div>
                  <p className="text-[10px] leading-tight text-muted-foreground">{t.description}</p>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className={cn(
              "h-8 gap-1.5 px-2.5 text-[13px] font-semibold shadow-xs",
              saveStatus === "saved"
                ? "bg-muted text-muted-foreground hover:bg-muted"
                : "bg-success text-success-foreground hover:bg-success/90",
            )}
            onClick={() => saveTemplate()}
            disabled={saveStatus === "saving" || (!dirty && saveStatus === "saved")}
            title={
              saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "unsaved"
                  ? "Save now (also auto-saves)"
                  : "All changes saved"
            }
          >
            {saveStatus === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span className="hidden lg:inline">
              {saveStatus === "saving" ? "Saving…" : saveStatus === "unsaved" ? "Save" : "Saved"}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2 font-mono text-[13px]"
                  title="Labels included in PDF download"
                >
                  {effectivePrintLimit}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40 border border-border bg-card shadow-md">
              {quantityOptions.map((n) => (
                <DropdownMenuItem
                  key={n}
                  onClick={() => setPrintLimit(n)}
                  className={cn(
                    "cursor-pointer font-mono text-xs",
                    effectivePrintLimit === n && "bg-primary-light font-semibold",
                  )}
                >
                  {n === rows.length ? `All (${n})` : n}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary px-2.5 text-[13px] font-semibold text-white shadow-xs hover:bg-primary/90"
            onClick={() => void handleDownload()}
            disabled={busy || rows.length === 0}
            title={`Download ${effectivePrintLimit} labels as PDF`}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  title="More actions"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-border bg-card shadow-md">
              <DropdownMenuItem
                onClick={() => void handleExportForVendor()}
                disabled={exportPool.isPending || exportPoolImages.isPending || rows.length === 0}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileArchive className="size-4 text-primary" /> Export for print vendor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportCsv()} className="cursor-pointer gap-2 text-xs">
                <FileSpreadsheet className="size-4 text-success" /> Export codes CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportZip()} className="cursor-pointer gap-2 text-xs">
                <FileArchive className="size-4 text-primary" /> Export QR images
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => artworkFileInputRef.current?.click()}
                className="cursor-pointer gap-2 text-xs"
              >
                <UploadCloud className="size-4 text-primary" /> Upload background artwork
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowFieldHelp((value) => !value)}
                className="cursor-pointer gap-2 text-xs"
              >
                <Sparkles className="size-4 text-primary" /> Data field keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetTemplate}
                className="cursor-pointer gap-2 text-xs text-muted-foreground"
              >
                <RotateCcw className="size-4" /> Reset layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── DESIGN CANVAS ── */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3">
        {showFieldHelp ? (
          <div className="absolute right-6 top-6 z-30 w-80 space-y-3 rounded-xl border border-border/80 bg-white p-4 shadow-xl">
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
            <p className="text-[13px] leading-snug text-muted-foreground">
              Click any name to copy, then use it as the element binding key in the Fabric inspector:
            </p>
            <div className="grid max-h-64 gap-1.5 overflow-y-auto">
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
                      <p className="truncate font-mono text-[10px] text-muted-foreground/80">
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
          <FabricDesignerHost
            key={hostKey}
            hostKey={hostKey}
            template={template}
            onTemplateChange={handleTemplateChange}
            onAddImage={(targetPage) => {
              logoTargetPageRef.current = targetPage;
              logoFileInputRef.current?.click();
            }}
            onUploadArtwork={() => artworkFileInputRef.current?.click()}
            onShowDataFields={() => setShowFieldHelp(true)}
            previewValues={designerPreviewValues}
            templateOptions={LABEL_TEMPLATES}
            activeTemplateId={isBlankDesign ? undefined : preset}
            onSelectTemplate={(templateId) => loadPresetTemplate(templateId as LabelTemplateId)}
            onCreateBlank={startBlankDesign}
            pageWidthMm={presetMeta.widthMm}
            pageHeightMm={presetMeta.heightMm}
          />
        </div>
      </div>
    </div>
  );
}
