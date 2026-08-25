"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ShieldCheck, CheckCircle, XCircle, ClipboardCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useQualityInspections, useCreateInspection } from "@/hooks/manufacturing";
import { useBatches } from "@/hooks/batches";
import type { QualityInspection } from "@/services/manufacturing.service";
import type { Batch } from "@/services/batch.service";

/**
 * Quality control — the gate between a finished run and product identity.
 *
 * This page used to list verdicts without being able to record one, which left
 * the centre of the canonical lifecycle unreachable: a lot sits at PENDING_QC
 * and no unit can be registered against it until someone approves it.
 */

/** The verdicts the API accepts, and what each does to the lot. */
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
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  REWORK: "border-warning/30 bg-warning/10 text-warning",
  QUARANTINE: "border-warning/30 bg-warning/10 text-warning",
};

const batchStatusColors: Record<string, string> = {
  PENDING_QC: "border-warning/30 bg-warning/10 text-warning",
  APPROVED: "border-success/30 bg-success/10 text-success",
  ACTIVE: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  REWORK: "border-warning/30 bg-warning/10 text-warning",
  QUARANTINED: "border-warning/30 bg-warning/10 text-warning",
  RECALLED: "border-danger/30 bg-danger/10 text-danger",
};

const columns: ColumnDef<TableFeatures, QualityInspection>[] = [
  {
    accessorKey: "productionOrderNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
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
        <Badge variant="outline" className={resultColors[result] ?? "border-border bg-muted/60 text-muted-foreground"}>
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
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("notes") || "—"}</span>
    ),
  },
  {
    accessorKey: "testedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Inspected
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{new Date(row.getValue("testedAt") as string).toLocaleDateString()}</span>
    ),
  },
];

export default function QualityInspectionsPage() {
  const { data, isLoading } = useQualityInspections();
  const { data: batches } = useBatches();
  const createInspection = useCreateInspection();

  const [open, setOpen] = useState(false);

  const inspections = data?.content ?? [];
  const total = data?.total ?? 0;
  const approved = inspections.filter((i) => i.result === "APPROVED").length;
  const rejected = inspections.filter((i) => i.result === "REJECTED").length;

  const awaiting = (batches ?? []).filter((b) => b.status === "PENDING_QC");

  return (
    <div className="space-y-6">
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
        <Button onClick={() => setOpen(true)}>
          <ClipboardCheck className="mr-2 size-4" /> Record verdict
        </Button>
      </div>

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

      {awaiting.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Waiting on you</CardTitle>
            <CardDescription>
              These runs are finished. Nothing can be packed or shipped from them until a verdict
              is recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {awaiting.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:border-primary"
              >
                <span className="font-mono text-sm">{batch.batchCode}</span>
                <span className="text-sm text-muted-foreground">{batch.productName}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Inspection log</CardTitle>
          <CardDescription>
            {total} verdicts. Rejection is not terminal — a lot can be reworked and looked at
            again, right up until any of it has been dispatched.
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

      <VerdictDialog
        open={open}
        onOpenChange={setOpen}
        batches={batches ?? []}
        onSubmit={(payload) =>
          createInspection.mutate(payload, { onSuccess: () => setOpen(false) })
        }
        pending={createInspection.isPending}
      />
    </div>
  );
}

function VerdictDialog({
  open,
  onOpenChange,
  batches,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: Batch[];
  onSubmit: (data: { batchId: number; result: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [batchId, setBatchId] = useState("");
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");

  const chosen = batches.find((b) => String(b.id) === batchId);
  const verdict = VERDICTS.find((v) => v.value === result);

  // A recalled or closed lot is past inspecting; the API refuses those, so do
  // not offer them.
  const inspectable = batches.filter((b) =>
    ["PENDING_QC", "APPROVED", "REJECTED", "REWORK", "QUARANTINED", "ACTIVE"].includes(b.status),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setBatchId("");
          setResult("");
          setNotes("");
        }
        onOpenChange(next);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Record a quality verdict</DialogTitle>
          <DialogDescription>
            The verdict moves the lot. Once any of it has been dispatched or sold, a new verdict is
            refused — that is a recall, not a re-inspection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Lot</Label>
            <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
              <SelectTrigger>
                {/* The trigger otherwise shows the raw value, which is the batch id. */}
                <SelectValue placeholder="Which lot was inspected">
                  {chosen ? () => `${chosen.batchCode} — ${chosen.productName}` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {inspectable.map((batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>
                    {batch.batchCode} — {batch.productName} ({batch.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosen ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Currently</span>
                <Badge
                  variant="outline"
                  className={batchStatusColors[chosen.status] ?? "border-border bg-muted/60 text-muted-foreground"}
                >
                  {chosen.status}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Verdict</Label>
            <Select value={result} onValueChange={(v) => setResult(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="What did the inspection find" />
              </SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {verdict ? (
              <p className="text-xs text-muted-foreground">{verdict.effect}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="verdict-notes">Notes</Label>
            <Input
              id="verdict-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was checked, and what was found"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!batchId || !result || pending}
            onClick={() =>
              onSubmit({
                batchId: Number(batchId),
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
