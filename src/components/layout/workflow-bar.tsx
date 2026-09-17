"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Factory } from "lucide-react";
import { useProductionOrders } from "@/hooks/manufacturing";
import { useItems } from "@/hooks/items";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

// ── Stage derivation ──────────────────────────────────────────────────────────

type BarStage = "running" | "pending_qc" | "approved" | "packaging";

interface ActiveLot {
  stage: BarStage;
  label: string;
  batchCode: string;
  count: number;
  href: string;
}

function pickMostUrgent(lots: ActiveLot[]): ActiveLot | null {
  const priority: BarStage[] = ["pending_qc", "approved", "packaging", "running"];
  for (const stage of priority) {
    const found = lots.find((l) => l.stage === stage);
    if (found) return found;
  }
  return null;
}

const STAGE_COPY: Record<
  BarStage,
  { dot: string; text: string; action: string }
> = {
  pending_qc: {
    dot: "bg-warning",
    text: "awaiting QC verdict",
    action: "Record verdict",
  },
  approved: {
    dot: "bg-success",
    text: "approved — register a package",
    action: "Register package",
  },
  packaging: {
    dot: "bg-primary",
    text: "package ready — print labels & pack",
    action: "Print & pack",
  },
  running: {
    dot: "bg-primary animate-pulse",
    text: "production in progress",
    action: "View run",
  },
};

const PIPELINE = "/dashboard/manufacturing";
const QUALITY = "/dashboard/manufacturing/quality";
const SUPPRESS_ON = [PIPELINE];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Manufacturer pipeline nudge. Only surfaces stages the signed-in role can act
 * on — Quality Officers see pending QC, not packaging CTAs they cannot run.
 */
export function WorkflowBar() {
  const pathname = usePathname();
  const permissions = useCapabilities();
  const { data: user } = useCurrentUser();

  const canRun = permissions.can("RUN_PRODUCTION");
  const canQc = permissions.can("PERFORM_QC");
  const canPack = permissions.can("HANDLE_PACKAGING");
  const canPrint = permissions.can("PRINT_LABELS");

  const isManufacturer =
    !!user?.organization &&
    user.organization.type !== "REGULATOR" &&
    (canRun || canQc || canPack);

  const suppressed = SUPPRESS_ON.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const { data: ordersData } = useProductionOrders(undefined, 0, 100);
  // Fetch registered packages so we can detect the PACKAGING stage
  const { data: packagesData } = useItems({ kind: "PACKAGE", topLevel: true });

  const orders = ordersData?.content ?? [];

  if (!isManufacturer || suppressed || orders.length === 0) return null;

  // batchId → package exists
  const packagedBatchIds = new Set(
    (packagesData?.content ?? [])
      .filter((p) => p.batchId != null)
      .map((p) => p.batchId as number),
  );

  const lots: ActiveLot[] = [];

  const pendingQC = orders.filter(
    (o) => o.batchStatus === "PENDING_QC" || o.batchStatus === "REJECTED",
  );
  // APPROVED lots split by whether a package already exists
  const approvedOrders = orders.filter(
    (o) => o.batchStatus === "APPROVED" && o.status === "COMPLETED",
  );
  const packagingOrders = approvedOrders.filter(
    (o) => o.batchId != null && packagedBatchIds.has(o.batchId),
  );
  const readyToPackOrders = approvedOrders.filter(
    (o) => !o.batchId || !packagedBatchIds.has(o.batchId),
  );
  const running = orders.filter((o) => o.status === "IN_PROGRESS");

  // Only nudge actions this role can actually perform.
  if (canQc && pendingQC.length > 0) {
    lots.push({
      stage: "pending_qc",
      label: pendingQC[0].productName,
      batchCode: pendingQC[0].batchCode ?? pendingQC[0].orderNumber,
      count: pendingQC.length,
      href: QUALITY,
    });
  }
  if (canPack && readyToPackOrders.length > 0) {
    lots.push({
      stage: "approved",
      label: readyToPackOrders[0].productName,
      batchCode: readyToPackOrders[0].batchCode ?? readyToPackOrders[0].orderNumber,
      count: readyToPackOrders.length,
      href: PIPELINE,
    });
  }
  if ((canPack || canPrint) && packagingOrders.length > 0) {
    lots.push({
      stage: "packaging",
      label: packagingOrders[0].productName,
      batchCode: packagingOrders[0].batchCode ?? packagingOrders[0].orderNumber,
      count: packagingOrders.length,
      href: PIPELINE,
    });
  }
  if (canRun && running.length > 0) {
    lots.push({
      stage: "running",
      label: running[0].productName,
      batchCode: running[0].batchCode ?? running[0].orderNumber,
      count: running.length,
      href: PIPELINE,
    });
  }

  if (lots.length === 0) return null;

  const urgent = pickMostUrgent(lots);
  if (!urgent) return null;

  const copy = STAGE_COPY[urgent.stage];
  const isMultiple = urgent.count > 1;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-muted/40 px-3 py-1.5 md:px-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <Factory className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("size-2 shrink-0 rounded-full", copy.dot)} />
        <p className="truncate text-xs text-foreground">
          <span className="font-semibold">
            {isMultiple ? `${urgent.count} lots` : urgent.label}
          </span>
          <span className="text-muted-foreground"> — {copy.text}</span>
          {isMultiple && (
            <span className="ml-1 text-muted-foreground">
              (incl. {urgent.batchCode})
            </span>
          )}
        </p>
      </div>

      <Link
        href={urgent.href}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        {copy.action}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
