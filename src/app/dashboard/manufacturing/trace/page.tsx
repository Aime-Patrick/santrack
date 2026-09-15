"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Factory,
  MapPin,
  Package,
  PackageOpen,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  Building2,
  Loader2,
  ScanLine,
  Tag,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Beaker,
  Wrench,
  Sparkles,
} from "lucide-react";
import { BatchJourneyView } from "@/components/trace/batch-journey-view";
import { useBatches } from "@/hooks/batches";
import { useCapabilities } from "@/hooks/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { ScanTargetHint } from "@/components/trace/scan-target-hint";
import { ActionBar } from "@/components/trace/action-bar";
import {
  DispatchDialog,
  LifecycleDialog,
  PackDialog,
  PrintLabelDialog,
  RecallDialog,
  RelocateDialog,
  RemoveContentDialog,
  SellDialog,
} from "@/components/trace/action-dialogs";
import { useTraceTimeline, useRefreshTrace } from "@/hooks/trace";
import { useResolveCode } from "@/hooks/scan";
import { getApiErrorMessage } from "@/lib/api";
import {
  useLifecycleAction,
  useOpenPackage,
  usePackItems,
  useRemoveUnit,
} from "@/hooks/items";
import { useDispatchTransfer, useRelocate } from "@/hooks/transfers";
import { useSell } from "@/hooks/sales";
import { useInitiateRecall, useRecallImpact } from "@/hooks/recall";
import { cn } from "@/lib/utils";
import type { LifecycleAction } from "@/services/item.service";
import type { ItemAction } from "@/services/trace.service";

const EVENT_COLORS: Record<string, string> = {
  REGISTERED: "border-transparent bg-success text-white",
  PACKAGED: "border-transparent bg-primary text-white",
  UNIT_REMOVED: "border-transparent bg-warning-foreground text-white",
  DISPATCHED: "border-transparent bg-warning-foreground text-white",
  RECEIVED: "border-transparent bg-success text-white",
  RELOCATED: "border-transparent bg-primary text-white",
  SOLD: "border-transparent bg-primary text-white",
  QC_PASSED: "border-transparent bg-success text-white",
  QC_FAILED: "border-transparent bg-danger text-white",
  QUARANTINED: "border-transparent bg-warning-foreground text-white",
  RELEASED: "border-transparent bg-success text-white",
  RETURNED: "border-transparent bg-warning-foreground text-white",
  RECALLED: "border-transparent bg-danger text-white",
  EXPIRED: "border-transparent bg-danger text-white",
  DAMAGED: "border-transparent bg-danger text-white",
  DESTROYED: "border-transparent bg-danger text-white",
  VERIFIED: "border-transparent bg-primary text-white",
};

const STATUS_TONES: Record<string, string> = {
  ACTIVE: "bg-success text-white border-transparent",
  RESERVED: "bg-primary text-white border-transparent",
  IN_TRANSIT: "bg-warning-foreground text-white border-transparent",
  SOLD: "bg-primary text-white border-transparent",
  RETURNED: "bg-warning-foreground text-white border-transparent",
  QUARANTINED: "bg-warning-foreground text-white border-transparent",
  RECALLED: "bg-danger text-white border-transparent",
  EXPIRED: "bg-danger text-white border-transparent",
  DAMAGED: "bg-danger text-white border-transparent",
  DESTROYED: "bg-danger text-white border-transparent",
};

const LIFECYCLE_ACTIONS: ItemAction[] = [
  "QUARANTINE",
  "RELEASE",
  "RETURN",
  "DAMAGE",
  "EXPIRE",
  "DESTROY",
];

/** Framer-motion variants for staggered results reveal. */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/**
 * Lightweight tab system — replaces @base-ui/react/tabs which crashes under
 * Turbopack with chunk.reason.enqueueModel.
 */
function SimpleTabs({
  tabs,
  defaultValue,
  children,
}: {
  tabs: { value: string; label: string; icon?: React.ComponentType<{ className?: string }>; count?: number }[];
  defaultValue: string;
  children: (active: string) => React.ReactNode;
}) {
  const [active, setActive] = useState(defaultValue);
  return (
    <div>
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActive(tab.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon && <Icon className="size-4" />}
              {tab.label}
              {tab.count != null && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{children(active)}</div>
    </div>
  );
}

export default function ItemConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading scanner…
        </div>
      }
    >
      <ScanAndTraceWorkspace />
    </Suspense>
  );
}

function ScanAndTraceWorkspace() {
  const searchParams = useSearchParams();
  const [traceMode, setTraceMode] = useState<"item" | "batch">(
    searchParams.get("batchId") ? "batch" : "item",
  );
  const [selectedBatchId, setSelectedBatchId] = useState<number>(
    Number(searchParams.get("batchId")) || 0,
  );
  const { data: batches = [] } = useBatches();

  const [activeCode, setActiveCode] = useState(
    searchParams.get("code") ?? searchParams.get("qr") ?? "",
  );
  const [scanNote, setScanNote] = useState<{
    title: string;
    detail: string;
    href?: string;
    hrefLabel?: string;
  } | null>(null);
  const [dialog, setDialog] = useState<ItemAction | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const resolveCode = useResolveCode();

  // Auto-dismiss scan notes after 3 seconds
  useEffect(() => {
    if (!scanNote) return;
    const t = setTimeout(() => setScanNote(null), 3000);
    return () => clearTimeout(t);
  }, [scanNote]);

  const { data: trace, isLoading, error } = useTraceTimeline(activeCode);

  // A failed lookup shows a banner for 3 seconds, then hides. The "show again"
  // for a fresh failure is a state adjustment during render — comparing the
  // current error/code with the one already seen — and only the timed hide
  // runs from the effect, so no synchronous setState happens inside it.
  const [seenError, setSeenError] = useState(error);
  const [seenCode, setSeenCode] = useState(activeCode);
  if (error !== seenError || activeCode !== seenCode) {
    setSeenError(error);
    setSeenCode(activeCode);
    if (error) setErrorDismissed(false);
  }

  // Auto-dismiss the error banner 3 seconds after it appears
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setErrorDismissed(true), 3000);
    return () => clearTimeout(t);
  }, [error, activeCode]);
  const refresh = useRefreshTrace(activeCode);

  // Opening a product's label pools is a producer's job (REGISTER_IDENTITY).
  // Other roles — a regulator scanning during an inspection — get the same
  // explanation without the shortcut into Label Studio.
  const canOpenLabelPools = useCapabilities().can("REGISTER_IDENTITY");

  const pack = usePackItems();
  const openSeal = useOpenPackage();
  const removeUnit = useRemoveUnit();
  const lifecycle = useLifecycleAction();
  const dispatch = useDispatchTransfer();
  const relocate = useRelocate();
  const sell = useSell();
  const recall = useInitiateRecall();

  const { data: impact } = useRecallImpact(
    dialog === "RECALL_BATCH" ? (trace?.origin.batchId ?? 0) : 0,
  );

  const item = trace?.item;
  const close = () => setDialog(null);
  const done = () => {
    refresh();
    close();
  };

  const handleAction = (action: ItemAction) => {
    if (action === "OPEN" && item) {
      openSeal.mutate({ qrCode: item.qrCode }, { onSuccess: refresh });
      return;
    }
    setDialog(action);
  };

  const pendingAction: ItemAction | null = openSeal.isPending ? "OPEN" : null;

  const handleScan = async (code: string) => {
    setDialog(null);
    setScanNote(null);
    const trimmed = code.trim();
    if (!trimmed) return;

    const directBatch = batches.find(
      (b) =>
        b.batchCode.toLowerCase() === trimmed.toLowerCase() ||
        String(b.id) === trimmed ||
        trimmed.toLowerCase().includes(b.batchCode.toLowerCase()),
    );
    if (directBatch) {
      setSelectedBatchId(directBatch.id);
      setActiveCode("");
      setTraceMode("batch");
      return;
    }

    try {
      const resolved = await resolveCode.mutateAsync(trimmed);
      if (resolved.kind === "BATCH" && resolved.batchId) {
        setSelectedBatchId(resolved.batchId);
        setActiveCode("");
        setTraceMode("batch");
        return;
      }
      if (resolved.kind === "ITEM" && resolved.itemQrCode) {
        setActiveCode(resolved.itemQrCode);
        setTraceMode("item");
        return;
      }
      if (resolved.kind === "PRODUCT" && resolved.productId) {
        setActiveCode("");
        setScanNote({
          title: "That is a product catalogue SKU, not a unit or lot identity",
          detail: `${resolved.describes}. Trace needs a serialized unit QR or a production lot code.`,
          ...(canOpenLabelPools
            ? {
                href: `/dashboard/products/${resolved.productId}?tab=labels`,
                hrefLabel: "Open product label pools",
              }
            : {}),
        });
        return;
      }
      setActiveCode("");
      setScanNote({
        title: "Code not recognized",
        detail: resolved.describes,
      });
    } catch {
      const fallbackBatch = batches.find((b) =>
        b.batchCode.toLowerCase().includes(trimmed.toLowerCase()),
      );
      if (fallbackBatch) {
        setSelectedBatchId(fallbackBatch.id);
        setActiveCode("");
        setTraceMode("batch");
        return;
      }
      setActiveCode(trimmed);
      setTraceMode("item");
    }
  };

  const tabList = [
    { value: "timeline", label: "Timeline", icon: Clock, count: trace?.eventCount },
    ...(trace?.contents
      ? [{ value: "contents", label: "Contents", icon: PackageOpen, count: trace.contents.remainingCount }]
      : []),
    { value: "details", label: "Details", icon: Tag },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ScanLine className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Scan &amp; trace</h1>
            <p className="text-sm text-muted-foreground">
              Look up a unit or package. The badge shows Unit · bottle or Package · box/pallet.
            </p>
          </div>
        </div>
        {(activeCode || selectedBatchId > 0) && (
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <button
              type="button"
              disabled={!activeCode && !trace}
              onClick={() => setTraceMode("item")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                traceMode === "item"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Unit / package
            </button>
            <button
              type="button"
              disabled={!(selectedBatchId > 0 || trace?.origin.batchId)}
              onClick={() => {
                const batchId = selectedBatchId > 0 ? selectedBatchId : (trace?.origin.batchId ?? 0);
                if (batchId) {
                  setSelectedBatchId(batchId);
                  setTraceMode("batch");
                }
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                traceMode === "batch"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Lot journey
            </button>
          </div>
        )}
      </div>

      <ScanTargetHint expect="either" />

      <QrScanInput
        compact
        placeholder="Scan unit QR or package QR…"
        scanning="a unit or a box/pallet"
        onScan={(code) => {
          void handleScan(code);
        }}
      />

      <AnimatePresence>
        {scanNote && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="flex flex-col items-center gap-1 py-1.5 text-center text-sm"
          >
            <p className="font-medium text-warning-foreground">{scanNote.title}</p>
            <p className="text-muted-foreground">{scanNote.detail}</p>
            {scanNote.href ? (
              <Link
                href={scanNote.href}
                className="mt-1 text-sm font-medium text-primary underline"
              >
                {scanNote.hrefLabel ?? "Open"}
              </Link>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {(isLoading || resolveCode.isPending) && (activeCode || resolveCode.isPending) ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-16 text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          Looking up…
        </motion.div>
      ) : null}

      <AnimatePresence>
        {error && activeCode && !isLoading && !resolveCode.isPending && !errorDismissed ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="flex flex-col items-center gap-1 py-1.5 text-center text-sm"
          >
            <p className="font-medium text-danger">Could not load this identity</p>
            <p className="text-muted-foreground">
              {getApiErrorMessage(
                error,
                error instanceof Error ? error.message : "Unknown error",
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Scanned: <span className="font-mono">{activeCode}</span>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!activeCode &&
      !scanNote &&
      !resolveCode.isPending &&
      !(traceMode === "batch" && selectedBatchId > 0) ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <ScanLine className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-md space-y-1 px-4">
            <p className="font-semibold text-foreground">Scan to get started</p>
            <p className="text-sm text-muted-foreground">
              Use a unit or package QR to pack, move, or sell. Use a lot code to see the full
              journey for that batch.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard/manufacturing" className="rounded-md border border-border px-2.5 py-1 hover:text-foreground">
              Production pipeline
            </Link>
            <Link href="/dashboard/labels/print" className="rounded-md border border-border px-2.5 py-1 hover:text-foreground">
              Print labels
            </Link>
          </div>
        </div>
      ) : null}

      {/* Item / package detail — only in unit mode */}
      <AnimatePresence>
        {traceMode === "item" && trace && item && (
          <motion.div
            key={item.qrCode}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* ── Identity header ── */}
            <motion.div variants={fadeUp}>
              <div
                className={cn(
                  "rounded-xl bg-muted/30 p-4",
                  item.status === "RECALLED" && "ring-1 ring-danger/40",
                  item.expired && "ring-1 ring-danger/40",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-lg font-bold text-foreground">
                        {item.code}
                      </h2>
                      <Badge
                        variant="outline"
                        className={STATUS_TONES[item.status] ?? ""}
                      >
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {item.kind === "PACKAGE"
                          ? `Package · ${(item.packageType ?? "BOX").toLowerCase()}`
                          : "Unit · bottle"}
                      </Badge>
                      {item.sealState && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.sealState}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-faint">
                      {item.qrCode}
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {trace.product?.name ?? "No product assigned"}
                      {trace.product?.sku && (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {trace.product.sku}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-1 text-right text-xs">
                    <Fact icon={Building2} label="Held by" value={item.holderName} />
                    <Fact icon={MapPin} label="At" value={item.locationName} />
                    <Fact icon={Factory} label="Made at" value={trace.origin.facilityName} />
                    {item.quantity > 1 && (
                      <Fact
                        icon={Boxes}
                        label="Quantity"
                        value={String(item.quantity)}
                      />
                    )}
                    {trace.verificationCount > 0 && (
                      <Fact
                        icon={ScanLine}
                        label="Consumer scans"
                        value={String(trace.verificationCount)}
                      />
                    )}
                  </div>
                </div>

                {(item.status === "RECALLED" || item.expired) && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {item.status === "RECALLED"
                        ? `Batch ${trace.origin.batchCode ?? ""} is under recall. This must not be sold or dispatched.`
                        : `Past its expiry date${item.expiresOn ? ` (${formatDate(item.expiresOn)})` : ""}. This must not be sold.`}
                    </span>
                  </div>
                )}

                {trace.containedIn && (
                  <button
                    type="button"
                    onClick={() => setActiveCode(trace.containedIn!.qrCode)}
                    className="mt-4 flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Inside package</span>
                    <span className="font-mono font-medium text-foreground">
                      {trace.containedIn.code}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Package · {(trace.containedIn.packageType ?? "BOX").toLowerCase()}
                    </Badge>
                    <ArrowUpRight className="ml-auto size-3.5 text-faint" />
                  </button>
                )}
              </div>
            </motion.div>

            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
              {/* ── Detail tabs ── */}
              <motion.div variants={fadeUp}>
                <SimpleTabs tabs={tabList} defaultValue="timeline">
                  {(activeTab) => (
                    <>
                      {activeTab === "timeline" && (
                        <motion.div
                          key="timeline"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {trace.events.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                              No events recorded yet.
                            </p>
                          ) : (
                            <motion.ol
                              className="space-y-4"
                              variants={stagger}
                              initial="hidden"
                              animate="visible"
                            >
                              {trace.events.map((event) => (
                                <motion.li
                                  key={event.eventId}
                                  variants={fadeUp}
                                  className="flex gap-3"
                                >
                                  <div className="flex flex-col items-center">
                                    <span
                                      className={cn(
                                        "flex size-2.5 shrink-0 rounded-full border-2",
                                        EVENT_COLORS[event.type] ??
                                          "border-border bg-muted",
                                      )}
                                    />
                                    <span className="mt-1 w-px flex-1 bg-border" />
                                  </div>
                                  <div className="min-w-0 flex-1 pb-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[10px]",
                                          EVENT_COLORS[event.type] ?? "",
                                        )}
                                      >
                                        {event.type.replace(/_/g, " ")}
                                      </Badge>
                                      <span className="text-xs text-faint">
                                        {formatDateTime(event.occurredAt)}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-foreground">
                                      {describeEvent(event)}
                                    </p>
                                    {event.notes && (
                                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                                        &ldquo;{event.notes}&rdquo;
                                      </p>
                                    )}
                                    {event.actor && (
                                      <p className="mt-0.5 text-xs text-faint">
                                        by {event.actor}
                                      </p>
                                    )}
                                  </div>
                                </motion.li>
                              ))}
                            </motion.ol>
                          )}
                        </motion.div>
                      )}

                      {activeTab === "contents" && trace.contents && (
                        <motion.div
                          key="contents"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="space-y-4">
                            <ContentsList
                              title={`Inside now (${trace.contents.remainingCount})`}
                              items={trace.contents.remaining}
                              onOpen={setActiveCode}
                            />
                            {trace.contents.removedCount > 0 && (
                              <>
                                <Separator />
                                <ContentsList
                                  title={`Taken out (${trace.contents.removedCount})`}
                                  items={trace.contents.removed}
                                  onOpen={setActiveCode}
                                  muted
                                />
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "details" && (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-5"
                        >
                          <Section title="Origin">
                            <Detail
                              icon={Factory}
                              label="Manufacturer"
                              value={trace.origin.manufacturerName}
                            />
                            <Detail
                              icon={Building2}
                              label="Facility"
                              value={trace.origin.facilityName}
                            />
                            <Detail
                              label="Batch"
                              value={trace.origin.batchCode}
                              mono
                              suffix={
                                <div className="flex items-center gap-1.5">
                                  {trace.origin.batchStatus ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      {trace.origin.batchStatus}
                                    </Badge>
                                  ) : null}
                                  {trace.origin.batchId ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 px-1.5 text-[10px] text-primary gap-1"
                                      onClick={() => {
                                        setSelectedBatchId(trace.origin.batchId!);
                                        setTraceMode("batch");
                                      }}
                                    >
                                      <Sparkles className="size-2.5" /> View lot journey
                                    </Button>
                                  ) : null}
                                </div>
                              }
                            />
                            <Detail
                              label="Manufactured"
                              value={formatDate(trace.origin.manufacturedOn)}
                            />
                            <Detail
                              label="Expires"
                              value={formatDate(trace.origin.expiresOn)}
                            />
                            <Detail label="Serial" value={item.serialNumber} mono />
                          </Section>

                          {trace.manufacturerCompliance && (
                            <>
                              <Separator />
                              <Section title="Manufacturer Compliance">
                                <div className="flex items-center gap-2">
                                  {trace.manufacturerCompliance.verdict === "LICENSED" ? (
                                    <ShieldCheck className="size-4 text-success" />
                                  ) : (
                                    <ShieldAlert className="size-4 text-danger" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {trace.manufacturerCompliance.verdict}
                                  </span>
                                  {trace.manufacturerCompliance.licenseNumber && (
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {trace.manufacturerCompliance.licenseNumber}
                                    </span>
                                  )}
                                </div>
                              </Section>
                            </>
                          )}

                          {trace.batchDetail && trace.batchDetail.inspections.length > 0 && (
                            <>
                              <Separator />
                              <Section title="QC Inspections">
                                <div className="space-y-3">
                                  {trace.batchDetail.inspections.map((insp) => (
                                    <div key={insp.id} className="flex items-start gap-2">
                                      <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[10px]",
                                              insp.result === "APPROVED"
                                                ? "border-transparent bg-success text-white"
                                                : insp.result === "REJECTED"
                                                  ? "border-transparent bg-danger text-white"
                                                  : "border-transparent bg-warning-foreground text-white",
                                            )}
                                          >
                                            {insp.result}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            by {insp.inspector}
                                          </span>
                                        </div>
                                        {insp.notes && (
                                          <p className="mt-0.5 text-xs text-muted-foreground">
                                            {insp.notes}
                                          </p>
                                        )}
                                        <p className="mt-0.5 text-[10px] text-faint">
                                          {formatDateTime(insp.testedAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Section>
                            </>
                          )}

                          {trace.batchDetail?.productionOrder && (
                            <>
                              <Separator />
                              <Section title="Production Order">
                                <Detail
                                  label="Order"
                                  value={trace.batchDetail.productionOrder.orderNumber}
                                  mono
                                />
                                <Detail
                                  label="Planned"
                                  value={String(trace.batchDetail.productionOrder.plannedQuantity)}
                                />
                                <Detail
                                  label="Produced"
                                  value={String(trace.batchDetail.productionOrder.producedQuantity)}
                                />
                                <Detail
                                  label="Status"
                                  value={trace.batchDetail.productionOrder.status}
                                />
                                {trace.batchDetail.productionOrder.startedAt && (
                                  <Detail
                                    label="Started"
                                    value={formatDateTime(trace.batchDetail.productionOrder.startedAt)}
                                  />
                                )}
                                {trace.batchDetail.productionOrder.completedAt && (
                                  <Detail
                                    label="Completed"
                                    value={formatDateTime(trace.batchDetail.productionOrder.completedAt)}
                                  />
                                )}
                              </Section>
                            </>
                          )}

                          {trace.batchDetail && trace.batchDetail.rawMaterials.length > 0 && (
                            <>
                              <Separator />
                              <Section title="Raw Materials">
                                <div className="space-y-2">
                                  {trace.batchDetail.rawMaterials.map((mat) => (
                                    <div key={mat.id} className="flex items-center gap-2 text-sm">
                                      <Beaker className="size-3.5 shrink-0 text-muted-foreground" />
                                      <span className="font-medium text-foreground">
                                        {mat.name}
                                      </span>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {mat.code}
                                      </span>
                                      {mat.category && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {mat.category}
                                        </Badge>
                                      )}
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {mat.consumedQuantity} / {mat.allocatedQuantity} {mat.unitOfMeasure}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </Section>
                            </>
                          )}

                          {trace.product && (
                            <>
                              <Separator />
                              <Section title="Product">
                                <Detail label="Name" value={trace.product.name} />
                                <Detail label="SKU" value={trace.product.sku} mono />
                                <Detail label="Brand" value={trace.product.brand} />
                                <Detail label="Model" value={trace.product.model} />
                                <Detail label="Category" value={trace.product.category} />
                                <Detail label="GTIN" value={trace.product.gtin} mono />
                                <Detail
                                  label="Default code type"
                                  value={
                                    trace.product.barcodeSymbology?.replace(/_/g, "-") ??
                                    "QR"
                                  }
                                />
                                {trace.product.specification && (
                                  <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                                    {trace.product.specification}
                                  </p>
                                )}
                              </Section>
                            </>
                          )}

                          <Separator />
                          <Section title="Record">
                            <Detail
                              label="Registered"
                              value={formatDateTime(item.createdAt)}
                            />
                            <Detail
                              label="Last change"
                              value={formatDateTime(item.updatedAt)}
                            />
                            {item.consumerRef && (
                              <Detail
                                label="Consumer reference"
                                value={item.consumerRef}
                                mono
                              />
                            )}
                          </Section>

                          {trace.product && (
                            <Link
                              href={`/dashboard/products/${trace.product.id}/batches`}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              All batches of this product
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
                </SimpleTabs>
              </motion.div>

              {/* ── Actions sidebar ── */}
              <motion.div variants={fadeUp} className="lg:sticky lg:top-4 lg:self-start">
                <div className="rounded-xl bg-muted/30 p-4">
                  <h3 className="text-base font-semibold">What you can do</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Everything here acts on {item.code} directly — no need to
                    re-enter the code anywhere.
                  </p>
                  <div className="mt-3">
                    <ActionBar
                      actions={trace.actions}
                      onAction={handleAction}
                      pending={pendingAction}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Dialogs ── */}
            <PrintLabelDialog
              open={dialog === "PRINT_LABEL"}
              onOpenChange={close}
              item={item}
            />

            <PackDialog
              open={dialog === "PACK"}
              onOpenChange={close}
              container={item}
              pending={pack.isPending}
              onConfirm={(childQrCodes) =>
                pack.mutate(
                  { qrCode: item.qrCode, input: { childQrCodes } },
                  { onSuccess: done },
                )
              }
            />

            <RemoveContentDialog
              open={dialog === "REMOVE_CONTENT"}
              onOpenChange={close}
              container={item}
              contents={trace.contents?.remaining ?? []}
              pending={removeUnit.isPending}
              onConfirm={(childQrCode, notes) =>
                removeUnit.mutate(
                  { qrCode: item.qrCode, childQrCode, notes },
                  { onSuccess: done },
                )
              }
            />

            <DispatchDialog
              open={dialog === "DISPATCH"}
              onOpenChange={close}
              item={item}
              pending={dispatch.isPending}
              onConfirm={(input) => dispatch.mutate(input, { onSuccess: done })}
            />

            <RelocateDialog
              open={dialog === "RELOCATE"}
              onOpenChange={close}
              item={item}
              pending={relocate.isPending}
              onConfirm={(input) => relocate.mutate(input, { onSuccess: done })}
            />

            <SellDialog
              open={dialog === "SELL"}
              onOpenChange={close}
              item={item}
              pending={sell.isPending}
              onConfirm={(input) => sell.mutate(input, { onSuccess: done })}
            />

            {dialog && LIFECYCLE_ACTIONS.includes(dialog) && (
              <LifecycleDialog
                open
                onOpenChange={close}
                item={item}
                action={dialog as LifecycleAction}
                pending={lifecycle.isPending}
                onConfirm={(action, reason) =>
                  lifecycle.mutate(
                    { qrCode: item.qrCode, action, reason },
                    { onSuccess: done },
                  )
                }
              />
            )}

            {trace.origin.batchId && (
              <RecallDialog
                open={dialog === "RECALL_BATCH"}
                onOpenChange={close}
                batchCode={trace.origin.batchCode ?? ""}
                impactCount={impact?.totalUnits}
                pending={recall.isPending}
                onConfirm={(reason) =>
                  recall.mutate(
                    { batchId: trace.origin.batchId!, reason },
                    { onSuccess: done },
                  )
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lot journey — only in batch mode (was always stacked under the unit) */}
      {traceMode === "batch" &&
        (() => {
          const resolvedBatchId =
            selectedBatchId > 0 ? selectedBatchId : (trace?.origin.batchId ?? 0);
          if (!resolvedBatchId) return null;
          const batchOption = batches.find((b) => b.id === resolvedBatchId);
          return (
            <div className="space-y-3">
              {activeCode && (
                <button
                  type="button"
                  onClick={() => setTraceMode("item")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  ← Back to scanned unit
                </button>
              )}
              <BatchJourneyView
                batchId={resolvedBatchId}
                batchSelector={
                  batches.length > 1 ? (
                    <select
                      value={resolvedBatchId}
                      onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                      className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          Lot {b.batchCode} · {b.productName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-mono text-xs font-bold text-foreground">
                      {batchOption
                        ? `Lot ${batchOption.batchCode}`
                        : `Lot #${resolvedBatchId}`}
                    </span>
                  )
                }
              />
            </div>
          );
        })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-faint">{label}</span>
      <Icon className="size-3 text-faint" />
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
  suffix,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  suffix?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="size-3.5 shrink-0 text-faint" />}
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono text-xs")}>
        {value}
      </span>
      {suffix}
    </div>
  );
}

function ContentsList({
  title,
  items,
  onOpen,
  muted,
}: {
  title: string;
  items: { id: number; qrCode: string; code: string; productName: string | null; status: string }[];
  onOpen: (qrCode: string) => void;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <div className="space-y-1">
          {items.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onOpen(child.qrCode)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                muted && "opacity-60",
              )}
            >
              <span className="font-mono text-xs font-medium">{child.code}</span>
              <span className="truncate text-xs text-muted-foreground">
                {child.productName ?? "—"}
              </span>
              <Badge
                variant="outline"
                className={cn("ml-auto text-[10px]", STATUS_TONES[child.status])}
              >
                {child.status}
              </Badge>
              <ArrowUpRight className="size-3 shrink-0 text-faint" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function describeEvent(event: {
  type: string;
  sourceOrganization: string | null;
  destinationOrganization: string | null;
  sourceLocation: string | null;
  destinationLocation: string | null;
  viaContainer: string | null;
  consumerRef: string | null;
}): string {
  const parts: string[] = [];

  if (event.sourceOrganization && event.destinationOrganization) {
    parts.push(`${event.sourceOrganization} → ${event.destinationOrganization}`);
  } else if (event.destinationOrganization) {
    parts.push(event.destinationOrganization);
  } else if (event.sourceOrganization) {
    parts.push(event.sourceOrganization);
  }

  if (event.sourceLocation && event.destinationLocation) {
    parts.push(`${event.sourceLocation} → ${event.destinationLocation}`);
  } else if (event.destinationLocation) {
    parts.push(`at ${event.destinationLocation}`);
  }

  if (event.viaContainer) parts.push(`via ${event.viaContainer}`);
  if (event.consumerRef) parts.push(`consumer ${event.consumerRef}`);

  return parts.join(" · ") || "Recorded";
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
