"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart3, Package, Truck, ClipboardCheck, Layers, Ship,
  ShoppingCart, ArrowRightLeft, FileCheck, Wrench, Download, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useReportData } from "@/hooks/reports";
import { REPORT_TYPES, reportService } from "@/services/report.service";
import type { ReportMeta } from "@/services/report.service";

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  production: { icon: <BarChart3 className="size-5 text-white" />, color: "text-white", bg: "bg-success" },
  inventory: { icon: <Package className="size-5 text-white" />, color: "text-white", bg: "bg-primary" },
  "stock-movement": { icon: <Truck className="size-5 text-white" />, color: "text-white", bg: "bg-primary" },
  quality: { icon: <ClipboardCheck className="size-5 text-white" />, color: "text-white", bg: "bg-warning-foreground" },
  batch: { icon: <Layers className="size-5 text-white" />, color: "text-white", bg: "bg-primary" },
  shipment: { icon: <Ship className="size-5 text-white" />, color: "text-white", bg: "bg-primary" },
  sales: { icon: <ShoppingCart className="size-5 text-white" />, color: "text-white", bg: "bg-success" },
  transfer: { icon: <ArrowRightLeft className="size-5 text-white" />, color: "text-white", bg: "bg-primary" },
  licensing: { icon: <FileCheck className="size-5 text-white" />, color: "text-white", bg: "bg-danger" },
  materials: { icon: <Wrench className="size-5 text-white" />, color: "text-white", bg: "bg-warning-foreground" },
};

function buildColumns(keys: string[]): ColumnDef<TableFeatures, Record<string, unknown>>[] {
  return keys.map((key) => ({
    accessorKey: key,
    header: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    cell: ({ row }) => {
      const val = row.getValue(key);
      if (val == null) return "—";
      if (val instanceof Date) return val.toLocaleDateString();
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        return new Date(val).toLocaleDateString();
      }
      return String(val);
    },
  }));
}

function ReportCard({
  meta,
  isActive,
  onSelect,
}: {
  meta: ReportMeta;
  isActive: boolean;
  onSelect: () => void;
}) {
  const config = categoryConfig[meta.name] ?? { icon: <Package className="size-5 text-white" />, color: "text-white", bg: "bg-primary" };

  return (
    <button
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        isActive
          ? "border-primary bg-primary-light shadow-sm ring-1 ring-primary/20"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/30 hover:shadow-xs"
      }`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${config.bg} text-white`}>
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{meta.label}</p>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>
    </button>
  );
}

export default function ReportsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { data, isLoading } = useReportData(selected ?? "", !!selected);

  const rows = data ?? [];
  const columns = rows.length > 0 ? buildColumns(Object.keys(rows[0])) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              View and export operational data across your organization.
            </p>
          </div>
        </div>
        {selected && (
          <Button
            variant="outline"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await reportService.exportCsv(selected);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="mr-2 size-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        )}
      </div>

      {/* Report type cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {REPORT_TYPES.map((r) => (
          <ReportCard
            key={r.name}
            meta={r}
            isActive={selected === r.name}
            onSelect={() => setSelected(r.name === selected ? null : r.name)}
          />
        ))}
      </div>

      {/* Report data table */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>{REPORT_TYPES.find((r) => r.name === selected)?.label}</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${rows.length} rows`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading report data...
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No data available for this report.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                filterPlaceholder="Filter..."
                filterColumn={Object.keys(rows[0])[0]}
                pageSize={10}
                noBorder
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selected && (
        <Card>
          <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-white">
                <Eye className="size-6" />
              </div>
              <p className="font-medium">Select a report above</p>
              <p className="text-sm">Choose a report type to view and export its data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
