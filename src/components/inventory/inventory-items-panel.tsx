"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  MoreHorizontal,
  ScanLine,
  Copy,
  X,
  ChevronRight,
  Download,
  ImageDown,
  Loader2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SymbologyPicker } from "@/components/barcode/symbology-picker";
import { PrintLabelDialog } from "@/components/trace/action-dialogs";
import { useItems } from "@/hooks/items";
import { useProducts } from "@/hooks/products";
import { useBarcodePreview, useSymbologies } from "@/hooks/barcodes";
import { barcodeService, type Symbology } from "@/services/barcode.service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import type { Item } from "@/services/item.service";

/** Identity matrix codes carry the permanent token; linear warehouse codes print the serial. */
const INTERNAL_LABEL_TYPES = new Set<Symbology>([
  "CODE_128",
  "CODE_39",
  "CODE_93",
]);

function labelPayload(item: Item, symbology: Symbology): string {
  return INTERNAL_LABEL_TYPES.has(symbology) ? item.code : item.qrCode;
}

/** Codabar cannot encode ST- serials or UUID identity tokens. */
const STOCK_LABEL_EXCLUDE: Symbology[] = ["CODABAR"];

async function downloadAllItemLabels(
  items: Item[],
  symbology: Symbology,
  filename: string,
  onProgress?: (done: number, total: number) => void,
) {
  if (items.length === 0) return;

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const BATCH = 20;
  let done = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const blobs = await Promise.all(
      batch.map((item) =>
        barcodeService.renderBlob({
          symbology,
          value: labelPayload(item, symbology),
          scale: 6,
          format: "png",
        }),
      ),
    );
    blobs.forEach((blob, j) => {
      zip.file(`${batch[j].code}-${symbology}.png`, blob);
    });
    done += batch.length;
    onProgress?.(done, items.length);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type ProductGroup = {
  productId: number;
  productName: string;
  productSku: string;
  total: number;
  active: number;
  sold: number;
  other: number;
};

function StockCodesPanelInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("productId");
  const productId = productIdParam ? Number(productIdParam) : undefined;

  const filtered =
    productId != null && !Number.isNaN(productId) ? productId : undefined;

  const { data: itemData, isLoading } = useItems({
    size: 200,
    productId: filtered,
  });
  const { data: productsPage } = useProducts(0, 200);
  const { data: symbologyCatalogue } = useSymbologies();

  const items = itemData?.content ?? [];

  const [labelItem, setLabelItem] = useState<Item | null>(null);
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [zipSymbology, setZipSymbology] = useState<Symbology>("QR");
  const [zipProgress, setZipProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const zipBusy = zipProgress != null;

  const zipSymbologyLabel =
    symbologyCatalogue?.symbologies.find((s) => s.symbology === zipSymbology)
      ?.label ?? zipSymbology;

  const previewItem = items[0];
  const {
    url: zipPreviewUrl,
    rendering: zipPreviewRendering,
    problem: zipPreviewProblem,
  } = useBarcodePreview(
    zipDialogOpen && previewItem
      ? {
          symbology: zipSymbology,
          value: labelPayload(previewItem, zipSymbology),
          scale: 4,
          format: "png",
        }
      : null,
  );

  const productName = useMemo(() => {
    if (!filtered) return null;
    return (
      productsPage?.content?.find((p) => p.id === filtered)?.name ??
      items[0]?.productName ??
      `Product #${filtered}`
    );
  }, [filtered, productsPage, items]);

  const groups = useMemo(() => {
    const map = new Map<number, ProductGroup>();
    for (const item of items) {
      const id = item.productId;
      if (id == null) continue;
      const row = map.get(id) ?? {
        productId: id,
        productName: item.productName || `Product #${id}`,
        productSku: item.productSku || "—",
        total: 0,
        active: 0,
        sold: 0,
        other: 0,
      };
      row.total += 1;
      if (item.status === "ACTIVE") row.active += 1;
      else if (item.status === "SOLD") row.sold += 1;
      else row.other += 1;
      map.set(id, row);
    }
    return [...map.values()].sort((a, b) =>
      a.productName.localeCompare(b.productName),
    );
  }, [items]);

  const groupColumns = useMemo<ColumnDef<TableFeatures, ProductGroup>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.productName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {row.original.productSku}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Codes held",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {row.original.total.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Active",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.active}</span>
        ),
      },
      {
        accessorKey: "sold",
        header: "Sold",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.sold}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            nativeButton={false}
            render={
              <Link
                href={`/dashboard/inventory?tab=items&productId=${row.original.productId}`}
              />
            }
          >
            View codes
            <ChevronRight className="ml-1 size-3.5" />
          </Button>
        ),
      },
    ],
    [],
  );

  const unitColumns = useMemo<ColumnDef<TableFeatures, Item>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Stock code",
        cell: ({ row }) => (
          <p className="font-mono text-sm font-semibold">{row.original.code}</p>
        ),
      },
      {
        accessorKey: "kind",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.packageType || row.original.kind}
          </Badge>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Units",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.quantity.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "locationName",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.locationName || "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const ok = status === "ACTIVE";
          return (
            <Badge
              variant="outline"
              className={
                ok
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted/60 text-muted-foreground"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                title="Download label — choose code type"
                onClick={() => setLabelItem(item)}
              >
                <ImageDown className="size-3.5" />
                Label
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setLabelItem(item)}>
                    <Download className="mr-2 size-4" /> Download label…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    nativeButton={false}
                    render={
                      <Link
                        href={`/dashboard/manufacturing/trace?qr=${encodeURIComponent(item.qrCode)}`}
                      />
                    }
                  >
                    <ScanLine className="mr-2 size-4" /> Open in Trace
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await navigator.clipboard.writeText(item.code);
                      toast.success(`Copied ${item.code}`);
                    }}
                  >
                    <Copy className="mr-2 size-4" /> Copy serial
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await navigator.clipboard.writeText(item.qrCode);
                      toast.success("Copied identity payload");
                    }}
                  >
                    <Copy className="mr-2 size-4" /> Copy identity payload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const clearProductFilter = () => {
    router.replace("/dashboard/inventory?tab=items", { scroll: false });
  };

  const handleDownloadAll = async () => {
    if (items.length === 0 || zipBusy) return;
    const slug = (productName || "stock")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    try {
      setZipDialogOpen(false);
      setZipProgress({ done: 0, total: items.length });
      await downloadAllItemLabels(
        items,
        zipSymbology,
        `${slug}-stock-${zipSymbology.toLowerCase()}.zip`,
        (done, total) => setZipProgress({ done, total }),
      );
      toast.success(`Downloaded ${items.length} ${zipSymbologyLabel} labels`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not build label ZIP"));
    } finally {
      setZipProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {!filtered ? (
            <p className="text-sm text-muted-foreground">
              Held stock grouped by product. Open a product to see each serial
              code.
            </p>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-primary/10 px-3 py-1.5 text-sm">
              <Package className="size-3.5 text-primary" />
              <span>
                Codes for <strong>{productName}</strong>
              </span>
              <button
                type="button"
                onClick={clearProductFilter}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Back to product groups"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        {filtered && items.length > 0 ? (
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              disabled={zipBusy}
              onClick={() => setZipDialogOpen(true)}
            >
              {zipBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImageDown className="size-3.5" />
              )}
              {zipProgress
                ? `ZIP ${zipProgress.done}/${zipProgress.total}`
                : `Download all labels (${items.length})`}
            </Button>
            {zipProgress ? (
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.round(
                      (zipProgress.done / zipProgress.total) * 100,
                    )}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            {filtered ? "Unit codes" : "Stock by product"}
          </CardTitle>
          <CardDescription>
            {filtered
              ? `${itemData?.totalElements ?? items.length} identities`
              : `${groups.length} product${groups.length === 1 ? "" : "s"} with held stock`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading…
            </div>
          ) : !filtered ? (
            groups.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No held stock codes yet.
              </div>
            ) : (
              <DataTable
                columns={groupColumns}
                data={groups}
                filterColumn="productName"
                filterPlaceholder="Filter products…"
                pageSize={10}
                pageSizeOptions={[10, 15, 25, 50]}
                showSelectionCount={false}
                noBorder
              />
            )
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No held codes for this product. Confirm production or onboard
              opening stock.
            </div>
          ) : (
            <DataTable
              columns={unitColumns}
              data={items}
              filterColumn="code"
              filterPlaceholder="Search serial (ST-…)…"
              pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]}
              showSelectionCount={false}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      {labelItem ? (
        <PrintLabelDialog
          open={!!labelItem}
          onOpenChange={(open) => {
            if (!open) setLabelItem(null);
          }}
          item={labelItem}
          only={["IDENTITY", "INTERNAL"]}
          exclude={STOCK_LABEL_EXCLUDE}
        />
      ) : null}

      <Dialog open={zipDialogOpen} onOpenChange={setZipDialogOpen}>
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download all labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Code type</Label>
              <SymbologyPicker
                value={zipSymbology}
                onChange={setZipSymbology}
                only={["IDENTITY", "INTERNAL"]}
                exclude={STOCK_LABEL_EXCLUDE}
              />
              <p className="text-xs text-muted-foreground">
                {items.length} labels for {productName ?? "this product"}
              </p>
            </div>

            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-border bg-white p-4">
              {zipPreviewRendering ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : zipPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={zipPreviewUrl}
                  alt={`Preview ${previewItem?.code ?? ""} as ${zipSymbologyLabel}`}
                  className="max-h-[160px] max-w-full object-contain"
                />
              ) : (
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  {zipPreviewProblem ?? "Choose a code type to preview."}
                </p>
              )}
            </div>
            {previewItem ? (
              <p className="text-center font-mono text-[11px] text-muted-foreground">
                Preview: {previewItem.code}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setZipDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={zipBusy || (!zipPreviewUrl && !zipPreviewRendering)}
              onClick={() => void handleDownloadAll()}
            >
              Download ZIP ({zipSymbologyLabel})
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

export function InventoryItemsPanel() {
  return (
    <Suspense fallback={null}>
      <StockCodesPanelInner />
    </Suspense>
  );
}
