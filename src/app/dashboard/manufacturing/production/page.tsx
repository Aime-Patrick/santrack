"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Plus,
  Factory,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Archive,
  Pencil,
  QrCode,
  AlertTriangle,
  Boxes,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useProducts } from "@/hooks/products";
import { useMachines } from "@/hooks/machines";
import { useLocations } from "@/hooks/locations";
import {
  useProductionOrders,
  useStartProduction,
  useCompleteProduction,
  useCancelProduction,
  useCloseProduction,
  useCreateProductionOrder,
  useAmendQuantity,
  useBoms,
} from "@/hooks/manufacturing";
import {
  useProductionEligibility,
  useDebouncedValue,
} from "@/hooks/eligibility";
import {
  useIdentityPools,
  useAssignIdentities,
  useCancelIdentities,
  useConfirmProduced,
} from "@/hooks/identity-pools";
import {
  CANCELLATION_REASONS,
  type CancellationReason,
} from "@/services/identity-pool.service";
import type { ProductionOrder } from "@/services/manufacturing.service";

const statusColors: Record<string, string> = {
  PLANNED: "border-border bg-muted/60 text-muted-foreground",
  IN_PROGRESS: "border-transparent bg-primary text-white",
  COMPLETED: "border-transparent bg-success text-white",
  CANCELLED: "border-transparent bg-danger text-white",
};

export default function ProductionOrdersPage() {
  const { data, isLoading } = useProductionOrders();
  const startProduction = useStartProduction();
  const completeProduction = useCompleteProduction();
  const cancelProduction = useCancelProduction();
  const closeProduction = useCloseProduction();
  const createOrder = useCreateProductionOrder();
  const amendQuantity = useAmendQuantity();

  const orders = data?.content ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [completing, setCompleting] = useState<ProductionOrder | null>(null);
  const [amending, setAmending] = useState<ProductionOrder | null>(null);
  const [assigningPool, setAssigningPool] = useState<ProductionOrder | null>(null);
  const [cancellingCodes, setCancellingCodes] = useState<ProductionOrder | null>(null);
  const [confirmingProduction, setConfirmingProduction] = useState<ProductionOrder | null>(null);

  const columns: ColumnDef<TableFeatures, ProductionOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <div>
            <span className="font-mono text-sm font-semibold">{row.getValue("orderNumber")}</span>
            {row.original.batchCode && (
              <span className="block font-mono text-xs text-muted-foreground">
                Lot: {row.original.batchCode}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-medium">{row.getValue("productName")}</span>
          <Link
            href={`/dashboard/products/${row.original.productId}?tab=identities`}
            className="block text-xs text-primary hover:underline"
          >
            View Code Pools
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "plannedQuantity",
      header: "Planned",
      cell: ({ row }) => <span className="text-sm">{row.getValue("plannedQuantity")}</span>,
    },
    {
      accessorKey: "producedQuantity",
      header: "Produced",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-success">
          {row.getValue("producedQuantity")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={statusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "machineCode",
      header: "Machine",
      cell: ({ row }) => {
        const code = row.getValue("machineCode") as string | null;
        return code ? <span className="font-mono text-sm text-muted-foreground">{code}</span> : "—";
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.getValue("createdAt") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-1.5 rounded-xl shadow-lg border border-border">
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch #{order.orderNumber}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {order.status === "PLANNED" && (
                <>
                  <DropdownMenuItem onClick={() => startProduction.mutate(order.id)} className="py-2.5 px-3 text-sm font-medium">
                    <Play className="mr-2.5 size-4 text-success shrink-0" /> Activate Batch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssigningPool(order)} className="py-2.5 px-3 text-sm font-medium">
                    <QrCode className="mr-2.5 size-4 text-primary shrink-0" /> Link / Change Code Pool
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      cancelProduction.mutate({
                        id: order.id,
                        data: { reason: "Cancelled by admin" },
                      })
                    }
                    className="py-2.5 px-3 text-sm font-medium text-danger focus:text-danger"
                  >
                    <XCircle className="mr-2.5 size-4 shrink-0" /> Delete Batch
                  </DropdownMenuItem>
                </>
              )}

              {order.status === "IN_PROGRESS" && (
                <>
                  <DropdownMenuItem onClick={() => setCompleting(order)} className="py-2.5 px-3 text-sm font-semibold text-success focus:text-success bg-emerald-50 focus:bg-success/10">
                    <CheckCircle className="mr-2.5 size-4 text-success shrink-0" /> Complete Batch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssigningPool(order)} className="py-2.5 px-3 text-sm font-medium">
                    <QrCode className="mr-2.5 size-4 text-primary shrink-0" /> Link / Change Code Pool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCancellingCodes(order)} className="py-2.5 px-3 text-sm font-medium">
                    <AlertTriangle className="mr-2.5 size-4 text-warning-foreground shrink-0" /> Mark Defective Units
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      cancelProduction.mutate({
                        id: order.id,
                        data: { reason: "Cancelled by admin" },
                      })
                    }
                    className="py-2.5 px-3 text-sm font-medium text-danger focus:text-danger"
                  >
                    <XCircle className="mr-2.5 size-4 shrink-0" /> Cancel Batch
                  </DropdownMenuItem>
                </>
              )}

              {order.status === "COMPLETED" && (
                <>
                  <DropdownMenuItem onClick={() => setConfirmingProduction(order)} className="py-2.5 px-3 text-sm font-semibold text-success focus:text-success bg-emerald-50 focus:bg-success/10">
                    <PackageCheck className="mr-2.5 size-4 text-success shrink-0" /> Confirm Output → Enter Stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAmending(order)} className="py-2.5 px-3 text-sm font-medium">
                    <Pencil className="mr-2.5 size-4 shrink-0" /> Adjust Final Quantity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => closeProduction.mutate(order.id)} className="py-2.5 px-3 text-sm font-medium">
                    <Archive className="mr-2.5 size-4 shrink-0" /> Archive Batch
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const total = data?.total ?? 0;
  const plannedCount = orders.filter((o) => o.status === "PLANNED").length;
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Production &amp; Batches</h1>
            <p className="text-sm text-muted-foreground">
              Record production batches, link unique QR identity pools, and move finished goods into inventory.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9 font-medium shadow-xs">
            <Plus className="mr-1.5 size-4" />
            Log Production Batch
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Batches"
          value={total}
          icon={<Factory className="size-4" />}
          iconBg="bg-primary"
          caption="All production batches"
        />
        <MetricCard
          title="Pending"
          value={plannedCount}
          icon={<Clock className="size-4" />}
          iconBg="bg-muted text-muted-foreground"
          caption="Awaiting activation"
        />
        <MetricCard
          title="In Progress"
          value={inProgressCount}
          icon={<Play className="size-4" />}
          iconBg="bg-primary"
          caption="Being produced"
        />
        <MetricCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-success"
          caption="In inventory"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Production Batches</CardTitle>
          <CardDescription>{total} batch{total !== 1 ? "es" : ""} recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading orders…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              filterPlaceholder="Search orders..."
              filterColumn="orderNumber"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      {/* Modals & Lifecycle Dialogs */}
      <NewOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(payload) =>
          createOrder.mutate(payload, { onSuccess: () => setCreateOpen(false) })
        }
        pending={createOrder.isPending}
      />

      <AssignPoolDialog
        order={assigningPool}
        onOpenChange={(open) => !open && setAssigningPool(null)}
      />

      <CancelCodesDialog
        order={cancellingCodes}
        onOpenChange={(open) => !open && setCancellingCodes(null)}
      />

      <ConfirmProductionDialog
        order={confirmingProduction}
        onOpenChange={(open) => !open && setConfirmingProduction(null)}
      />

      <CompleteDialog
        order={completing}
        onOpenChange={(open) => !open && setCompleting(null)}
        onSubmit={(payload) =>
          completing &&
          completeProduction.mutate(
            { id: completing.id, data: payload },
            { onSuccess: () => setCompleting(null) },
          )
        }
        pending={completeProduction.isPending}
      />

      <AmendDialog
        order={amending}
        onOpenChange={(open) => !open && setAmending(null)}
        onSubmit={(payload) =>
          amending &&
          amendQuantity.mutate(
            { id: amending.id, data: payload },
            { onSuccess: () => setAmending(null) },
          )
        }
        pending={amendQuantity.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Pool Dialog
// ─────────────────────────────────────────────────────────────────────────────

function AssignPoolDialog({
  order,
  onOpenChange,
}: {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: poolsData, isLoading } = useIdentityPools(order?.productId);
  const assignMutation = useAssignIdentities();

  const [poolId, setPoolId] = useState<string>("");
  const [count, setCount] = useState<string>("");

  const pools = (poolsData?.content ?? []).filter(
    (p) => p.status === "READY" || p.status === "GENERATING",
  );

  const selectedPool = pools.find((p) => String(p.id) === poolId);
  const poolCodes = selectedPool?.requestedCount ?? 0;
  const planned = order?.plannedQuantity ?? 0;
  const suggestedClaim =
    poolCodes > 0 && planned > 0
      ? Math.min(poolCodes, planned)
      : poolCodes || planned || 0;

  const onPoolChange = (value: string) => {
    setPoolId(value);
    if (!value) {
      setCount("");
      return;
    }
    const pool = pools.find((p) => String(p.id) === value);
    const codes = pool?.requestedCount ?? 0;
    // Prefill from the smaller of planned target and pool size; still editable.
    const next =
      codes > 0 && planned > 0 ? Math.min(codes, planned) : codes || planned || 0;
    setCount(next > 0 ? String(next) : "");
  };

  const claimNum = count === "" ? suggestedClaim : Number(count);
  const overPool = count !== "" && Number(count) > poolCodes;
  const underPlan =
    planned > 0 && (count === "" ? suggestedClaim : Number(count)) < planned;

  const submit = async () => {
    if (!order || !poolId) return;
    const parsedCount = count ? Number(count) : undefined;

    await assignMutation.mutateAsync({
      poolId: Number(poolId),
      productionOrderId: order.id,
      count: parsedCount,
    });
    setPoolId("");
    setCount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Code Pool to Order</DialogTitle>
          <DialogDescription>
            Claim prepared labels from a pool for {order?.orderNumber} (
            {order?.productName}). Planned target: {planned || "—"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading pools…
            </div>
          ) : pools.length === 0 ? (
            <div className="space-y-2 rounded-lg border border-warning/30 bg-amber-50 p-3 text-xs text-warning-foreground">
              <p className="font-semibold">No ready code pools available</p>
              <p>
                Prepare codes first from the product page, then claim them here.
              </p>
              {order && (
                <Link
                  href={`/dashboard/products/${order.productId}?tab=identities`}
                  className="inline-block font-semibold text-primary underline"
                >
                  Go to {order.productName} Code Pools →
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Select Code Run / Pool *
                </Label>
                <SearchableSelect
                  value={poolId}
                  onValueChange={onPoolChange}
                  placeholder="Choose a ready pool…"
                  searchPlaceholder="Search pools by run ID, code count…"
                  items={pools.map((p) => ({
                    value: String(p.id),
                    label: `Pool #${p.id} — ${(p.requestedCount ?? 0).toLocaleString()} codes`,
                    badge: p.status === "READY" ? "Ready" : "Preparing",
                  }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Codes to claim (editable)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={poolCodes || undefined}
                  placeholder={
                    suggestedClaim > 0
                      ? `Suggested ${suggestedClaim}`
                      : "All available in pool"
                  }
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="h-10 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Prefills with min(planned {planned || "—"}, pool{" "}
                  {poolCodes || "—"}). Clear the field to claim the whole pool.
                </p>
                {overPool ? (
                  <p className="text-[11px] text-danger">
                    Pool only has {poolCodes} codes.
                  </p>
                ) : null}
                {underPlan && !overPool && poolId ? (
                  <p className="text-[11px] text-amber-700">
                    Claiming {claimNum || 0} codes but the order plans {planned}.
                    Generate another pool or lower the planned quantity.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!poolId || assignMutation.isPending || overPool}
            onClick={submit}
          >
            {assignMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Claim Codes
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel Codes Dialog (Defects, Misprints, Unused Labels)
// ─────────────────────────────────────────────────────────────────────────────

function CancelCodesDialog({
  order,
  onOpenChange,
}: {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cancelMutation = useCancelIdentities();
  const [rawCodes, setRawCodes] = useState("");
  const [reason, setReason] = useState<CancellationReason>("PRODUCTION_DEFECT");
  const [notes, setNotes] = useState("");

  const parsedCodes = rawCodes
    .split(/[\n, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const submit = async () => {
    if (parsedCodes.length === 0) return;
    await cancelMutation.mutateAsync({
      codes: parsedCodes,
      reason,
      notes: notes.trim() || undefined,
    });
    setRawCodes("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Defective or Unused Codes</DialogTitle>
          <DialogDescription>
            Record broken bottles, misprinted labels, or leftover codes. Cancelled codes will never enter stock and cannot be re-used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Scanned or Entered Codes ({parsedCodes.length})</Label>
            <textarea
              rows={4}
              value={rawCodes}
              onChange={(e) => setRawCodes(e.target.value)}
              placeholder="Scan barcodes or paste codes separated by commas or newlines:&#10;ST-AKAG-000101&#10;ST-AKAG-000102"
              className="w-full rounded-md border border-border bg-card p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cancellation Reason *</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason((v as CancellationReason) ?? "PRODUCTION_DEFECT")}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  {CANCELLATION_REASONS.find((r) => r.value === reason)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="font-medium">{r.label}</span> —{" "}
                    <span className="text-muted-foreground text-xs">{r.hint}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Line 2 capper cracked neck"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={parsedCodes.length === 0 || cancelMutation.isPending}
            onClick={submit}
          >
            {cancelMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Cancel {parsedCodes.length} Code(s)
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Production Dialog (Turns assigned identities into physical stock)
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmProductionDialog({
  order,
  onOpenChange,
}: {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: locations } = useLocations();
  const confirmMutation = useConfirmProduced();

  const [count, setCount] = useState("");
  const [locationId, setLocationId] = useState("");

  const submit = async () => {
    if (!order) return;
    const parsedCount = count ? Number(count) : undefined;
    const parsedLocation = locationId ? Number(locationId) : undefined;

    await confirmMutation.mutateAsync({
      productionOrderId: order.id,
      count: parsedCount,
      locationId: parsedLocation,
    });
    setCount("");
    setLocationId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Production Output</DialogTitle>
          <DialogDescription>
            Only after the lot is <strong>Approved</strong> in quality control.
            Moves assigned codes into stock as manufactured units.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1 text-xs">
            <span className="font-semibold text-foreground">Order: {order?.orderNumber}</span>
            <p className="text-muted-foreground">{order?.productName} · Planned: {order?.plannedQuantity}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Quantity to Confirm (Optional)</Label>
            <Input
              type="number"
              min={1}
              placeholder={`Auto-derived from assigned codes (e.g. ${order?.plannedQuantity})`}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to confirm all non-cancelled codes assigned to this order.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Destination Storage Location (Optional)</Label>
            <SearchableSelect
              value={locationId}
              onValueChange={setLocationId}
              placeholder="Finished Goods Warehouse / Default"
              searchPlaceholder="Search locations by name or type…"
              allowClear
              items={(locations ?? []).map((loc) => ({
                value: String(loc.id),
                label: loc.name,
                badge: loc.type,
              }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-success text-white hover:bg-success/90"
            disabled={confirmMutation.isPending}
            onClick={submit}
          >
            {confirmMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Confirm & Enter Stock
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Order Dialog
// ─────────────────────────────────────────────────────────────────────────────

function NewOrderDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    productId: number;
    plannedQuantity: number;
    bomId?: number;
    machineId?: number;
    scheduledStartOn?: string;
    scheduledEndOn?: string;
    notes?: string;
  }) => void;
  pending: boolean;
}) {
  const { data: products } = useProducts(0, 200);
  const { data: boms } = useBoms();
  const { data: machines } = useMachines();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [qtyTouched, setQtyTouched] = useState(false);
  const [bomId, setBomId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [notes, setNotes] = useState("");

  const productIdNum = productId ? Number(productId) : undefined;
  const { data: poolsData } = useIdentityPools(productIdNum);

  // Live product-registration check — debounced so it doesn't fire on every
  // keystroke while the quantity field is being filled.
  const today = new Date().toISOString().split("T")[0];
  const debouncedProductId = useDebouncedValue(productId, 300);
  const { data: eligibility, isFetching: eligChecking } = useProductionEligibility(
    {
      productId: debouncedProductId ? Number(debouncedProductId) : undefined,
      quantity: 1, // quantity doesn't affect this check; any positive value works
      date: today,
    },
    { enabled: !!debouncedProductId },
  );
  const productAuthCheck = eligibility?.checks.find(
    (c) => c.code === "PRODUCT_AUTHORIZATION",
  );
  const registrationBlocking =
    eligibility?.blocking === true ||
    (eligibility?.enforcementMode === "STRICT" &&
      productAuthCheck?.status === "FAIL");

  const readyPoolCodes = useMemo(() => {
    const pools = (poolsData?.content ?? []).filter((p) => p.status === "READY");
    return pools.reduce((sum, p) => sum + (p.requestedCount || 0), 0);
  }, [poolsData]);

  const readyPoolCount = useMemo(
    () => (poolsData?.content ?? []).filter((p) => p.status === "READY").length,
    [poolsData],
  );

  // When the selected product's ready-pool total changes — product switched or
  // pools finished generating — suggest that total as the target quantity, but
  // only while the user has not typed their own. Done as a render-time state
  // adjustment for a changed input (the React-recommended replacement for an
  // effect that watched for the pool data to arrive).
  const [seenQuantityHint, setSeenQuantityHint] = useState<{
    productId: string;
    readyPoolCodes: number;
  }>({ productId, readyPoolCodes });
  if (
    !qtyTouched &&
    productId &&
    (productId !== seenQuantityHint.productId ||
      readyPoolCodes !== seenQuantityHint.readyPoolCodes)
  ) {
    setSeenQuantityHint({ productId, readyPoolCodes });
    setQuantity(readyPoolCodes > 0 ? String(readyPoolCodes) : "");
  }

  const matchingBoms = (boms ?? []).filter(
    (bom) => !productId || String(bom.productId) === productId,
  );

  const planned = Number(quantity);
  const overCodes = planned > 0 && readyPoolCodes > 0 && planned > readyPoolCodes;
  const noCodes = productId !== "" && readyPoolCodes === 0;
  const valid = productId !== "" && planned > 0;

  const resetAndClose = (next: boolean) => {
    if (!next) {
      setProductId("");
      setQuantity("");
      setQtyTouched(false);
      setBomId("");
      setMachineId("");
      setNotes("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Log Production Batch</DialogTitle>
          <DialogDescription>
            Target quantity pre-fills from ready code pools for the product — you
            can still edit it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Product *</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v ?? "");
                setQtyTouched(false);
                setQuantity("");
                setBomId("");
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select product being made">
                  {productId
                    ? products?.content.find((x) => String(x.id) === productId)
                        ?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products?.content.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product Registration Status */}
            {debouncedProductId && (
              <ProductRegistrationPill
                checking={eligChecking}
                check={productAuthCheck}
              />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="planned-quantity" className="text-xs font-medium">
                Target quantity *
              </Label>
              <Input
                id="planned-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  setQtyTouched(true);
                  setQuantity(e.target.value);
                }}
                placeholder={
                  readyPoolCodes > 0
                    ? `Suggested ${readyPoolCodes}`
                    : "e.g. 5000"
                }
                className="h-10"
              />
              {productId && readyPoolCodes > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Suggested from {readyPoolCount} ready pool
                  {readyPoolCount === 1 ? "" : "s"}:{" "}
                  <strong>{readyPoolCodes.toLocaleString()}</strong> codes.
                  Editable anytime.
                </p>
              ) : null}
              {noCodes ? (
                <p className="text-[11px] text-amber-700">
                  No ready pools for this product yet.{" "}
                  <Link
                    href={`/dashboard/products/${productId}?tab=identities`}
                    className="font-semibold underline"
                  >
                    Generate codes
                  </Link>{" "}
                  first, or enter a target and assign a pool later.
                </p>
              ) : null}
              {overCodes ? (
                <p className="text-[11px] text-amber-700">
                  Target ({planned}) is higher than ready codes ({readyPoolCodes}
                  ). Generate more labels before you confirm output, or lower the
                  target.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Machine / Line (Optional)
              </Label>
              <Select
                value={machineId}
                onValueChange={(v) => setMachineId(v ?? "")}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Any machine">
                    {machineId
                      ? machines?.find((x) => String(x.id) === machineId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {machines?.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.code} — {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Bill of Materials (Optional)
            </Label>
            <Select value={bomId} onValueChange={(v) => setBomId(v ?? "")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="No BOM — standard formulation">
                  {bomId
                    ? matchingBoms.find((x) => String(x.id) === bomId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {matchingBoms.map((bom) => (
                  <SelectItem key={bom.id} value={String(bom.id)}>
                    {bom.name} v{bom.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="order-notes" className="text-xs font-medium">
              Notes (Optional)
            </Label>
            <Input
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10"
              placeholder="e.g. Morning batch run"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => resetAndClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid || pending || registrationBlocking}
            onClick={() =>
              onSubmit({
                productId: Number(productId),
                plannedQuantity: Number(quantity),
                bomId: bomId ? Number(bomId) : undefined,
                machineId: machineId ? Number(machineId) : undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            {pending ? "Saving..." : "Log Batch"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Complete Dialog
// ─────────────────────────────────────────────────────────────────────────────

function CompleteDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { producedQuantity: number; expiresOn?: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [quantity, setQuantity] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  // Prefer what was already confirmed into stock over the planned target, so
  // completing after Confirm Output does not silently inflate 45 back to 50.
  const defaultProduced =
    (order?.producedQuantity ?? 0) > 0
      ? order!.producedQuantity
      : (order?.plannedQuantity ?? 0);
  const value = quantity === "" ? String(defaultProduced || "") : quantity;

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) {
          setQuantity("");
          setExpiresOn("");
        }
        onOpenChange(open);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Complete {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            Closes the production run and moves the lot to PENDING_QC. If you
            already confirmed output into stock, keep the produced quantity as
            that confirmed figure — do not reset it to the planned target.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="produced-quantity">Produced quantity</Label>
            <Input
              id="produced-quantity"
              type="number"
              min={1}
              value={value}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Planned: {order?.plannedQuantity}
              {(order?.producedQuantity ?? 0) > 0
                ? ` · Already in stock: ${order?.producedQuantity}`
                : ""}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires-on">Expires on</Label>
            <Input
              id="expires-on"
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={Number(value) <= 0 || pending}
            onClick={() =>
              onSubmit({
                producedQuantity: Number(value),
                expiresOn: expiresOn || undefined,
              })
            }
          >
            {pending ? "Completing..." : "Complete run"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Amend Dialog
// ─────────────────────────────────────────────────────────────────────────────

function AmendDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { newQuantity: number; reason: string }) => void;
  pending: boolean;
}) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) {
          setQuantity("");
          setReason("");
        }
        onOpenChange(open);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Amend {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            Appends quantity correction to the audit trail with your reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-quantity">Corrected quantity</Label>
            <Input
              id="new-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={String(order?.producedQuantity ?? "")}
            />
            <p className="text-xs text-muted-foreground">
              Currently recorded: {order?.producedQuantity}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amend-reason">Reason</Label>
            <Input
              id="amend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Recount after QC verification"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={Number(quantity) <= 0 || reason.trim().length === 0 || pending}
            onClick={() => onSubmit({ newQuantity: Number(quantity), reason: reason.trim() })}
          >
            {pending ? "Amending..." : "Amend quantity"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Registration Status Pill
// Shown inside NewOrderDialog directly below the product selector.
// ─────────────────────────────────────────────────────────────────────────────

type EligCheck = { status: string; message: string; remedy?: { label: string; href: string } };

function ProductRegistrationPill({
  checking,
  check,
}: {
  checking: boolean;
  check: EligCheck | undefined;
}) {
  if (checking || !check) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin shrink-0" />
        Checking product registration…
      </div>
    );
  }

  if (check.status === "NOT_APPLICABLE") return null;

  const isPASS = check.status === "PASS";
  const isWARN = check.status === "WARN";
  const isFAIL = check.status === "FAIL";

  return (
    <div
      className={[
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        isPASS && "border-success/30 bg-success/5 text-success-foreground",
        isWARN && "border-amber-300 bg-amber-50 text-amber-800",
        isFAIL && "border-danger/30 bg-danger/5 text-danger",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isPASS && <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />}
      {isWARN && <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />}
      {isFAIL && <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-danger" />}
      <div className="min-w-0">
        <p className="font-medium leading-snug">
          {isPASS && "Product registration active"}
          {isWARN && "Product registration suspended"}
          {isFAIL && "No product registration"}
        </p>
        <p className="mt-0.5 leading-snug opacity-80">{check.message}</p>
        {check.remedy && (
          <Link
            href={check.remedy.href}
            className="mt-1 inline-block font-semibold underline"
          >
            {check.remedy.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
