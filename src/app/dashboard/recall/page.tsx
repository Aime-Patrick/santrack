"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  AlertTriangle,
  MapPin,
  Trash2,
  Eye,
  Plus,
  ScanLine,
  CheckCircle2,
  Loader2,
  ListFilter,
  ShieldAlert,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecalls, useInitiateRecall } from "@/hooks/recall";
import { useBatches } from "@/hooks/batches";
import { useCapabilities } from "@/hooks/permissions";
import { scanService } from "@/services/scan.service";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RecallBatch } from "@/services/recall.service";

function productLabel(row: RecallBatch): string {
  return row.productName?.trim() || "Unknown product";
}

export default function RecallPage() {
  const { data, isLoading } = useRecalls();
  const recalls = data ?? [];
  const permissions = useCapabilities();
  const canManageRecall = permissions.can("MANAGE_RECALL");
  const [issueOpen, setIssueOpen] = useState(false);

  const total = recalls.length;
  const totalUnits = recalls.reduce((sum, r) => sum + (r.affectedUnits ?? 0), 0);
  const totalLocations = recalls.reduce(
    (sum, r) => sum + (r.impactedLocations?.length ?? 0),
    0,
  );

  const columns = useMemo<ColumnDef<TableFeatures, RecallBatch>[]>(
    () => [
      {
        accessorKey: "batchNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Lot / Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/dashboard/recall/${row.original.batchId}`}
            className="flex items-center gap-2 py-0.5 hover:opacity-90"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {productLabel(row.original)}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Lot {row.original.batchNumber}
                {row.original.productSku ? ` · SKU ${row.original.productSku}` : ""}
              </p>
            </div>
          </Link>
        ),
        filterFn: (row, _id, value) => {
          const q = String(value ?? "").toLowerCase();
          if (!q) return true;
          const hay = [
            row.original.batchNumber,
            productLabel(row.original),
            row.original.productSku ?? "",
            row.original.manufacturerName ?? "",
            row.original.reason ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[220px] text-sm">
            {row.getValue("reason")}
          </span>
        ),
      },
      {
        accessorKey: "affectedUnits",
        header: "Units",
        cell: ({ row }) => (
          <Badge variant="destructive">{row.getValue("affectedUnits")}</Badge>
        ),
      },
      {
        accessorKey: "initiatedBy",
        header: "Manufacturer",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.manufacturerName ?? row.getValue("initiatedBy")}
          </span>
        ),
      },
      {
        accessorKey: "recallDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.getValue("recallDate") as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "locations",
        header: "Impact",
        cell: ({ row }) => {
          const locs = row.original.impactedLocations?.length ?? 0;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" />
              {locs} holder{locs !== 1 && "s"}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/recall/${row.original.batchId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
          >
            <Eye className="mr-1.5 size-3.5" />
            Details
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-danger text-white">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Recalls</h1>
            <p className="text-sm text-muted-foreground">
              Stop a lot in the field and see which holders still have it.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/manufacturing/trace" />}
          >
            <ScanLine className="mr-1.5 size-3.5" />
            Scan &amp; trace
          </Button>
          {canManageRecall ? (
            <Button
              size="sm"
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => setIssueOpen(true)}
            >
              <Plus className="mr-1.5 size-4" />
              Issue recall
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active recalls"
          value={total}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-danger"
          caption="Recalled lots"
        />
        <MetricCard
          title="Units affected"
          value={totalUnits}
          icon={<Trash2 className="size-4" />}
          iconBg="bg-danger"
          caption="Across all recalls"
        />
        <MetricCard
          title="Holders impacted"
          value={totalLocations}
          icon={<MapPin className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Distribution points"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recall history</CardTitle>
          <CardDescription>
            {total === 0
              ? "No recalls issued yet"
              : `${total} recall${total === 1 ? "" : "s"} — open a row for impact and response`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading recalls…
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertTriangle className="size-8 text-border" />
              <div>
                <p className="text-sm font-medium text-foreground">No recalls yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When a lot must leave the market, issue a recall here. Impact
                  follows the same identities used in Scan &amp; trace.
                </p>
              </div>
              {canManageRecall ? (
                <Button
                  size="sm"
                  className="bg-danger text-white hover:bg-danger/90"
                  onClick={() => setIssueOpen(true)}
                >
                  <Plus className="mr-1.5 size-4" />
                  Issue first recall
                </Button>
              ) : null}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={recalls}
              filterPlaceholder="Search by product, lot or SKU…"
              filterColumn="batchNumber"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <IssueRecallDialog open={issueOpen} onOpenChange={setIssueOpen} />
    </div>
  );
}

function IssueRecallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: batches } = useBatches();
  const initiate = useInitiateRecall();
  const [batchId, setBatchId] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [scanMode, setScanMode] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const recallable = (batches ?? []).filter((b) => b.status !== "RECALLED");
  const chosen = recallable.find((b) => String(b.id) === batchId);

  const handleScan = async (code: string) => {
    const scanned = code.trim();
    if (!scanned) return;

    // A lot code is already in the open dialog's batch list. Resolve it here
    // first: it is instant and remains useful when the scan service is slow.
    const findLocalLot = (value: string) => {
      const normalised = value.trim().toLowerCase();
      return recallable.find((batch) => {
        const batchCode = batch.batchCode.toLowerCase();
        return (
          batchCode === normalised ||
          String(batch.id) === normalised ||
          (batchCode.length >= 3 && normalised.includes(batchCode))
        );
      });
    };

    const directLot = findLocalLot(scanned);
    if (directLot) {
      setBatchId(String(directLot.id));
      setScanError(null);
      return;
    }

    setIsResolving(true);
    setScanError(null);
    try {
      const res = await scanService.resolve(scanned);
      let matchedBatchId: number | undefined = res.batchId;

      if (!matchedBatchId && res.carried?.batchCode) {
        const found = findLocalLot(res.carried.batchCode);
        if (found) matchedBatchId = found.id;
      }

      if (matchedBatchId) {
        setBatchId(String(matchedBatchId));
      } else {
        setScanError(
          res.kind === "UNKNOWN"
            ? "No active lot matches this code. Keep the camera open and scan the lot label or select it from the list."
            : res.describes || "Could not identify a recallable lot from this code.",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        setScanError("Session expired — please log in again.");
      } else if (msg.includes("Network") || msg.includes("fetch")) {
        setScanError("Cannot reach the server — check your connection.");
      } else {
        setScanError(`Scan failed: ${msg.slice(0, 120)}`);
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setBatchId("");
          setReason("");
          setStep(1);
          setScanError(null);
          setScanMode(true);
        }
        onOpenChange(next);
      }}
    >
      <DialogPopup className="w-[calc(100vw-10rem)] max-h-[90vh] overflow-y-auto p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger text-white shadow-sm shadow-danger/25">
              <ShieldAlert className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-danger">Safety action</p>
              <DialogTitle className="text-2xl">Issue product recall</DialogTitle>
              <DialogDescription>
                Stop a specific lot across every distribution point.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-danger">Before issuing:</span>{" "}
            confirm the lot and record enough detail for the response team to act.
          </div>


          <div className="space-y-6">
          {/* ── Lot identification ── */}
          <section className={cn("space-y-3", step !== 1 && "hidden")} aria-labelledby="recall-lot-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
              <div>
                <h3 id="recall-lot-heading" className="text-base font-semibold">Identify the lot</h3>
                <p className="text-sm text-muted-foreground">Scan a code or choose an active lot.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 rounded-xl border border-input bg-muted/35 p-1.5" role="tablist" aria-label="Lot identification method">
              <button type="button" role="tab" aria-selected={scanMode} onClick={() => setScanMode(true)} className={cn("flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors", scanMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <ScanLine className="size-4" /> Scan code
              </button>
              <button type="button" role="tab" aria-selected={!scanMode} onClick={() => setScanMode(false)} className={cn("flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors", !scanMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <ListFilter className="size-4" /> Choose lot
              </button>
            </div>

            {scanMode ? (
              <>
                <QrScanInput
                  compact
                  aspect="square"
                  onScan={handleScan}
                  placeholder="Scan barcode or type lot code…"
                  scanning="a product unit or lot code"
                />

                {isResolving && (
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground" aria-live="polite">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    Identifying lot…
                  </div>
                )}

                {scanError && !isResolving && (
                  <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-xs leading-relaxed text-danger" role="alert">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}
              </>
            ) : (
              <Select value={batchId} onValueChange={(v) => {
                setBatchId(v ?? "");
              }}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Choose an active lot">
                    {chosen
                      ? () => `${chosen.batchCode} — ${chosen.productName}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {recallable.map((batch) => (
                    <SelectItem key={batch.id} value={String(batch.id)}>
                      {batch.batchCode} — {batch.productName} ({batch.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Identified lot card — shown regardless of mode */}
            {chosen && (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-3 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{chosen.productName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Lot {chosen.batchCode}
                    {chosen.expiresOn ? ` · Exp ${chosen.expiresOn.slice(0, 10)}` : ""}
                    {" · "}
                    <Badge variant="outline" className="text-[10px] px-1 py-0 align-middle">
                      {chosen.status}
                    </Badge>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Reason ── */}
          <section className={cn("space-y-3", step !== 2 && "hidden")} aria-labelledby="recall-reason-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">2</span>
              <div>
                <h3 id="recall-reason-heading" className="text-base font-semibold">Record the reason</h3>
                <p className="text-sm text-muted-foreground">This will be visible to your response team.</p>
              </div>
            </div>
            <Label htmlFor="recall-reason" className="sr-only">Recall reason and findings</Label>
            <Textarea
              id="recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the hazard, contamination, or regulatory non-compliance…"
              className="min-h-[180px] resize-none text-sm leading-relaxed md:min-h-[300px]"
            />
            <p className="text-xs text-muted-foreground">Include what was found, where, and the immediate action required.</p>
          </section>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={initiate.isPending}>
              Back
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!batchId}>
              Continue
            </Button>
          )}
          {step === 2 && (
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            disabled={!batchId || !reason.trim() || initiate.isPending}
            onClick={() =>
              initiate.mutate(
                { batchId: Number(batchId), reason: reason.trim() },
                {
                  onSuccess: () => {
                    setBatchId("");
                    setReason("");
                    onOpenChange(false);
                    toast.success("Product recall issued across all distribution points.");
                  },
                },
              )
            }
          >
            {initiate.isPending ? "Issuing recall…" : "Issue recall"}
          </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
