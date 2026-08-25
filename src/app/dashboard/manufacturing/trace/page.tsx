"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
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
  REGISTERED: "border-success/30 bg-success/10 text-success",
  PACKAGED: "border-primary/30 bg-primary/10 text-primary",
  UNIT_REMOVED: "border-warning/30 bg-warning/10 text-warning-foreground",
  DISPATCHED: "border-warning/30 bg-warning/10 text-warning-foreground",
  RECEIVED: "border-success/30 bg-success/10 text-success",
  RELOCATED: "border-primary/30 bg-primary/10 text-primary",
  SOLD: "border-primary/30 bg-primary/10 text-primary",
  QC_PASSED: "border-success/30 bg-success/10 text-success",
  QC_FAILED: "border-danger/30 bg-danger/10 text-danger",
  QUARANTINED: "border-warning/30 bg-warning/10 text-warning-foreground",
  RELEASED: "border-success/30 bg-success/10 text-success",
  RETURNED: "border-warning/30 bg-warning/10 text-warning-foreground",
  RECALLED: "border-danger/30 bg-danger/10 text-danger",
  EXPIRED: "border-danger/30 bg-danger/10 text-danger",
  DAMAGED: "border-danger/30 bg-danger/10 text-danger",
  DESTROYED: "border-danger/30 bg-danger/10 text-danger",
};

const STATUS_TONES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success border-success/20",
  RESERVED: "bg-primary/10 text-primary border-primary/20",
  IN_TRANSIT: "bg-warning/10 text-warning-foreground border-warning/20",
  SOLD: "bg-primary/10 text-primary border-primary/20",
  RETURNED: "bg-warning/10 text-warning-foreground border-warning/20",
  QUARANTINED: "bg-warning/10 text-warning-foreground border-warning/20",
  RECALLED: "bg-danger/10 text-danger border-danger/20",
  EXPIRED: "bg-danger/10 text-danger border-danger/20",
  DAMAGED: "bg-danger/10 text-danger border-danger/20",
  DESTROYED: "bg-danger/10 text-danger border-danger/20",
};

/** The six lifecycle verbs that share one endpoint and one dialog. */
const LIFECYCLE_ACTIONS: ItemAction[] = [
  "QUARANTINE",
  "RELEASE",
  "RETURN",
  "DAMAGE",
  "EXPIRE",
  "DESTROY",
];

/**
 * The item console.
 *
 * An operator gets here by scanning the thing in front of them, so this is a
 * working screen rather than a report: everything known about the identity,
 * and every operation open to this person, in one place. The alternative —
 * looking it up here, then walking to a Dispatch page and re-keying the code —
 * is how the wrong pallet gets shipped.
 *
 * Which operations appear, and whether they are enabled, is decided by the
 * server from the same expression its guard enforces. So a button on this page
 * is a call that will go through, and a greyed-out one explains itself.
 */
export default function ItemConsolePage() {
  // `?code=` (and `?qr=`, which the old Product Lifecycle page used) so a link
  // from anywhere else — an alert, a report, a printed work instruction —
  // lands on the right item already loaded.
  const searchParams = useSearchParams();
  const [activeCode, setActiveCode] = useState(
    searchParams.get("code") ?? searchParams.get("qr") ?? "",
  );
  const [dialog, setDialog] = useState<ItemAction | null>(null);

  const { data: trace, isLoading, error } = useTraceTimeline(activeCode);
  const refresh = useRefreshTrace(activeCode);

  const pack = usePackItems();
  const openSeal = useOpenPackage();
  const removeUnit = useRemoveUnit();
  const lifecycle = useLifecycleAction();
  const dispatch = useDispatchTransfer();
  const relocate = useRelocate();
  const sell = useSell();
  const recall = useInitiateRecall();

  // Only asked for once the recall dialog is open — it is a cross-organization
  // query and nobody needs it just for looking at an item.
  const { data: impact } = useRecallImpact(
    dialog === "RECALL_BATCH" ? (trace?.origin.batchId ?? 0) : 0,
  );

  const item = trace?.item;
  const close = () => setDialog(null);
  const done = () => {
    refresh();
    close();
  };

  /** Opening the seal needs no form, so it acts on the spot. */
  const handleAction = (action: ItemAction) => {
    if (action === "OPEN" && item) {
      openSeal.mutate({ qrCode: item.qrCode }, { onSuccess: refresh });
      return;
    }
    setDialog(action);
  };

  const pendingAction: ItemAction | null = openSeal.isPending ? "OPEN" : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Clock className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Trace &amp; Act</h1>
          <p className="text-sm text-muted-foreground">
            Scan any code to see everything about that product or package — and
            do everything to it, without leaving this page.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <QrScanInput
            onScan={(code) => {
              setActiveCode(code);
              setDialog(null);
            }}
            scanning="a unit, box or pallet"
            placeholder="e.g. ST-LPT-000001"
          />
        </CardContent>
      </Card>

      {isLoading && activeCode && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Looking up {activeCode}…
        </div>
      )}

      {error && activeCode && !isLoading && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          <p className="font-medium">Could not load this identity</p>
          <p className="mt-1 text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scanned: <span className="font-mono">{activeCode}</span>
          </p>
        </div>
      )}

      {!activeCode && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="size-6 text-primary" />
          </div>
          <p className="mt-4 font-medium text-foreground">
            Scan something to begin
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            A unit, a box or a pallet. Whatever it is, its whole history and
            everything you can do to it will be here.
          </p>
        </div>
      )}

      {trace && item && (
        <>
          {/* ── Identity header ── */}
          <Card
            className={cn(
              item.status === "RECALLED" && "border-danger/40",
              item.expired && "border-danger/40",
            )}
          >
            <CardContent>
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
                        ? (item.packageType ?? "PACKAGE")
                        : "UNIT"}
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
                </div>
              </div>

              {/* Anything that makes this stock unsellable belongs at the top,
                  not buried under a tab. */}
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

              {/* Where it sits in the packaging hierarchy — one tap away from
                  acting on the container instead. */}
              {trace.containedIn && (
                <button
                  type="button"
                  onClick={() => setActiveCode(trace.containedIn!.qrCode)}
                  className="mt-4 flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Package className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Inside</span>
                  <span className="font-mono font-medium text-foreground">
                    {trace.containedIn.code}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {trace.containedIn.packageType}
                  </Badge>
                  <ArrowUpRight className="ml-auto size-3.5 text-faint" />
                </button>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* ── Detail ── */}
            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline" className="gap-2">
                  <Clock className="size-4" />
                  Timeline
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {trace.eventCount}
                  </Badge>
                </TabsTrigger>
                {trace.contents && (
                  <TabsTrigger value="contents" className="gap-2">
                    <PackageOpen className="size-4" />
                    Contents
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {trace.contents.remainingCount}
                    </Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="details" className="gap-2">
                  <Tag className="size-4" />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent>
                    {trace.events.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No events recorded yet.
                      </p>
                    ) : (
                      <ol className="space-y-4">
                        {trace.events.map((event) => (
                          <li key={event.eventId} className="flex gap-3">
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
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {trace.contents && (
                <TabsContent value="contents" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        What is in {item.code}
                      </CardTitle>
                      <CardDescription>
                        Each item keeps its own identity. Opening the container
                        never destroys it, and removing something records an
                        event rather than erasing it.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="space-y-5 pt-6">
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
                          trace.origin.batchStatus ? (
                            <Badge variant="outline" className="text-[10px]">
                              {trace.origin.batchStatus}
                            </Badge>
                          ) : null
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

                    {/* Manufacturer compliance */}
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

                    {/* QC Inspections */}
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
                                          ? "border-success/30 bg-success/10 text-success"
                                          : insp.result === "REJECTED"
                                            ? "border-danger/30 bg-danger/10 text-danger"
                                            : "border-warning/30 bg-warning/10 text-warning-foreground",
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

                    {/* Production Order */}
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

                    {/* Raw Materials */}
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
                      {/* Present only when the caller is entitled to see it —
                          the party that recorded the sale, or a regulator. */}
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* ── Actions ── */}
            <Card className="lg:sticky lg:top-4 lg:self-start">
              <CardHeader>
                <CardTitle className="text-base">What you can do</CardTitle>
                <CardDescription>
                  Everything here acts on {item.code} directly — no need to
                  re-enter the code anywhere.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionBar
                  actions={trace.actions}
                  onAction={handleAction}
                  pending={pendingAction}
                />
              </CardContent>
            </Card>
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
        </>
      )}
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

/** One event, in a sentence rather than a row of fields. */
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
