"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  QrCode,
  Layers,
  FileText,
  ArrowLeft,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Factory,
  Tag,
  Barcode,
  Building2,
  Boxes,
  Layers3,
  LoaderCircle,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/stat-card";
import { IdentityPoolsPanel } from "@/components/products/identity-pools-panel";
import {
  SymbologyPicker,
  SymbologyNote,
} from "@/components/barcode/symbology-picker";
import { useProduct } from "@/hooks/products";
import { useBatches, useCreateBatch } from "@/hooks/batches";
import { useFacilities } from "@/hooks/facilities";
import { useIdentityPools } from "@/hooks/identity-pools";
import {
  useBarcodeCheck,
  useBarcodePreview,
  useSymbologies,
} from "@/hooks/barcodes";
import { barcodeService, type Symbology } from "@/services/barcode.service";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Batch } from "@/services/batch.service";

const categoryColors: Record<string, string> = {
  AGRICULTURE: "border-success/30 bg-success/10 text-success",
  MINING: "border-warning/30 bg-warning/10 text-warning-foreground",
  MANUFACTURING: "border-primary/30 bg-primary/10 text-primary",
  FOOD: "border-success/30 bg-success/10 text-success",
  PHARMACEUTICAL: "border-info/30 bg-info/10 text-info",
};

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const productId = Number(rawId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "details";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: batches = [], isLoading: batchesLoading } = useBatches(productId);
  const { data: poolsData } = useIdentityPools(productId);

  const pools = poolsData?.content ?? [];
  const totalPools = pools.length;
  const totalMinted = pools.reduce((acc, p) => acc + (p.requestedCount || 0), 0);

  if (productLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Loading product details…</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-danger/10">
          <AlertCircle className="size-6 text-danger" />
        </div>
        <h2 className="text-lg font-semibold">Product Not Found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The requested product does not exist or has been removed.
        </p>
        <Button className="mt-4" render={<Link href="/dashboard/products" />}>
          <ArrowLeft className="mr-2 size-4" /> Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm" className="gap-1 mt-0.5">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Package className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
              <span className="font-mono text-xs font-semibold rounded bg-muted px-2 py-0.5 text-muted-foreground border">
                {product.sku}
              </span>
              {product.category && (
                <Badge
                  variant="outline"
                  className={categoryColors[product.category] ?? "border-border bg-muted/60 text-muted-foreground"}
                >
                  {product.categoryName || product.category}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {product.brand ? `${product.brand} · ` : ""}
              {product.gtin ? `GTIN: ${product.gtin}` : "No GTIN"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("labels")}
          >
            <QrCode className="mr-1.5 size-4" />
            Product Labels
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("identities")}
          >
            <Plus className="mr-1.5 size-4" />
            Prepare Codes
          </Button>
        </div>
      </div>

      {/* ── Overview KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Code Runs"
          value={totalPools}
          icon={<QrCode className="size-4" />}
          iconBg="bg-primary"
          caption={`${totalMinted.toLocaleString()} codes prepared in total`}
        />
        <MetricCard
          title="Batches"
          value={batches.length}
          icon={<Layers className="size-4" />}
          iconBg="bg-success"
          caption="Production lots on record"
        />
        <MetricCard
          title="Barcode Symbology"
          value={product.barcodeSymbology || "QR"}
          icon={<Barcode className="size-4" />}
          iconBg="bg-warning text-foreground"
          caption={product.gtin ? `Encoded with GTIN ${product.gtin}` : "Internal SKU encoded"}
        />
      </div>

      {/* ── Tabs Container ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="details" className="gap-2">
            <FileText className="size-4" />
            Details & Specs
          </TabsTrigger>
          <TabsTrigger value="identities" className="gap-2">
            <QrCode className="size-4" />
            Identities & Pools
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2">
            <Layers className="size-4" />
            Batches ({batches.length})
          </TabsTrigger>
          <TabsTrigger value="labels" className="gap-2">
            <Barcode className="size-4" />
            Labels & Codes
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Details ── */}
        <TabsContent value="details">
          <Card className="rounded-xl border border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Product Specification</CardTitle>
              <CardDescription>
                Catalog properties, regulatory identifiers, and classification for {product.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Product Name" value={product.name} />
                <DetailRow label="SKU" value={product.sku} mono />
                <DetailRow label="GTIN / Barcode Value" value={product.gtin || "—"} mono />
                <DetailRow label="Brand" value={product.brand || "—"} />
                <DetailRow label="Category" value={product.categoryName || product.category || "—"} />
                <DetailRow label="Default Symbology" value={product.barcodeSymbology || "QR"} />
                <DetailRow label="Unit of Measure" value={(product as any).unit || "Unit"} />
                <DetailRow
                  label="Registered On"
                  value={(product as any).createdAt ? new Date((product as any).createdAt).toLocaleDateString() : "—"}
                />
              </div>

              {product.specification && (
                <div className="space-y-1.5 rounded-xl border border-border/80 bg-[#f8fafc] p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Technical Specifications
                  </span>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {product.specification}
                  </p>
                </div>
              )}

              {(product as any).description && (
                <div className="space-y-1.5 rounded-xl border border-border/80 bg-[#f8fafc] p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </span>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {(product as any).description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Identities ── */}
        <TabsContent value="identities">
          <IdentityPoolsPanel productId={product.id} productName={product.name} />
        </TabsContent>

        {/* ── Tab 3: Batches ── */}
        <TabsContent value="batches">
          <BatchesTab product={product} batches={batches} isLoading={batchesLoading} />
        </TabsContent>

        {/* ── Tab 4: Labels ── */}
        <TabsContent value="labels">
          <LabelsTab product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-[#f8fafc] p-3.5 space-y-1 shadow-2xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-sm font-medium text-foreground", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Batches Tab Component
// ─────────────────────────────────────────────────────────────────────────────

const batchColumns: ColumnDef<TableFeatures, Batch>[] = [
  {
    accessorKey: "batchCode",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Batch Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground" />
        <span className="font-mono font-medium">{row.getValue("batchCode")}</span>
      </div>
    ),
  },
  {
    accessorKey: "facilityName",
    header: "Facility",
    cell: ({ row }) => (
      <span className="text-sm">
        {(row.original as any).facilityName || (row.original as any).facility?.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "manufacturedOn",
    header: "Manufactured",
    cell: ({ row }) => row.getValue("manufacturedOn") || "—",
  },
  {
    accessorKey: "expiresOn",
    header: "Expires",
    cell: ({ row }) => row.getValue("expiresOn") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className={
            status === "ACTIVE" || status === "APPROVED"
              ? "border-success/30 bg-success/10 text-success"
              : status === "PENDING_QC"
                ? "border-warning/30 bg-warning/10 text-warning-foreground"
                : "border-border bg-muted/60 text-muted-foreground"
          }
        >
          {status}
        </Badge>
      );
    },
  },
];

function BatchesTab({
  product,
  batches,
  isLoading,
}: {
  product: { id: number; name: string };
  batches: Batch[];
  isLoading: boolean;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Production Batches</CardTitle>
            <CardDescription>
              Every production lot recorded for {product.name}. A batch provides the manufacturing date, plant, and shelf life when codes are scanned.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 size-4" />
            New Batch
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading batches…
            </div>
          ) : batches.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Layers className="size-6 text-primary" />
              </div>
              <p className="font-medium">No batches created yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a batch lot before starting a production run.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setCreating(true)}
              >
                <Plus className="mr-1.5 size-4" /> Open first batch
              </Button>
            </div>
          ) : (
            <DataTable
              columns={batchColumns}
              data={batches}
              filterPlaceholder="Search batches..."
              filterColumn="batchCode"
              showPagination={batches.length > 10}
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <NewBatchDialog
        open={creating}
        onOpenChange={setCreating}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}

function NewBatchDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: number;
  productName: string;
}) {
  const createMutation = useCreateBatch();
  const { data: facilities } = useFacilities();

  const today = new Date().toISOString().slice(0, 10);
  const [batchCode, setBatchCode] = useState(() => {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LOT-${d}-${r}`;
  });
  const [facilityId, setFacilityId] = useState("");
  const [manufacturedOn, setManufacturedOn] = useState(today);
  const [expiresOn, setExpiresOn] = useState("");

  const valid =
    batchCode.trim().length > 0 &&
    (!expiresOn || !manufacturedOn || expiresOn >= manufacturedOn);

  const submit = async () => {
    await createMutation.mutateAsync({
      productId,
      batchCode: batchCode.trim(),
      ...(facilityId ? { facilityId: Number(facilityId) } : {}),
      ...(manufacturedOn ? { manufacturedOn } : {}),
      ...(expiresOn ? { expiresOn } : {}),
    });
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    setBatchCode(`LOT-${d}-${r}`);
    setExpiresOn("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogTitle>Open Production Batch</DialogTitle>
        <DialogDescription>{productName}</DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Batch code
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
                  setBatchCode(`LOT-${d}-${r}`);
                }}
                className="h-5 px-1.5 text-[10px] text-primary gap-1"
              >
                <RefreshCw className="size-2.5" /> Auto-generate
              </Button>
            </div>
            <Input
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder="e.g. LOT-20260824-A1B2"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Made at site
            </Label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="">Not recorded</option>
              {(facilities ?? []).map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Named on consumer scan as the plant it came from.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Manufactured
              </Label>
              <Input
                type="date"
                value={manufacturedOn}
                onChange={(e) => setManufacturedOn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Expires
              </Label>
              <Input
                type="date"
                value={expiresOn}
                onChange={(e) => setExpiresOn(e.target.value)}
              />
            </div>
          </div>
          {expiresOn && manufacturedOn && expiresOn < manufacturedOn && (
            <p className="text-xs text-danger">
              A batch cannot expire before it was manufactured.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={!valid || createMutation.isPending}
            >
              {createMutation.isPending && (
                <LoaderCircle className="mr-1 size-3 animate-spin" />
              )}
              Open Batch
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels Tab Component (Catalog QR + Barcode Symbology Preview)
// ─────────────────────────────────────────────────────────────────────────────

function LabelsTab({
  product,
}: {
  product: {
    id: number;
    name: string;
    sku: string;
    gtin?: string | null;
    barcodeSymbology?: Symbology | null;
  };
}) {
  const [symbology, setSymbology] = useState<Symbology>(
    product.barcodeSymbology || "QR",
  );
  const [scale, setScale] = useState(4);
  const [format, setFormat] = useState<"png" | "svg">("png");

  const { data: catalogue } = useSymbologies();
  const spec = catalogue?.symbologies.find((s) => s.symbology === symbology);

  const value = useMemo(() => {
    const needsGtin = spec?.use === "RETAIL" || spec?.use === "PUBLICATION";
    return needsGtin ? (product.gtin ?? "") : product.sku;
  }, [product.gtin, product.sku, spec?.use]);

  const missingGtin =
    !product.gtin && (spec?.use === "RETAIL" || spec?.use === "PUBLICATION");

  const { data: validity } = useBarcodeCheck(symbology, value);
  const { url, rendering, problem } = useBarcodePreview(
    value.trim() && !missingGtin
      ? { symbology, value, scale, format: "png" }
      : null,
  );

  const download = async () => {
    if (!value.trim()) return;
    const href =
      format === "png" && url
        ? url
        : await barcodeService.render({ symbology, value, scale: 6, format });

    const link = document.createElement("a");
    link.href = href;
    link.download = `${product.sku}-${symbology}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (href !== url) URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Configuration ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Barcode &amp; Label Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Barcode Symbology</Label>
                <SymbologyPicker value={symbology} onChange={setSymbology} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Resolution / Size</Label>
                  <Select
                    value={String(scale)}
                    onValueChange={(v) => v && setScale(Number(v))}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select resolution">
                        {scale === 2
                          ? "Small (72 dpi)"
                          : scale === 4
                            ? "Standard (150 dpi)"
                            : scale === 6
                              ? "High Res (300 dpi print)"
                              : scale === 8
                                ? "Ultra High Res"
                                : `${scale}x`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Small (72 dpi)</SelectItem>
                      <SelectItem value="4">Standard (150 dpi)</SelectItem>
                      <SelectItem value="6">High Res (300 dpi print)</SelectItem>
                      <SelectItem value="8">Ultra High Res</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Format</Label>
                  <Select
                    value={format}
                    onValueChange={(v) => v && setFormat(v as "png" | "svg")}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select format">
                        {format === "png" ? "PNG (Raster Image)" : "SVG (Vector Print)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG (Raster Image)</SelectItem>
                      <SelectItem value="svg">SVG (Vector Print)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-1 text-xs">
                <span className="font-semibold text-foreground">Encoding Value:</span>
                <p className="font-mono text-muted-foreground break-all">{value || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Preview ── */}
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Label Preview</CardTitle>
            <CardDescription>
              {spec?.label || "Code"} for {product.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingGtin && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  {spec?.label} encodes a GTIN/EAN, but {product.sku} has no GTIN registered. Edit the product to add a GTIN, or choose a 2D code like QR / DataMatrix.
                </span>
              </div>
            )}

            {validity && !validity.valid && !missingGtin && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                <span>{validity.problem}</span>
              </div>
            )}

            <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-border bg-white p-4 shadow-inner">
              {rendering ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Rendering label…
                </span>
              ) : url ? (
                <img
                  src={url}
                  alt={`${spec?.label ?? "Code"} for ${value}`}
                  className="max-h-[220px] max-w-full object-contain"
                />
              ) : problem ? (
                <div className="text-center text-xs text-danger space-y-1">
                  <AlertCircle className="mx-auto size-5 text-danger" />
                  <p>Could not render barcode</p>
                  <p className="text-muted-foreground">{problem}</p>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground">
                  <QrCode className="mx-auto size-6 text-muted-foreground mb-1" />
                  <p>Label preview unavailable</p>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={download}
              disabled={!url || rendering || missingGtin}
            >
              <Download className="mr-2 size-4" />
              Download {format.toUpperCase()} Label
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

