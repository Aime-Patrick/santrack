"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Factory,
  ShieldCheck,
  PackagePlus,
  ScanLine,
  Plus,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Play,
  Boxes,
  ArrowRight,
  X,
  Printer,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import { useCapabilities } from "@/hooks/permissions";
import {
  useProductionOrders,
  useCreateProductionOrder,
  useStartProduction,
  useCompleteProduction,
  useCreateInspection,
  useInspectionEligibility,
  useCloseProduction,
} from "@/hooks/manufacturing";
import { useProducts } from "@/hooks/products";
import {
  useIdentityPools,
  useAssignIdentities,
  useConfirmProduced,
  useRequestIdentities,
} from "@/hooks/identity-pools";
import { useRegisterPackage, useItems } from "@/hooks/items";
import { useLocations } from "@/hooks/locations";
import { useBatches } from "@/hooks/batches";
import type { ProductionOrder } from "@/services/manufacturing.service";
import type { PackageType } from "@/services/item.service";

// ─── Stage definitions ────────────────────────────────────────────────────────

type Stage =
  | "PLANNED"
  | "IN_PROGRESS"
  | "PENDING_QC"
  | "APPROVED"
  | "PACKAGING"
  | "DONE";

type StageFilter = "all" | "needs_action" | Stage;

function deriveStage(order: ProductionOrder, hasPackage = false): Stage {
  if (order.status === "PLANNED") return "PLANNED";
  if (order.status === "IN_PROGRESS") return "IN_PROGRESS";
  if (order.status === "COMPLETED") {
    if (order.batchStatus === "PENDING_QC" || order.batchStatus === "REJECTED") return "PENDING_QC";
    if (order.batchStatus === "APPROVED") return hasPackage ? "PACKAGING" : "APPROVED";
    return "DONE";
  }
  return "DONE";
}

const STAGE_META: Record<Stage, { label: string; color: string; dot: string }> = {
  PLANNED: { label: "Planned", color: "text-muted-foreground", dot: "bg-border" },
  IN_PROGRESS: { label: "Running", color: "text-primary", dot: "bg-primary" },
  PENDING_QC: { label: "Awaiting QC", color: "text-warning-foreground", dot: "bg-warning" },
  APPROVED: { label: "Ready to pack", color: "text-success", dot: "bg-success" },
  PACKAGING: { label: "Pack & label", color: "text-primary", dot: "bg-primary" },
  DONE: { label: "Done", color: "text-faint", dot: "bg-border" },
};

/** Urgent work first — done lots sink to the bottom. */
const STAGE_SORT: Record<Stage, number> = {
  PENDING_QC: 0,
  APPROVED: 1,
  PACKAGING: 2,
  IN_PROGRESS: 3,
  PLANNED: 4,
  DONE: 5,
};

const PACKAGE_TYPES: PackageType[] = ["BOX", "CARTON", "CASE", "SACK", "CRATE", "PALLET"];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ManufacturingPipelinePage() {
  const permissions = useCapabilities();
  const canRun = permissions.can("RUN_PRODUCTION");
  const canQc = permissions.can("PERFORM_QC");
  const canPack = permissions.can("HANDLE_PACKAGING");
  const canMintCodes = permissions.can("REGISTER_IDENTITY");

  const { data: ordersData, isLoading } = useProductionOrders(undefined, 0, 100);
  const { data: productsData } = useProducts(0, 200);
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const { data: packagesData } = useItems({ kind: "PACKAGE", topLevel: true });

  const createOrder = useCreateProductionOrder();
  const startProd = useStartProduction();
  const completeProd = useCompleteProduction();
  const confirmProd = useConfirmProduced();
  const closeProd = useCloseProduction();
  const createInspection = useCreateInspection();
  const assignIdentities = useAssignIdentities();
  const registerPackage = useRegisterPackage();
  const requestIdentities = useRequestIdentities();

  const orders = ordersData?.content ?? [];

  const packageByBatch = (packagesData?.content ?? []).reduce<
    Record<number, { qrCode: string; code: string }>
  >((acc, pkg) => {
    if (pkg.batchId && !acc[pkg.batchId]) {
      acc[pkg.batchId] = { qrCode: pkg.qrCode, code: pkg.code };
    }
    return acc;
  }, {});

  const [stageFilter, setStageFilter] = useState<StageFilter>("needs_action");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [completing, setCompleting] = useState<ProductionOrder | null>(null);
  const [inspecting, setInspecting] = useState<ProductionOrder | null>(null);
  const [poolDialog, setPoolDialog] = useState<ProductionOrder | null>(null);
  const [generatePool, setGeneratePool] = useState<ProductionOrder | null>(null);
  const [pkgDialog, setPkgDialog] = useState<ProductionOrder | null>(null);

  const enriched = useMemo(
    () =>
      orders.map((order) => {
        const pkg = order.batchId ? packageByBatch[order.batchId] : undefined;
        const stage = deriveStage(order, !!pkg);
        return { order, stage, pkg };
      }),
    [orders, packageByBatch],
  );

  const running = enriched.filter((row) => row.stage === "IN_PROGRESS").length;
  const awaitingQC = enriched.filter((row) => row.stage === "PENDING_QC").length;
  const readyPack = enriched.filter(
    (row) => row.stage === "APPROVED" || row.stage === "PACKAGING",
  ).length;

  const visible = useMemo(() => {
    const filtered = enriched.filter((row) => {
      if (stageFilter === "all") return true;
      if (stageFilter === "needs_action") return row.stage !== "DONE";
      if (stageFilter === "APPROVED") {
        return row.stage === "APPROVED" || row.stage === "PACKAGING";
      }
      return row.stage === stageFilter;
    });
    return [...filtered].sort(
      (a, b) => STAGE_SORT[a.stage] - STAGE_SORT[b.stage] || b.order.id - a.order.id,
    );
  }, [enriched, stageFilter]);

  const doneCount = enriched.filter((row) => row.stage === "DONE").length;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Manufacturing</h1>
            <p className="text-sm text-muted-foreground">
              One place for each lot: run → QC → pack → labels.
            </p>
          </div>
        </div>
        {canRun && (
          <Button size="sm" onClick={() => setNewOrderOpen(true)}>
            <Plus className="mr-1.5 size-4" /> New production run
          </Button>
        )}
      </div>

      {/* ── Status strip (click to filter) ── */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StripTile
            icon={<Play className="size-4" />}
            label="Running"
            value={running}
            bg="bg-primary"
            active={stageFilter === "IN_PROGRESS"}
            onClick={() =>
              setStageFilter((current) => (current === "IN_PROGRESS" ? "needs_action" : "IN_PROGRESS"))
            }
          />
          <StripTile
            icon={<ShieldCheck className="size-4" />}
            label="Awaiting QC"
            value={awaitingQC}
            bg="bg-warning text-foreground"
            alert={awaitingQC > 0}
            active={stageFilter === "PENDING_QC"}
            onClick={() =>
              setStageFilter((current) => (current === "PENDING_QC" ? "needs_action" : "PENDING_QC"))
            }
          />
          <StripTile
            icon={<PackagePlus className="size-4" />}
            label="Ready to pack"
            value={readyPack}
            bg="bg-success"
            alert={readyPack > 0}
            active={stageFilter === "APPROVED" || stageFilter === "PACKAGING"}
            onClick={() =>
              setStageFilter((current) =>
                current === "APPROVED" || current === "PACKAGING"
                  ? "needs_action"
                  : "APPROVED",
              )
            }
          />
        </div>
      )}

      {/* ── List controls ── */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {stageFilter === "needs_action" &&
              `Showing ${visible.length} active ${visible.length === 1 ? "lot" : "lots"}`}
            {stageFilter === "all" && `Showing all ${visible.length} lots`}
            {stageFilter === "DONE" && `Showing ${visible.length} finished lots`}
            {stageFilter === "IN_PROGRESS" && `Showing ${visible.length} running`}
            {stageFilter === "PENDING_QC" && `Showing ${visible.length} awaiting QC`}
            {(stageFilter === "APPROVED" || stageFilter === "PACKAGING") &&
              `Showing ${visible.length} ready to pack`}
            {stageFilter === "PLANNED" && `Showing ${visible.length} planned`}
          </p>
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <FilterChip
              label="Needs action"
              active={stageFilter === "needs_action"}
              onClick={() => setStageFilter("needs_action")}
            />
            <FilterChip
              label={`Done${doneCount > 0 ? ` (${doneCount})` : ""}`}
              active={stageFilter === "DONE"}
              onClick={() => setStageFilter("DONE")}
            />
            <FilterChip
              label="All"
              active={stageFilter === "all"}
              onClick={() => setStageFilter("all")}
            />
          </div>
        </div>
      )}

      {/* ── Lot pipeline ── */}
      {orders.length === 0 ? (
        <EmptyState onNew={canRun ? () => setNewOrderOpen(true) : undefined} />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-foreground">Nothing in this view</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Switch to All or Needs action to see other lots.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setStageFilter("needs_action")}
          >
            Show active lots
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(({ order, stage, pkg }) => {
            const batch = batches?.find((b) => b.id === order.batchId);
            return (
              <LotRow
                key={order.id}
                order={order}
                stage={stage}
                batch={batch}
                packageQrCode={pkg?.qrCode}
                packageCode={pkg?.code}
                canRun={canRun}
                canQc={canQc}
                canPack={canPack}
                canMintCodes={canMintCodes}
                onStart={() => startProd.mutate(order.id)}
                onComplete={() => setCompleting(order)}
                onInspect={() => setInspecting(order)}
                onAssignPool={() => setPoolDialog(order)}
                onRegisterPackage={() => setPkgDialog(order)}
                startPending={startProd.isPending}
              />
            );
          })}
        </div>
      )}

      {/* ── Related work (not competing hubs) ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <span className="mr-0.5 text-[11px] font-medium text-faint">Also</span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          render={<Link href="/dashboard/manufacturing/trace" />}
          nativeButton={false}
        >
          <ScanLine className="size-3.5" /> Scan & pack
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          render={<Link href="/dashboard/labels/print" />}
          nativeButton={false}
        >
          <Printer className="size-3.5" /> Print labels
        </Button>
        {(canRun || permissions.can("MANAGE_CATALOG")) && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
            render={<Link href="/dashboard/manufacturing/resources" />}
            nativeButton={false}
          >
            <Wrench className="size-3.5" /> Machines & materials
          </Button>
        )}
        {canQc && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
            render={<Link href="/dashboard/manufacturing/quality" />}
            nativeButton={false}
          >
            <ShieldCheck className="size-3.5" /> QC history
          </Button>
        )}
      </div>

      {/* ── Dialogs ── */}
      <NewOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        products={productsData?.content ?? []}
        onSubmit={(productId, qty) =>
          createOrder.mutate(
            { productId, plannedQuantity: qty },
            {
              onSuccess: (order) => {
                setNewOrderOpen(false);
                startProd.mutate(order.id);
              },
            },
          )
        }
        pending={createOrder.isPending || startProd.isPending}
      />

      <CompleteDialog
        order={completing}
        onOpenChange={(open) => !open && setCompleting(null)}
        onSubmit={async (producedQty, expiresOn, locationId) => {
          if (!completing) return;
          await completeProd.mutateAsync({
            id: completing.id,
            data: { producedQuantity: producedQty, expiresOn: expiresOn || undefined },
          });
          await confirmProd.mutateAsync({
            productionOrderId: completing.id,
            locationId: locationId || undefined,
          });
          await closeProd.mutateAsync(completing.id);
          setCompleting(null);
        }}
        pending={completeProd.isPending || confirmProd.isPending || closeProd.isPending}
      />

      <InspectDialog
        order={inspecting}
        onOpenChange={(open) => !open && setInspecting(null)}
        onSubmit={(result, notes) =>
          inspecting?.batchId &&
          createInspection.mutate(
            { batchId: inspecting.batchId, result, notes },
            { onSuccess: () => setInspecting(null) },
          )
        }
        pending={createInspection.isPending}
      />

      <AssignPoolDialog
        order={poolDialog}
        onOpenChange={(open) => !open && setPoolDialog(null)}
        onGenerate={() => {
          const order = poolDialog;
          setPoolDialog(null);
          if (order) setGeneratePool(order);
        }}
        canMintCodes={canMintCodes}
        onSubmit={(poolId, count) =>
          poolDialog &&
          assignIdentities.mutate(
            { poolId, productionOrderId: poolDialog.id, count },
            { onSuccess: () => setPoolDialog(null) },
          )
        }
        pending={assignIdentities.isPending}
      />

      <RegisterPackageDialog
        order={pkgDialog}
        onOpenChange={(open) => !open && setPkgDialog(null)}
        locations={locations ?? []}
        onSubmit={(packageType, locationId) =>
          pkgDialog?.batchId &&
          registerPackage.mutate(
            {
              packageType,
              batchId: pkgDialog.batchId,
              productId: pkgDialog.productId,
              locationId,
            },
            { onSuccess: () => setPkgDialog(null) },
          )
        }
        pending={registerPackage.isPending}
      />

      <GeneratePoolDialog
        order={generatePool}
        onOpenChange={(open) => !open && setGeneratePool(null)}
        pending={requestIdentities.isPending}
        onSubmit={(productId, count) =>
          requestIdentities.mutate(
            { productId, count },
            {
              onSuccess: () => {
                const order = generatePool;
                setGeneratePool(null);
                setTimeout(() => {
                  if (order) setPoolDialog(order);
                }, 900);
              },
            },
          )
        }
      />
    </div>
  );
}

// ─── Lot row ─────────────────────────────────────────────────────────────────

function LotRow({
  order,
  stage,
  batch,
  packageQrCode,
  packageCode,
  canRun,
  canQc,
  canPack,
  canMintCodes,
  onStart,
  onComplete,
  onInspect,
  onAssignPool,
  onRegisterPackage,
  startPending,
}: {
  order: ProductionOrder;
  stage: Stage;
  batch: import("@/services/batch.service").Batch | undefined;
  packageQrCode?: string;
  packageCode?: string;
  canRun: boolean;
  canQc: boolean;
  canPack: boolean;
  canMintCodes: boolean;
  onStart: () => void;
  onComplete: () => void;
  onInspect: () => void;
  onAssignPool: () => void;
  onRegisterPackage: () => void;
  startPending: boolean;
}) {
  const meta = STAGE_META[stage];
  const isRejected = order.batchStatus === "REJECTED";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors",
        stage === "PENDING_QC" && "border-warning/40 bg-warning/5",
        stage === "APPROVED" && "border-success/40 bg-success/5",
        isRejected && "border-danger/30 bg-danger/5",
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">
            {order.batchCode ?? order.orderNumber}
          </span>
          <span className="max-w-[200px] truncate text-sm text-muted-foreground">
            {order.productName}
          </span>
          {isRejected && (
            <Badge variant="outline" className="border-transparent bg-danger text-[10px] text-white">
              QC Rejected
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-faint">
          <span className={meta.color}>{meta.label}</span>
          <span>
            {order.producedQuantity > 0
              ? `${order.producedQuantity} produced`
              : `${order.plannedQuantity} planned`}
          </span>
          {batch?.expiresOn && <span>Exp {new Date(batch.expiresOn).toLocaleDateString()}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {stage === "PLANNED" && canRun && (
          <Button
            size="sm"
            variant="outline"
            onClick={onStart}
            disabled={startPending}
            className="h-8 text-xs"
          >
            <Play className="mr-1.5 size-3" /> Start run
          </Button>
        )}

        {stage === "IN_PROGRESS" && canRun && (
          <>
            {(canMintCodes || canRun) && (
              <Button size="sm" variant="outline" onClick={onAssignPool} className="h-8 text-xs">
                <QrCode className="mr-1.5 size-3" /> Link codes
              </Button>
            )}
            <Button
              size="sm"
              onClick={onComplete}
              className="h-8 bg-success text-xs text-white hover:bg-success/90"
            >
              <CheckCircle className="mr-1.5 size-3" /> Finish run
            </Button>
          </>
        )}

        {stage === "PENDING_QC" && canQc && (
          <Button
            size="sm"
            onClick={onInspect}
            className="h-8 bg-warning text-xs font-semibold text-foreground hover:bg-warning/90"
          >
            <ShieldCheck className="mr-1.5 size-3" /> Record verdict
          </Button>
        )}

        {isRejected && canQc && (
          <Button
            size="sm"
            variant="outline"
            onClick={onInspect}
            className="h-8 border-danger/40 text-xs text-danger hover:bg-danger/10"
          >
            <ShieldCheck className="mr-1.5 size-3" /> Re-inspect
          </Button>
        )}

        {stage === "APPROVED" && canPack && (
          <Button
            size="sm"
            onClick={onRegisterPackage}
            className="h-8 bg-success text-xs text-white hover:bg-success/90"
          >
            <PackagePlus className="mr-1.5 size-3" /> Register package
          </Button>
        )}

        {stage === "PACKAGING" && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/labels/print"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Printer className="size-3" /> Print labels
            </Link>
            <Link
              href={`/dashboard/manufacturing/trace?qr=${packageQrCode ?? ""}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90"
            >
              <ScanLine className="size-3" /> Scan & pack
              {packageCode ? ` · ${packageCode}` : ""}
            </Link>
          </div>
        )}

        {stage === "DONE" && (
          <Link
            href={`/dashboard/manufacturing/trace?batchId=${order.batchId}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            <ScanLine className="size-3" /> Trace
          </Link>
        )}

        {/* Read-only hint when the user can see the lot but not act */}
        {stage === "PENDING_QC" && !canQc && (
          <span className="text-xs text-muted-foreground">Waiting on quality</span>
        )}
        {stage === "APPROVED" && !canPack && (
          <span className="text-xs text-muted-foreground">Waiting on packaging</span>
        )}
        {stage === "PLANNED" && !canRun && (
          <span className="text-xs text-muted-foreground">Waiting to start</span>
        )}
      </div>
    </div>
  );
}

// ─── Strip / filter chips ─────────────────────────────────────────────────────

function StripTile({
  icon,
  label,
  value,
  bg,
  alert,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  alert?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors",
        onClick && "hover:border-primary/30 hover:bg-muted/30",
        active && "border-primary/40 ring-1 ring-primary/20",
        alert && value > 0 && "ring-1 ring-inset ring-current/20",
      )}
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-white", bg)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ onNew }: { onNew?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Boxes className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No production runs yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a run and each lot will show here with the next step.
        </p>
      </div>
      {onNew && (
        <Button onClick={onNew}>
          <Plus className="mr-1.5 size-4" /> Start first run
        </Button>
      )}
    </div>
  );
}

// ─── New order dialog ─────────────────────────────────────────────────────────

function NewOrderDialog({
  open,
  onOpenChange,
  products,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Array<{ id: number; name: string; sku: string | null }>;
  onSubmit: (productId: number, qty: number) => void;
  pending: boolean;
}) {
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");

  function reset() {
    setProductId("");
    setQty("");
  }

  const items = products.map((p) => ({
    value: String(p.id),
    label: p.name,
    sublabel: p.sku ?? undefined,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>New production run</DialogTitle>
          <DialogDescription>
            Pick a product and how many units you plan to make. The run starts immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Product</Label>
            <SearchableSelect
              items={items}
              value={productId}
              onValueChange={setProductId}
              placeholder="Search products…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Planned quantity</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 500"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!productId || !qty || Number(qty) < 1 || pending}
            onClick={() => onSubmit(Number(productId), Number(qty))}
          >
            {pending ? "Starting…" : "Start run"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Complete dialog ──────────────────────────────────────────────────────────

function CompleteDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (
    producedQty: number,
    expiresOn: string,
    locationId: number | undefined,
  ) => Promise<void>;
  pending: boolean;
}) {
  const [qty, setQty] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [locationId, setLocationId] = useState("");
  const { data: locations } = useLocations();

  function reset() {
    setQty("");
    setExpiresOn("");
    setLocationId("");
  }
  const open = !!order;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finish run — {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            Records output and moves linked QR codes into stock. Link codes first if you have not
            already — the finish step needs them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Units produced</Label>
            <Input
              type="number"
              min={1}
              placeholder={String(order?.plannedQuantity ?? "")}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            {order && <p className="text-xs text-faint">Planned: {order.plannedQuantity}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>
              Expiry date <span className="font-normal text-faint">(required for food/pharma)</span>
            </Label>
            <Input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Storage location <span className="font-normal text-faint">(optional)</span>
            </Label>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Where are units stored?">
                  {locationId
                    ? locations?.find((l) => String(l.id) === locationId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(locations ?? []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                    {l.code ? ` (${l.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!qty || Number(qty) < 1 || pending}
            onClick={() =>
              void onSubmit(Number(qty), expiresOn, locationId ? Number(locationId) : undefined)
            }
            className="bg-success text-white hover:bg-success/90"
          >
            {pending ? "Finishing…" : "Complete run"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Inspect dialog ───────────────────────────────────────────────────────────

const VERDICTS = [
  { value: "APPROVED", label: "Approved", hint: "Lot passes — ready for packaging." },
  { value: "REJECTED", label: "Rejected", hint: "Lot fails — needs rework or disposal." },
  { value: "REWORK", label: "Rework", hint: "Send back for correction, re-inspect after." },
  { value: "QUARANTINE", label: "Quarantine", hint: "Hold while investigation is ongoing." },
];

function InspectDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (result: string, notes: string) => void;
  pending: boolean;
}) {
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const open = !!order;

  const { data: eligibility } = useInspectionEligibility(
    open ? (order?.batchId ?? null) : null,
  );
  const blocked = eligibility != null && !eligibility.allowed;

  function reset() {
    setResult("");
    setNotes("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quality verdict — {order?.batchCode ?? order?.orderNumber}</DialogTitle>
          <DialogDescription>
            {order?.productName} · {order?.producedQuantity} units
          </DialogDescription>
        </DialogHeader>

        {blocked && eligibility && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            <X className="mt-0.5 size-4 shrink-0" />
            <span>
              {(eligibility as { reason?: string }).reason ??
                "This lot cannot be inspected right now."}
            </span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            {VERDICTS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setResult(v.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  result === v.value
                    ? v.value === "APPROVED"
                      ? "border-success bg-success/10 ring-1 ring-success"
                      : v.value === "REJECTED"
                        ? "border-danger bg-danger/5 ring-1 ring-danger"
                        : "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-foreground/20",
                )}
              >
                <p className="text-sm font-semibold text-foreground">{v.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{v.hint}</p>
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>
              Notes <span className="font-normal text-faint">(optional)</span>
            </Label>
            <Input
              placeholder="Any observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!result || pending || blocked}
            onClick={() => onSubmit(result, notes)}
            className={cn(
              result === "APPROVED" && "bg-success text-white hover:bg-success/90",
              result === "REJECTED" && "bg-danger text-white hover:bg-danger/90",
            )}
          >
            {pending ? "Recording…" : "Record verdict"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Assign pool dialog ───────────────────────────────────────────────────────

function AssignPoolDialog({
  order,
  onOpenChange,
  onSubmit,
  onGenerate,
  canMintCodes,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (poolId: number, count: number | undefined) => void;
  onGenerate: () => void;
  canMintCodes: boolean;
  pending: boolean;
}) {
  const open = !!order;
  const { data: poolsData } = useIdentityPools(open ? order?.productId : undefined);
  const [poolId, setPoolId] = useState("");
  const [count, setCount] = useState("");

  const pools = (poolsData?.content ?? []).filter((p) => p.status === "READY");
  const selected = pools.find((p) => String(p.id) === poolId);
  const planned = order?.plannedQuantity ?? 0;
  const free = selected?.availableCount ?? selected?.requestedCount ?? 0;
  const suggested = selected ? Math.max(planned, 1) : planned;

  function reset() {
    setPoolId("");
    setCount("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link code pool — {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            Claim QR codes for this run. If the pool is short, SanTrack mints the
            extra labels automatically. Stock is created only when you finish the run.
          </DialogDescription>
        </DialogHeader>

        {pools.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
              <div>
                <p className="font-medium text-warning-foreground">No ready pools for this product</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generate codes here, or open{" "}
                  <Link
                    href={`/dashboard/products/${order?.productId}?tab=labels`}
                    className="text-primary underline"
                  >
                    Products → Label pools
                  </Link>
                  .
                </p>
              </div>
            </div>
            {canMintCodes && (
              <Button size="sm" onClick={onGenerate} className="w-full">
                <QrCode className="mr-1.5 size-3.5" /> Generate codes for this run
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Code pool</Label>
              <Select
                value={poolId}
                onValueChange={(v) => {
                  setPoolId(v ?? "");
                  setCount("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pool">
                    {selected
                      ? `Pool #${selected.id} — ${free.toLocaleString()} free / ${selected.requestedCount.toLocaleString()} minted`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {pools.map((p) => {
                    const left = p.availableCount ?? 0;
                    return (
                      <SelectItem key={p.id} value={String(p.id)}>
                        Pool #{p.id} — {left.toLocaleString()} free
                        {left === 0 ? " (will mint more)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Codes to claim</Label>
              <Input
                type="number"
                min={1}
                placeholder={String(suggested || 1)}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <p className="text-xs text-faint">
                Leave blank to claim {suggested.toLocaleString()} for this run
                {free < suggested
                  ? ` (pool has ${free.toLocaleString()} free — extras will be minted)`
                  : ""}
                .
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!poolId || pending}
            onClick={() =>
              onSubmit(Number(poolId), count ? Number(count) : suggested || undefined)
            }
          >
            {pending ? "Linking…" : "Link pool"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Register package dialog ──────────────────────────────────────────────────

function RegisterPackageDialog({
  order,
  onOpenChange,
  locations,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (v: boolean) => void;
  locations: Array<{ id: number; name: string; code?: string | null }>;
  onSubmit: (packageType: PackageType, locationId: number | undefined) => void;
  pending: boolean;
}) {
  const [pkgType, setPkgType] = useState<PackageType | "">("");
  const [locationId, setLocationId] = useState("");
  const open = !!order;

  function reset() {
    setPkgType("");
    setLocationId("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register package — {order?.batchCode}</DialogTitle>
          <DialogDescription>
            Create an empty container for this approved lot. Next: print labels, then scan units in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Package type</Label>
            <Select value={pkgType} onValueChange={(v) => setPkgType(v as PackageType)}>
              <SelectTrigger>
                <SelectValue placeholder="BOX, CARTON, PALLET…">
                  {pkgType ? pkgType.charAt(0) + pkgType.slice(1).toLowerCase() : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              Storage location <span className="font-normal text-faint">(optional)</span>
            </Label>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a bay or shelf">
                  {locationId
                    ? locations.find((l) => String(l.id) === locationId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                    {l.code ? ` (${l.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <ArrowRight className="size-3.5 shrink-0" />
            After this: print labels, then scan & pack on Trace.
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!pkgType || pending}
            onClick={() =>
              onSubmit(pkgType as PackageType, locationId ? Number(locationId) : undefined)
            }
            className="bg-success text-white hover:bg-success/90"
          >
            {pending ? "Registering…" : "Register package"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── Generate pool dialog ─────────────────────────────────────────────────────

function GeneratePoolDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: ProductionOrder | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (productId: number, count: number) => void;
  pending: boolean;
}) {
  const [count, setCount] = useState("");
  const open = !!order;
  const suggested = order?.plannedQuantity ?? 0;

  function reset() {
    setCount("");
  }

  const qty = count ? Number(count) : suggested;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate QR codes — {order?.productName}</DialogTitle>
          <DialogDescription>
            Mint unique QR codes for this run (one per unit). After generating, link the pool to
            this order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>How many codes</Label>
            <Input
              type="number"
              min={1}
              placeholder={String(suggested || "e.g. 500")}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            {suggested > 0 && (
              <p className="text-xs text-faint">
                Planned quantity: {suggested} — matching that amount is typical.
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Codes are labels, not stock. Nothing enters inventory until the run is finished.
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={qty < 1 || pending || !order}
            onClick={() => order && onSubmit(order.productId, qty)}
          >
            {pending ? "Generating…" : `Generate ${qty > 0 ? qty.toLocaleString() : ""} codes`}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
