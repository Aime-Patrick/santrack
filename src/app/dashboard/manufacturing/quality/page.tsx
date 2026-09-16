"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Clock,
  Eye,
  PackagePlus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
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
import { MetricCard } from "@/components/dashboard/stat-card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextDisplay } from "@/components/ui/rich-text";
import {
  useQualityInspections,
  useCreateInspection,
  useInspectionEligibility,
} from "@/hooks/manufacturing";
import { useBatches } from "@/hooks/batches";
import type { QualityInspection } from "@/services/manufacturing.service";
import type { Batch } from "@/services/batch.service";
import Link from "next/link";

/**
 * Quality control — the gate between a finished run and product identity.
 *
 * A lot must be APPROVED before any unit can be registered against it.
 * After approval the next step is Register Package (packaging workflow).
 */

const VERDICTS = [
  {
    value: "APPROVED",
    label: "Approved",
    effect: "The lot may now be given product identities.",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    effect: "No identities may be assigned. The lot can be re-inspected after rework.",
  },
  {
    value: "REWORK",
    label: "Rework",
    effect: "Sent back to production to be made right, then inspected again.",
  },
  {
    value: "QUARANTINE",
    label: "Quarantine",
    effect: "Held aside pending a decision. Nothing moves until it is resolved.",
  },
] as const;

const resultColors: Record<string, string> = {
  APPROVED: "border-transparent bg-success text-white",
  REJECTED: "border-transparent bg-danger text-white",
  REWORK: "border-transparent bg-warning-foreground text-white",
  QUARANTINE: "border-transparent bg-warning-foreground text-white",
};

const batchStatusColors: Record<string, string> = {
  PENDING_QC: "border-transparent bg-amber-500 text-white",
  APPROVED: "border-transparent bg-emerald-600 text-white",
  ACTIVE: "border-transparent bg-emerald-600 text-white",
  REJECTED: "border-transparent bg-red-600 text-white",
  REWORK: "border-transparent bg-orange-500 text-white",
  QUARANTINED: "border-transparent bg-orange-500 text-white",
  RECALLED: "border-transparent bg-red-700 text-white",
  CLOSED: "border-transparent bg-slate-500 text-white",
};

// ── Inspection log columns ────────────────────────────────────────────────────

function buildColumns(
  onView: (row: QualityInspection) => void,
): ColumnDef<TableFeatures, QualityInspection>[] {
  return [
    {
      accessorKey: "productionOrderNumber",
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
      cell: ({ row }) => {
        const value = row.getValue("productionOrderNumber") as string | null;
        return <span className="font-mono text-sm">{value ?? "—"}</span>;
      },
    },
    {
      accessorKey: "batchCode",
      header: "Lot",
      cell: ({ row }) => {
        const code = row.original.batchCode;
        return code ? <span className="font-mono text-sm">{code}</span> : "—";
      },
    },
    {
      accessorKey: "result",
      header: "Verdict",
      cell: ({ row }) => {
        const result = row.getValue("result") as string;
        return (
          <Badge
            variant="outline"
            className={resultColors[result] ?? "border-border bg-muted/60 text-muted-foreground"}
          >
            {result}
          </Badge>
        );
      },
    },
    {
      accessorKey: "inspectorName",
      header: "Inspector",
      cell: ({ row }) => <span className="text-sm">{row.getValue("inspectorName")}</span>,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const raw = (row.getValue("notes") as string | null) ?? "";
        // Strip HTML tags for the table preview
        const plain = raw.replace(/<[^>]+>/g, "").trim();
        return (
          <span className="max-w-[200px] truncate text-sm text-muted-foreground">
            {plain || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "testedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Inspected
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("testedAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => onView(row.original)}
          title="View details"
        >
          <Eye className="size-3.5" />
        </Button>
      ),
    },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QualityInspectionsPage() {
  const { data, isLoading } = useQualityInspections();
  const { data: batches } = useBatches();
  const createInspection = useCreateInspection();

  const [verdictOpen, setVerdictOpen] = useState(false);
  const [preselectedBatchId, setPreselectedBatchId] = useState<string>("");
  const [viewTarget, setViewTarget] = useState<QualityInspection | null>(null);

  const inspections = data?.content ?? [];
  const total = data?.total ?? 0;
  const approved = inspections.filter((i) => i.result === "APPROVED").length;
  const rejected = inspections.filter((i) => i.result === "REJECTED").length;

  const awaiting = (batches ?? []).filter((b) => b.status === "PENDING_QC");
  const approvedBatches = (batches ?? []).filter((b) => b.status === "APPROVED");

  function openVerdictFor(batch?: Batch) {
    setPreselectedBatchId(batch ? String(batch.id) : "");
    setVerdictOpen(true);
  }

  const columns = buildColumns((row) => setViewTarget(row));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quality Control</h1>
            <p className="text-sm text-muted-foreground">
              A lot must be approved before any unit can be registered against it.
            </p>
          </div>
        </div>
        <Button onClick={() => openVerdictFor()}>
          <ClipboardCheck className="mr-2 size-4" /> Record verdict
        </Button>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Awaiting inspection"
          value={awaiting.length}
          icon={<Clock className="size-4" />}
          iconBg="bg-warning text-foreground"
          caption="Lots at PENDING_QC"
        />
        <MetricCard
          title="Inspections"
          value={total}
          icon={<ShieldCheck className="size-4" />}
          iconBg="bg-primary"
          caption="Verdicts recorded"
        />
        <MetricCard
          title="Approved"
          value={total > 0 ? `${Math.round((approved / total) * 100)}%` : "—"}
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-success"
          caption={`${approved} lots cleared`}
        />
        <MetricCard
          title="Rejected"
          value={rejected}
          icon={<XCircle className="size-4" />}
          iconBg="bg-danger"
          caption="Needs rework"
        />
      </div>

      {/* ── Waiting on you ── */}
      {awaiting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waiting on you</CardTitle>
            <CardDescription>
              These runs are finished. Nothing can be packed or shipped from them until a verdict is
              recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {awaiting.map((batch) => (
              <button
                key={batch.id}
                onClick={() => openVerdictFor(batch)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:border-primary"
              >
                <span className="font-mono text-sm">{batch.batchCode}</span>
                <span className="text-sm text-muted-foreground">{batch.productName}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Next step: register packages for approved lots ── */}
      {approvedBatches.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <PackagePlus className="size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                {approvedBatches.length} approved {approvedBatches.length === 1 ? "lot" : "lots"}{" "}
                ready for packaging
              </p>
              <p className="text-xs text-emerald-700">
                Register packages and assign product identities to proceed.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/manufacturing"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 transition-colors"
          >
            Go to pipeline <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* ── Inspection log ── */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection log</CardTitle>
          <CardDescription>
            {total} verdicts. Rejection is not terminal — a lot can be reworked and looked at again,
            right up until any of it has been dispatched.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading inspections...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={inspections}
              filterPlaceholder="Search inspections..."
              filterColumn="productionOrderNumber"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <VerdictDialog
        open={verdictOpen}
        onOpenChange={(next) => {
          if (!next) setPreselectedBatchId("");
          setVerdictOpen(next);
        }}
        batches={batches ?? []}
        preselectedBatchId={preselectedBatchId}
        onSubmit={(payload) =>
          createInspection.mutate(payload, { onSuccess: () => setVerdictOpen(false) })
        }
        pending={createInspection.isPending}
      />

      <InspectionDetailDialog
        inspection={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </div>
  );
}

// ── Verdict dialog ────────────────────────────────────────────────────────────

function VerdictDialog({
  open,
  onOpenChange,
  batches,
  preselectedBatchId,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: Batch[];
  preselectedBatchId: string;
  onSubmit: (data: { batchId: number; result: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [batchId, setBatchId] = useState(preselectedBatchId);
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");

  // Sync preselected batch whenever the dialog opens with a specific batch
  const effectiveBatchId = batchId || preselectedBatchId;

  const chosen = batches.find((b) => String(b.id) === effectiveBatchId);
  const selectedId = effectiveBatchId ? Number(effectiveBatchId) : null;
  const { data: eligibility, isFetching: checking } = useInspectionEligibility(selectedId);
  const blocked = eligibility != null && !eligibility.allowed;

  const inspectable = batches.filter((b) =>
    ["PENDING_QC", "APPROVED", "REJECTED", "REWORK", "QUARANTINED", "ACTIVE"].includes(b.status),
  );

  function reset() {
    setBatchId("");
    setResult("");
    setNotes("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a quality verdict</DialogTitle>
          <DialogDescription>
            Choose the lot and the result. After goods are shipped or sold, use a recall instead of
            changing this verdict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lot */}
          <div className="space-y-2">
            <Label>Lot</Label>
            <Select
              value={effectiveBatchId}
              onValueChange={(v) => setBatchId(v ?? "")}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select a lot">
                  {chosen ? () => `${chosen.batchCode} — ${chosen.productName}` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {inspectable.map((batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>
                        {batch.batchCode} — {batch.productName}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          batchStatusColors[batch.status] ??
                          "border-transparent bg-slate-500 text-white"
                        }
                      >
                        {batch.status === "PENDING_QC" ? "Pending QC" : batch.status}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosen && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={
                    batchStatusColors[chosen.status] ??
                    "border-transparent bg-slate-500 text-white"
                  }
                >
                  {chosen.status === "PENDING_QC" ? "Pending QC" : chosen.status}
                </Badge>
              </div>
            )}
            {checking && (
              <p className="text-xs text-muted-foreground">Checking this lot…</p>
            )}
            {blocked && eligibility?.reason && (
              <div className="rounded-lg border border-warning/40 bg-amber-50 px-3 py-2 text-sm text-foreground">
                <p>{eligibility.reason}</p>
                <Link
                  href="/dashboard/recall"
                  className="mt-1 inline-block text-sm font-medium text-primary underline"
                >
                  Go to Recalls
                </Link>
              </div>
            )}
          </div>

          {/* Verdict */}
          <div className="space-y-2">
            <Label>Verdict</Label>
            <Select value={result} onValueChange={(v) => setResult(v ?? "")} disabled={blocked}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select a verdict" />
              </SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {result && (
              <p className="text-xs text-muted-foreground">
                {VERDICTS.find((v) => v.value === result)?.effect}
              </p>
            )}
          </div>

          {/* Notes — rich text */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Optional inspection notes — findings, measurements, references…"
              minHeight={100}
              disabled={blocked}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!effectiveBatchId || !result || pending || blocked || checking}
            onClick={() =>
              onSubmit({
                batchId: Number(effectiveBatchId),
                result,
                notes: notes.trim() || undefined,
              })
            }
          >
            {pending ? "Recording..." : "Record verdict"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ── Inspection detail dialog ──────────────────────────────────────────────────

function InspectionDetailDialog({
  inspection,
  onClose,
}: {
  inspection: QualityInspection | null;
  onClose: () => void;
}) {
  if (!inspection) return null;

  const result = inspection.result;
  const color = resultColors[result] ?? "border-border bg-muted/60 text-muted-foreground";

  return (
    <Dialog open={!!inspection} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Inspection #{inspection.id}
            <Badge variant="outline" className={color}>
              {result}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {inspection.batchCode
              ? `Lot ${inspection.batchCode}`
              : inspection.productionOrderNumber
              ? `Order ${inspection.productionOrderNumber}`
              : "No lot reference"}
            {" · "}
            Inspected by {inspection.inspectorName}
            {" · "}
            {new Date(inspection.testedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {inspection.notes ? (
            <RichTextDisplay
              html={inspection.notes}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3"
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">No notes recorded.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
