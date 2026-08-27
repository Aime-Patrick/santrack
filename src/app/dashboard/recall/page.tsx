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
            <h1 className="text-xl font-bold tracking-tight">Product Recall</h1>
            <p className="text-sm text-muted-foreground">
              Manage product recalls and track affected units across locations.
            </p>
          </div>
        </div>
        {canManageRecall ? (
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            onClick={() => setIssueOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Issue recall
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active Recalls"
          value={total}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-danger"
          caption="Recalled batches"
        />
        <MetricCard
          title="Units Affected"
          value={totalUnits}
          icon={<Trash2 className="size-4" />}
          iconBg="bg-danger"
          caption="Across all recalls"
        />
        <MetricCard
          title="Locations Impacted"
          value={totalLocations}
          icon={<MapPin className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Distribution points"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recall History</CardTitle>
          <CardDescription>
            {total} recall events — open a row for the full impact page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading recalls...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={recalls}
              filterPlaceholder="Search by product, lot or SKU..."
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

  const recallable = (batches ?? []).filter((b) => b.status !== "RECALLED");
  const chosen = recallable.find((b) => String(b.id) === batchId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setBatchId("");
          setReason("");
        }
        onOpenChange(next);
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue recall</DialogTitle>
          <DialogDescription>
            Pulls the lot wherever its units are — including stock already
            shipped or sold.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Lot</Label>
            <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select a lot">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="recall-reason">Reason</Label>
            <Textarea
              id="recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What is wrong with this lot?"
              className="min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
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
                  },
                },
              )
            }
          >
            {initiate.isPending ? "Issuing…" : "Issue recall"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
