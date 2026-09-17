"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Factory,
  FileText,
  Flame,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  PackagePlus,
  Printer,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextDisplay, plainTextFromHtml } from "@/components/ui/rich-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useRecall, useLiftRecall, useRecordRecallRecovery } from "@/hooks/recall";
import { useCapabilities } from "@/hooks/permissions";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  mono,
  span,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  span?: boolean;
}) {
  return (
    <div className={cn("space-y-1", span && "sm:col-span-2 lg:col-span-3")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm"}>
        {children ?? <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

/** Solid Rwanda-flag chips. Yellow uses dark text so it stays readable. */
const STATUS_CLASSES: Record<string, string> = {
  RECALLED: "border-transparent bg-danger text-white",
  QUARANTINED: "border-transparent bg-rwanda-yellow text-white",
  DESTROYED: "border-transparent bg-muted-foreground text-white",
  SOLD: "border-transparent bg-rwanda-yellow text-white",
  ACTIVE: "border-transparent bg-rwanda-green text-white",
};

/** Solid Rwanda-flag chips. Yellow uses dark text so it stays readable. */
const EVENT_BADGE_STYLES: Record<string, string> = {
  RECALLED: "bg-danger text-white",
  RECEIVED: "bg-rwanda-blue text-white",
  DISPATCHED: "bg-rwanda-blue text-white",
  MANUFACTURED: "bg-rwanda-green text-white",
  BATCH_APPROVED: "bg-rwanda-green text-white",
  QC_INSPECTED: "bg-rwanda-blue text-white",
  PRODUCTION_COMPLETED: "bg-rwanda-green text-white",
  PRODUCTION_STARTED: "bg-muted-foreground text-white",
  SOLD: "bg-rwanda-yellow text-white",
  QUARANTINED: "bg-rwanda-yellow text-white",
  DESTROYED: "bg-muted-foreground text-white",
  RELEASED: "bg-rwanda-green text-white",
  PACKAGED: "bg-rwanda-yellow text-white",
  UNIT_REMOVED: "bg-danger text-white",
};

/** Icon per event type for the timeline dot. */
const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RECALLED: AlertTriangle,
  RECEIVED: PackageCheck,
  DISPATCHED: Truck,
  MANUFACTURED: Factory,
  BATCH_APPROVED: ClipboardCheck,
  QC_INSPECTED: ShieldCheck,
  PRODUCTION_COMPLETED: PackageCheck,
  PRODUCTION_STARTED: PackagePlus,
  SOLD: ShoppingBag,
  QUARANTINED: ShieldCheck,
  DESTROYED: Trash2,
  RELEASED: ShieldCheck,
  PACKAGED: PackageCheck,
  UNIT_REMOVED: PackageCheck,
};

export default function RecallDetailPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const batchId = Number(params.batchId);
  const { data: recall, isLoading, isError, error } = useRecall(batchId);
  const lift = useLiftRecall();
  const recovery = useRecordRecallRecovery();
  const permissions = useCapabilities();
  const canManageRecall = permissions.can("MANAGE_RECALL");
  const canApplyLifecycle = permissions.can("APPLY_LIFECYCLE");

  const [liftOpen, setLiftOpen] = useState(false);
  const [liftReason, setLiftReason] = useState("");
  const [directiveOpen, setDirectiveOpen] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const toggleEvent = (id: number) =>
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!Number.isFinite(batchId) || batchId <= 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Invalid recall link.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !recall) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {(error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "This lot is not under recall, or you cannot see it."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const productName = recall.productName?.trim() || "Unknown product";
  const totalUnits = recall.affectedUnits ?? 0;
  const recoverableUnits = recall.recoverableUnits ?? 0;
  const quarantinedUnits = recall.quarantinedUnits ?? 0;
  const soldUnits = recall.soldUnits ?? 0;
  const destroyedUnits = recall.destroyedUnits ?? 0;
  const holders = recall.impactedLocations ?? [];
  const inDepotUnits = Math.max(0, recoverableUnits - quarantinedUnits);
  const isConsumerExposed = soldUnits > 0;

  const handleLiftConfirm = () => {
    if (!liftReason.trim()) {
      toast.error("Enter a justification before lifting the recall");
      return;
    }
    lift.mutate(
      { batchId: recall.batchId, reason: liftReason.trim() },
      {
        onSuccess: () => {
          setLiftOpen(false);
          router.push("/dashboard/recall");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Back nav ── */}
      <BackLink />

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg text-white",
              isConsumerExposed ? "bg-danger" : "bg-warning-foreground",
            )}
          >
            {isConsumerExposed ? (
              <Flame className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{productName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{recall.batchNumber}</span>
              {recall.productSku && (
                <>
                  <span>·</span>
                  <span>SKU {recall.productSku}</span>
                </>
              )}
              {recall.manufacturerName && (
                <>
                  <span>·</span>
                  <span>{recall.manufacturerName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive">RECALLED</Badge>
          {isConsumerExposed ? (
            <Badge variant="destructive" className="gap-1 border-transparent">
              <Flame className="size-3" />
              Market exposure
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-transparent bg-success text-white">
              <ShieldCheck className="size-3" />
              Upstream only
            </Badge>
          )}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDirectiveOpen(true)}>
          <Printer className="size-4" />
          Print directive
        </Button>
        {recall.linkedCase && (
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/dashboard/regulator/cases?caseId=${recall.linkedCase.id}`} />
            }
          >
            <ShieldAlert className="size-4" />
            Case {recall.linkedCase.caseNumber ?? `#${recall.linkedCase.id}`}
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 uppercase">
              {recall.linkedCase.priority}
            </Badge>
          </Button>
        )}
        {canManageRecall && (
          <Button
            variant="outline"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger border-danger/30"
            onClick={() => setLiftOpen(true)}
          >
            Lift recall
          </Button>
        )}
      </div>

      {/* ── Recall reason banner ── */}
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-relaxed text-foreground/75">
        <p className="mb-1.5 font-semibold text-danger">Recall reason</p>
        <RichTextDisplay html={recall.reason} />
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(recall.recallDate).toLocaleString()}
        </p>
      </div>

      {/* ── Inventory metrics ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total units"
          value={totalUnits.toLocaleString()}
          icon={<Package className="size-4" />}
          iconBg="bg-muted-foreground"
          caption="Manufactured in this lot"
        />
        <MetricCard
          title="In depots"
          value={inDepotUnits.toLocaleString()}
          icon={<Warehouse className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Awaiting quarantine"
        />
        <MetricCard
          title="Quarantined"
          value={quarantinedUnits.toLocaleString()}
          icon={<ShieldCheck className="size-4" />}
          iconBg="bg-success"
          caption="Formally locked"
        />
        <MetricCard
          title={isConsumerExposed ? "In public hands" : "Destroyed"}
          value={(isConsumerExposed ? soldUnits : destroyedUnits).toLocaleString()}
          icon={isConsumerExposed ? <Flame className="size-4" /> : <Trash2 className="size-4" />}
          iconBg={isConsumerExposed ? "bg-danger" : "bg-muted-foreground"}
          caption={isConsumerExposed ? "Sold — public risk" : "Verified disposed"}
          badge={isConsumerExposed && soldUnits > 0 ? "⚠ Risk" : undefined}
          badgeType="negative"
        />
      </div>

      {/* ── Lot technical record ── */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4" />
            Lot record
          </CardTitle>
          <CardDescription>Verified catalogue data for this production lot</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Lot code" mono>{recall.batchNumber}</Field>
          <Field label="SKU" mono>{recall.productSku}</Field>
          <Field label="Manufacturer">{recall.manufacturerName ?? recall.initiatedBy}</Field>
          <Field label="Production facility">
            {recall.facility
              ? `${recall.facility.name}${recall.facility.code ? ` (${recall.facility.code})` : ""}`
              : "—"}
          </Field>
          <Field label="Manufactured on">
            {recall.manufacturedOn
              ? new Date(recall.manufacturedOn).toLocaleDateString()
              : "Not recorded"}
          </Field>
          <Field label="Expiry">
            {recall.expiresOn
              ? new Date(recall.expiresOn).toLocaleDateString()
              : "Non-perishable / not set"}
          </Field>
          <Field label="Traceability level">
            {recall.product?.traceabilityLevel ?? "—"}
          </Field>
          <Field label="Product category">{recall.product?.category ?? "—"}</Field>
          <Field label="Recall date">
            {new Date(recall.recallDate).toLocaleString()}
          </Field>
          <Field label="Defect / cause" span>
            <RichTextDisplay
              html={recall.reason}
              className="rounded-lg border border-border bg-muted/30 p-3"
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Custody network ── */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" />
            Custody locations
          </CardTitle>
          <CardDescription>
            {holders.length} location{holders.length !== 1 && "s"} currently holding recalled inventory — work the recall from this list
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {holders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              No external holders recorded. All units may have been retained at source.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Holder</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3 text-right">Identities</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {holders.map((h, i) => (
                    <tr key={`${h.locationId}-${i}`} className="hover:bg-muted/20">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Building2 className="size-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{h.locationName}</p>
                            <p className="font-mono text-xs text-muted-foreground">ID {h.locationId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase font-semibold",
                            STATUS_CLASSES[h.eventType] ?? "border-border text-muted-foreground",
                          )}
                        >
                          {h.eventType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {h.qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {h.identities ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Traceability event timeline ── */}
      {recall.recentEvents && recall.recentEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Recent events</h2>
            <span className="text-xs text-muted-foreground">— immutable traceability timeline</span>
          </div>

          <div className="relative pl-5 sm:pl-6">
            {/* Vertical timeline line */}
            <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border sm:left-[11px]" />

            <div className="space-y-0">
              {recall.recentEvents.slice(0, 10).map((evt, idx) => {
                const isLast = idx === recall.recentEvents!.slice(0, 10).length - 1;
                const isExpanded = expandedEvents.has(evt.id);
                const badgeClass = EVENT_BADGE_STYLES[evt.type] ?? "bg-slate-500";
                const icon = EVENT_ICONS[evt.type] ?? Clock;
                const EventIcon = icon;

                return (
                  <div key={evt.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleEvent(evt.id)}
                      className={cn(
                        "relative flex w-full gap-3 rounded-lg py-3 pl-0 pr-2 text-left transition-colors sm:gap-4",
                        isExpanded ? "bg-muted/40" : "hover:bg-muted/25",
                      )}
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 flex shrink-0 items-start pt-0.5">
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full ring-4 ring-card transition-transform sm:size-7",
                            badgeClass,
                            isExpanded && "scale-110",
                          )}
                        >
                          <EventIcon className="size-3 text-white sm:size-3.5" />
                        </div>
                      </div>

                      {/* Summary row */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium tracking-wide",
                              badgeClass,
                            )}
                          >
                            {evt.type === "RECALLED"
                              ? "Lot recalled"
                              : evt.type === "RELEASED"
                                ? "Recall lifted"
                                : evt.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(evt.occurredAt).toLocaleString()}
                          </span>
                          {evt.quantity > 0 && (
                            <span className="font-mono text-[13px] font-semibold text-foreground/70">
                              {evt.quantity.toLocaleString()} units
                            </span>
                          )}
                          {evt.batchCode && (
                            <span className="font-mono text-[13px] text-muted-foreground">
                              {evt.batchCode}
                            </span>
                          )}
                        </div>

                        {(evt.actorName || evt.organizationName) && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                              {(evt.actorName ?? "?").charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium text-foreground/80">{evt.actorName}</span>
                            {evt.organizationName && (
                              <><span className="text-muted-foreground/50">at</span><span>{evt.organizationName}</span></>
                            )}
                          </p>
                        )}

                        {evt.notes && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{evt.notes}</p>
                        )}

                        {!evt.notes && evt.locationName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />{evt.locationName}
                          </p>
                        )}
                      </div>

                      {/* Expand arrow */}
                      <div className="shrink-0 self-center">
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground/50 transition-transform duration-200",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="ml-8 mb-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:ml-9">
                        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                          <EventDetailRow label="Event ID" value={`#${evt.id}`} mono />
                          <EventDetailRow label="Type" value={evt.type} />
                          <EventDetailRow label="Occurred" value={new Date(evt.occurredAt).toLocaleString()} />
                          <EventDetailRow label="Recorded" value={new Date(evt.recordedAt).toLocaleString()} />
                          <EventDetailRow label="Actor" value={evt.actorName} />
                          {evt.actorEmail && <EventDetailRow label="Actor email" value={evt.actorEmail} mono />}
                          {evt.organizationName && <EventDetailRow label="Source org" value={evt.organizationName} />}
                          {evt.organizationId && <EventDetailRow label="Org ID" value={`#${evt.organizationId}`} mono />}
                          {evt.locationName && <EventDetailRow label="Source location" value={evt.locationName} />}
                          {evt.destinationOrganizationName && <EventDetailRow label="Destination org" value={evt.destinationOrganizationName} />}
                          {evt.destinationLocationName && <EventDetailRow label="Destination location" value={evt.destinationLocationName} />}
                          {evt.itemCode && <EventDetailRow label="Item code" value={evt.itemCode} mono />}
                          {evt.itemQrCode && <EventDetailRow label="QR code" value={evt.itemQrCode} mono />}
                          {evt.batchCode && <EventDetailRow label="Batch" value={evt.batchCode} mono />}
                          {evt.relatedItemCode && <EventDetailRow label="Related item" value={evt.relatedItemCode} mono />}
                          {evt.deviceId && <EventDetailRow label="Device" value={evt.deviceId} mono />}
                          {evt.consumerRef && <EventDetailRow label="Consumer ref" value={evt.consumerRef} mono />}
                          {evt.quantity > 0 && <EventDetailRow label="Quantity" value={evt.quantity.toLocaleString()} />}
                        </div>
                        {evt.notes && (
                          <div className="mt-3 border-t border-border/40 pt-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/70">{evt.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Field recovery scanner ── */}
      {canApplyLifecycle && (
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-4" />
              Scan recovery
            </CardTitle>
            <CardDescription>
              Scan a recalled identity on site, then record whether it was quarantined or destroyed. Each scan is appended to the audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldRecoveryForm
              pending={recovery.isPending}
              onRecord={(input) => recovery.mutate(input)}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Lift recall dialog ── */}
      <Dialog open={liftOpen} onOpenChange={setLiftOpen}>
        <DialogPopup>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-foreground text-white">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="mb-0.5 text-[13px] font-bold uppercase tracking-[0.14em] text-warning-foreground">
                  Regulatory action
                </p>
                <DialogTitle>Lift recall — lot {recall.batchNumber}</DialogTitle>
                <DialogDescription>
                  Lifting restores the status this lot had before the recall. Provide an official justification — this is written permanently to the audit log.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="lift-reason">Justification / resolution note</Label>
            <Textarea
              id="lift-reason"
              placeholder="e.g. Laboratory re-test cleared — cold chain confirmed compliant per inspector report #2026-09-04…"
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              className="min-h-[120px] resize-none text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiftOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-warning-foreground text-white hover:bg-warning-foreground/90"
              disabled={lift.isPending || !liftReason.trim()}
              onClick={handleLiftConfirm}
            >
              {lift.isPending ? "Lifting…" : "Confirm lift"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* ── Print directive dialog ── */}
      <Dialog open={directiveOpen} onOpenChange={setDirectiveOpen}>
        <DialogPopup className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Official Product Recall Directive
            </DialogTitle>
            <DialogDescription>
              Regulatory enforcement notice — print or save for field distribution
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 rounded-xl border bg-card p-6 text-sm">
            <div className="border-b pb-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Republic of Rwanda
              </p>
              <p className="text-xs text-muted-foreground">
                Rwanda Inspectorate, Competition and Consumer Protection Authority — RICA
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                REF: RICA/REC/{recall.batchNumber}/{recall.batchId}
              </p>
            </div>

            <div className="space-y-1.5">
              <p><span className="font-semibold">Subject:</span> Mandatory withdrawal &amp; quarantine order</p>
              <p><span className="font-semibold">Product:</span> {productName} (SKU: {recall.productSku ?? "N/A"})</p>
              <p><span className="font-semibold">Lot code:</span> <span className="font-mono">{recall.batchNumber}</span></p>
              <p><span className="font-semibold">Manufacturer:</span> {recall.manufacturerName ?? recall.initiatedBy}</p>
              <p>
                <span className="font-semibold">Defect / cause:</span>{" "}
                {plainTextFromHtml(recall.reason) || "—"}
              </p>
              <p><span className="font-semibold">Recall issued:</span> {new Date(recall.recallDate).toLocaleString()}</p>
              <p><span className="font-semibold">Units affected:</span> {totalUnits.toLocaleString()}</p>
              <p><span className="font-semibold">Registered holder sites:</span> {holders.length}</p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-foreground/80">
              <p className="font-bold text-danger">Instructions to all holders and distribution sites:</p>
              <p className="mt-1">
                Immediate cessation of sale, distribution, or onward movement is mandatory. All stock from lot{" "}
                <strong>{recall.batchNumber}</strong> must be physically segregated and placed under bonded quarantine
                pending collection or destruction. Recovery is to be recorded in the SANTRACK traceability system by
                scanning each identity upon disposition.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setDirectiveOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function FieldRecoveryForm({
  pending,
  onRecord,
}: {
  pending: boolean;
  onRecord: (input: { qrCode: string; outcome: "QUARANTINED" | "DESTROYED"; reason?: string }) => void;
}) {
  const [outcome, setOutcome] = useState<"QUARANTINED" | "DESTROYED">("QUARANTINED");
  const [note, setNote] = useState("");
  const [manual, setManual] = useState("");

  const execute = (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    onRecord({ qrCode: clean, outcome, reason: note.trim() || undefined });
    setManual("");
    setNote("");
  };

  return (
    <div className="space-y-4">
      {/* Outcome toggle */}
      <div className="grid grid-cols-2 rounded-xl border border-input bg-muted/35 p-1.5" role="group">
        <button
          type="button"
          onClick={() => setOutcome("QUARANTINED")}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
            outcome === "QUARANTINED"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ShieldCheck className="size-4" />
          Quarantine
        </button>
        <button
          type="button"
          onClick={() => setOutcome("DESTROYED")}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
            outcome === "DESTROYED"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Trash2 className="size-4" />
          Destroy
        </button>
      </div>

      {/* Camera / HID scanner */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Scan identity
        </Label>
        <QrScanInput
          compact
          onScan={execute}
          placeholder="Scan barcode or type lot code…"
          scanning="a recalled identity"
        />
      </div>

      {/* Manual fallback */}
      <div className="space-y-1.5">
        <Label htmlFor="recovery-manual" className="text-xs text-muted-foreground">
          Or enter manually
        </Label>
        <div className="flex gap-2">
          <Input
            id="recovery-manual"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. ST-YOG-000124"
            className="font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && manual.trim()) {
                e.preventDefault();
                execute(manual);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || !manual.trim()}
            onClick={() => execute(manual)}
          >
            Record
          </Button>
        </div>
      </div>

      {/* Inspector note */}
      <div className="space-y-1.5">
        <Label htmlFor="recovery-note" className="text-xs text-muted-foreground">
          Inspector note <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="recovery-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Collected from shelf B4, moved to quarantine bay 2"
          className="text-sm"
        />
      </div>
    </div>
  );
}

function EventDetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <p className={cn("mt-0.5 text-foreground/80", mono ? "font-mono break-all" : "")}>
        {value}
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href="/dashboard/recall" />}
    >
      <ArrowLeft className="size-3.5" />
      All recalls
    </Button>
  );
}
