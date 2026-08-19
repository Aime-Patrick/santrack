"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useQualityInspections } from "@/hooks/manufacturing";
import type { QualityInspection } from "@/services/manufacturing.service";

const resultColors: Record<string, string> = {
  PASS: "border-success/30 bg-success/10 text-success",
  FAIL: "border-danger/30 bg-danger/10 text-danger",
  CONDITIONAL: "border-warning/30 bg-warning/10 text-warning-foreground",
};

const columns: ColumnDef<TableFeatures, QualityInspection>[] = [
  {
    accessorKey: "productionOrderNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Production Order
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const num = row.getValue("productionOrderNumber") as string | null;
      return num ? (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-4" />
          </div>
          <span className="font-mono text-sm">{num}</span>
        </div>
      ) : "—";
    },
  },
  {
    accessorKey: "batchCode",
    header: "Batch",
    cell: ({ row }) => {
      const code = row.getValue("batchCode") as string | null;
      return code ? <span className="font-mono text-sm text-faint">{code}</span> : "—";
    },
  },
  {
    accessorKey: "inspectorName",
    header: "Inspector",
    cell: ({ row }) => <span className="text-sm">{row.getValue("inspectorName")}</span>,
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const result = row.getValue("result") as string;
      return <Badge variant="outline" className={resultColors[result] ?? "border-border bg-muted/60 text-muted-foreground"}>{result}</Badge>;
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string | null;
      return notes ? <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{notes}</span> : "—";
    },
  },
  {
    accessorKey: "testedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Tested
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = new Date(row.getValue("testedAt") as string);
      return <span className="text-sm">{d.toLocaleDateString()}</span>;
    },
  },
];

export default function QualityInspectionsPage() {
  const { data, isLoading } = useQualityInspections();
  const inspections = data?.content ?? [];
  const total = data?.total ?? 0;
  const passCount = inspections.filter((i) => i.result === "PASS").length;
  const failCount = inspections.filter((i) => i.result === "FAIL").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quality Inspections</h1>
          <p className="text-sm text-muted-foreground">Track quality control results and inspections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Inspections" value={total} icon={<ShieldCheck className="size-4" />} iconBg="bg-primary" caption="All inspections" />
        <MetricCard title="Pass Rate" value={total > 0 ? `${Math.round((passCount / total) * 100)}%` : "—"} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption={`${passCount} passed`} />
        <MetricCard title="Failed" value={failCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Requires attention" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Log</CardTitle>
          <CardDescription>{total} inspections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading inspections...</div>
          ) : (
            <DataTable columns={columns} data={inspections} filterPlaceholder="Search inspections..." filterColumn="productionOrderNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
