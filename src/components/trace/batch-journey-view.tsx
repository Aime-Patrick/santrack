"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Factory,
  FileCheck2,
  MapPin,
  Package,
  PackageCheck,
  PackagePlus,
  Printer,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBatchJourney } from "@/hooks/batch-journey";
import { useCapabilities } from "@/hooks/permissions";
import { cn } from "@/lib/utils";

interface BatchJourneyViewProps {
  batchId: number;
  batchSelector?: React.ReactNode;
}

export function BatchJourneyView({ batchId, batchSelector }: BatchJourneyViewProps) {
  const { data: journey, isLoading, isError, error, refetch, isFetching } =
    useBatchJourney(batchId);

  // The journey itself is readable by every role — a regulator investigating a
  // batch needs the same timeline a producer does. Minting/printing whole
  // identity pools is a producer's job (REGISTER_IDENTITY), so those two
  // shortcuts are only offered to roles that can actually use Label Studio.
  const canMint = useCapabilities().can("REGISTER_IDENTITY");

  // Keep track of which timeline step is expanded for deep drill-down
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    production: true,
    qc: true,
    transfers: true,
    custody: true,
    retail: false,
  });

  const toggleStep = (key: string) => {
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <BatchJourneySkeleton />;
  }

  if (isError || !journey) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border/80 border-dashed py-12 text-center w-full">
        <AlertTriangle className="size-6 text-danger mb-2" />
        <h3 className="text-sm font-semibold text-foreground">Lot journey unavailable</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {error instanceof Error ? error.message : "Could not load batch journey."}
        </p>
        <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 size-3" /> Retry
        </Button>
      </div>
    );
  }

  const { batch, metrics, custodyNodes, transfers, inspections, productionOrder, rawMaterials } = journey;
  const total = metrics.totalUnits || 0;

  const hasMintedUnits = total > 0 || metrics.producedUnits > 0;
  const hasQC = inspections.length > 0;
  const hasTransfers = transfers.length > 0;
  const hasCustody = custodyNodes.length > 0 && custodyNodes.some((n) => n.totalUnits > 0);
  const hasConsumerScans = metrics.soldUnits > 0 || metrics.verificationScansCount > 0;

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Top Header Bar (No redundant metric cards!) ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/80 pb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="max-w-full sm:max-w-sm">{batchSelector}</div>
            <Badge
              className={cn(
                "text-xs px-2.5 py-0.5 font-semibold shrink-0 text-white",
                batch.status === "APPROVED" && "bg-rwanda-green hover:bg-emerald-700",
                batch.status === "ACTIVE" && "bg-rwanda-blue hover:bg-blue-600",
                batch.status === "QUARANTINED" && "bg-rwanda-yellow text-slate-900",
                batch.status === "RECALLED" && "bg-danger"
              )}
            >
              {batch.status}
            </Badge>

            {metrics.discrepancyUnits > 0 && (
              <Badge className="bg-danger text-white text-xs px-2 py-0.5 font-mono flex items-center gap-1">
                <AlertTriangle className="size-3" /> {metrics.discrepancyUnits} Units Discrepancy
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {batch.productSku && (
              <span className="font-mono flex items-center gap-1 text-foreground">
                <Tag className="size-3 text-rwanda-blue" /> SKU: {batch.productSku}
              </span>
            )}
            {batch.facilityName && (
              <span className="flex items-center gap-1">
                <Factory className="size-3 text-rwanda-green" /> Plant: {batch.facilityName}
              </span>
            )}
            {batch.manufacturedOn && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> Produced: {batch.manufacturedOn}
              </span>
            )}
            {batch.expiresOn && (
              <span className="flex items-center gap-1 text-amber-700 dark:text-rwanda-yellow font-medium">
                <Clock className="size-3" /> Expires: {batch.expiresOn}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-border"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          {canMint && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-rwanda-green hover:bg-emerald-700 text-white font-medium"
              nativeButton={false}
              render={<Link href="/dashboard/labels/print?template=unit" />}
            >
              <Printer className="size-3" />
              Print Labels
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. The Interactive Journey Timeline ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Supply Chain Event Spine
          </h2>
          <span className="text-xs text-muted-foreground">
            Click any event to drill down into logs & manifests
          </span>
        </div>
      </div>

      <div className="relative border-l-2 border-border/80 ml-3 sm:ml-4 pl-5 sm:pl-7 space-y-5 pb-4 w-full">
        {/* ── STEP 1: Production Run (Clickable) ── */}
        <div className="relative">
          <div className="absolute -left-[29px] sm:-left-[37px] top-3 flex size-5 sm:size-6 items-center justify-center rounded-full bg-rwanda-green text-white shadow-xs">
            <Factory className="size-3 sm:size-3.5" />
          </div>

          <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden transition-colors">
            {/* Header ("Click to expand") */}
            <button
              type="button"
              onClick={() => toggleStep("production")}
              className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rwanda-green">
                    1. Production & Minting
                  </span>
                  {batch.manufacturedOn && (
                    <Badge variant="outline" className="text-[10px] border-border">
                      {batch.manufacturedOn}
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {batch.manufacturerName} — {batch.facilityName ?? "Origin Plant"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-foreground">
                  {hasMintedUnits ? `${total.toLocaleString()} units` : "0 units (pre-production)"}
                </span>
                <ChevronDown className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  expandedSteps.production && "rotate-180"
                )} />
              </div>
            </button>

            {/* Expanded Details */}
            {expandedSteps.production && (
              <div className="border-t border-border/60 p-4 bg-muted/10 space-y-3 text-xs">
                {productionOrder ? (
                  <div className="rounded border border-border/70 p-2.5 bg-background space-y-1">
                    <div className="flex justify-between font-mono font-medium">
                      <span>Work Order #{productionOrder.orderNumber}</span>
                      <Badge variant="outline" className="text-[10px]">{productionOrder.status}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Planned Target: <strong className="text-foreground">{productionOrder.plannedQuantity} units</strong> · Actual Produced: <strong className="text-foreground">{productionOrder.producedQuantity} units</strong>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1 text-muted-foreground">
                    <span>No production work order attached.</span>
                    {!hasMintedUnits && canMint && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px] text-rwanda-green border-rwanda-green/40 hover:bg-emerald-50"
                        nativeButton={false}
                        render={<Link href="/dashboard/labels/print?template=unit" />}
                      >
                        <PackagePlus className="size-3 mr-1" /> Mint & Print Barcodes
                      </Button>
                    )}
                  </div>
                )}

                {rawMaterials.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                      Bill of Materials (&quot;Consumed Ingredients&quot;):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rawMaterials.map((m) => (
                        <div key={m.id} className="flex justify-between items-center rounded border border-border/60 bg-background px-2.5 py-1.5">
                          <span className="font-medium text-foreground">{m.name}</span>
                          <span className="font-mono text-muted-foreground">{m.consumedQuantity} {m.unitOfMeasure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: Quality Clearance ("Clickable if exists") ── */}
        {hasQC ? (
          <div className="relative">
            <div className="absolute -left-[29px] sm:-left-[37px] top-3 flex size-5 sm:size-6 items-center justify-center rounded-full bg-rwanda-green text-white shadow-xs">
              <ShieldCheck className="size-3 sm:size-3.5" />
            </div>

            <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleStep("qc")}
                className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rwanda-green">
                      2. Quality Clearance
                    </span>
                    <Badge className="bg-rwanda-green text-white text-[10px]">
                      {inspections[0].result}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Inspector: <strong className="text-foreground">{inspections[0].inspector}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(inspections[0].testedAt).toLocaleDateString()}
                  </span>
                  <ChevronDown className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    expandedSteps.qc && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSteps.qc && (
                <div className="border-t border-border/60 p-4 bg-muted/10 space-y-2 text-xs">
                  {inspections.map((insp) => (
                    <div key={insp.id} className="rounded border border-border/70 p-2.5 bg-background space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Official Lab Sign-off</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(insp.testedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {insp.notes && (
                        <p className="text-muted-foreground italic border-t border-border/50 pt-1 mt-1 text-[11px]">
                          &quot;{insp.notes}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-3 text-xs text-muted-foreground py-1">
            <div className="absolute -left-[25px] sm:-left-[33px] size-3 rounded-full border-2 border-border bg-background" />
            <span className="flex items-center gap-1.5 text-muted-foreground/80">
              <Clock className="size-3" /> Awaiting Quality Control laboratory inspection clearance
            </span>
          </div>
        )}

        {/* ── STEP 3: Transfer Shipments & Discrepancies ("Clickable if exists") ── */}
        {hasTransfers ? (
          <div className="relative">
            <div className={cn(
              "absolute -left-[29px] sm:-left-[37px] top-3 flex size-5 sm:size-6 items-center justify-center rounded-full text-white shadow-xs",
              metrics.discrepancyUnits > 0 ? "bg-danger" : "bg-rwanda-blue"
            )}>
              <Truck className="size-3 sm:size-3.5" />
            </div>

            <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleStep("transfers")}
                className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rwanda-blue">
                      3. Inter-Facility Logistics
                    </span>
                    <Badge variant="outline" className="text-[10px] border-border">
                      {transfers.length} Shipment{transfers.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.inTransitUnits > 0
                      ? `${metrics.inTransitUnits} units currently on the road`
                      : "All dispatched transfers received"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {metrics.discrepancyUnits > 0 ? (
                    <span className="text-xs font-bold text-danger flex items-center gap-1">
                      <AlertTriangle className="size-3.5" /> {metrics.discrepancyUnits} Missing
                    </span>
                  ) : (
                    <span className="text-xs text-rwanda-green font-semibold">
                      100% Reconciled ✓
                    </span>
                  )}
                  <ChevronDown className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    expandedSteps.transfers && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSteps.transfers && (
                <div className="border-t border-border/60 p-4 bg-muted/10 space-y-2 text-xs">
                  {transfers.map((t) => (
                    <div
                      key={t.transferId}
                      className="rounded border border-border/70 p-3 bg-background space-y-2"
                    >
                      <div className="flex items-center justify-between font-mono font-medium">
                        <span className="text-foreground font-bold">{t.reference}</span>
                        <Badge
                          className={cn(
                            "text-[10px] text-white",
                            t.status === "RECEIVED" && "bg-rwanda-green",
                            t.status === "PARTIALLY_RECEIVED" && "bg-danger",
                            t.status === "DISPATCHED" && "bg-rwanda-blue"
                          )}
                        >
                          {t.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
                        <span>{t.sourceOrgName}</span>
                        <ArrowRight className="size-3 text-rwanda-blue shrink-0" />
                        <span className="font-semibold text-foreground">{t.destinationOrgName}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/50 text-[11px] font-mono">
                        <div>Dispatched: <strong className="text-foreground">{t.dispatchedCount} units</strong></div>
                        <div>Received: <strong className="text-foreground">{t.receivedCount} units</strong></div>
                        <div>
                          {t.missingCount > 0 ? (
                            <span className="text-danger font-bold">⚠️ Variance: -{t.missingCount} units</span>
                          ) : (
                            <span className="text-rwanda-green font-semibold">Variance: 0 (Clean Handover ✓)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : hasMintedUnits ? (
          <div className="relative flex items-center gap-3 text-xs text-muted-foreground py-1">
            <div className="absolute -left-[25px] sm:-left-[33px] size-3 rounded-full border-2 border-border bg-background" />
            <span className="flex items-center gap-1.5 text-muted-foreground/80">
              <Truck className="size-3" /> Stock held at origin plant — no outgoing transfers dispatched yet
            </span>
          </div>
        ) : null}

        {/* ── STEP 4: Verified Holding Locations ("Clickable if exists") ── */}
        {hasCustody && (
          <div className="relative">
            <div className="absolute -left-[29px] sm:-left-[37px] top-3 flex size-5 sm:size-6 items-center justify-center rounded-full bg-rwanda-green text-white shadow-xs">
              <Building2 className="size-3 sm:size-3.5" />
            </div>

            <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleStep("custody")}
                className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-rwanda-green">
                    4. Verified Holding Locations
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Stock currently held across {custodyNodes.length} facility nodes
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {metrics.inStockUnits.toLocaleString()} units in custody
                  </span>
                  <ChevronDown className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    expandedSteps.custody && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSteps.custody && (
                <div className="border-t border-border/60 p-4 bg-muted/10 space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {custodyNodes.map((node, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-border/70 p-3 space-y-1.5 bg-background shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span className="truncate">{node.organizationName}</span>
                          <span className="font-mono font-bold shrink-0">{node.totalUnits} units</span>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-rwanda-green shrink-0" />
                          <span className="truncate">{node.facilityName ?? "Main Storage"}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/60">
                          {Object.entries(node.byStatus).map(([st, count]) => (
                            <Badge
                              key={st}
                              variant="secondary"
                              className="text-[9px] py-0 px-1.5 font-mono"
                            >
                              {count} {st}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5: Retail & Public Verification ("Clickable if exists") ── */}
        {hasConsumerScans && (
          <div className="relative">
            <div className="absolute -left-[29px] sm:-left-[37px] top-3 flex size-5 sm:size-6 items-center justify-center rounded-full bg-rwanda-yellow text-slate-950 font-bold shadow-xs">
              <PackageCheck className="size-3 sm:size-3.5" />
            </div>

            <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleStep("retail")}
                className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-rwanda-yellow">
                    5. Retail & Public Verification
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Units verified in consumer circulation via /verify
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {metrics.soldUnits} sold · {metrics.verificationScansCount} scans
                  </span>
                  <ChevronDown className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    expandedSteps.retail && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSteps.retail && (
                <div className="border-t border-border/60 p-4 bg-muted/10 space-y-2 text-xs">
                  <div className="rounded border border-border/70 p-3 bg-background space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Point-of-Sale Consumer Verification</span>
                      <span className="font-mono text-rwanda-green font-bold">GS1 Authenticated</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Each unit carries a cryptographic scan identity. Consumer scans confirm product authenticity in real time without exposing commercial supplier pricing or custody contracts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BatchJourneySkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      <div className="h-12 w-full rounded-md bg-muted/40" />
      <div className="h-96 rounded-md bg-muted/40" />
    </div>
  );
}
