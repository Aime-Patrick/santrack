"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Shield, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useAuditLog } from "@/hooks/audit";
import type { AuditEntry } from "@/services/audit.service";

const methodColors: Record<string, string> = {
  POST: "border-success/30 bg-success/10 text-success",
  PATCH: "border-primary/30 bg-primary/10 text-primary",
  PUT: "border-primary/30 bg-primary/10 text-primary",
  DELETE: "border-danger/30 bg-danger/10 text-danger",
};

const statusColors = (code: number) => {
  if (code >= 200 && code < 300) return "border-success/30 bg-success/10 text-success";
  if (code >= 400 && code < 500) return "border-warning/30 bg-warning/10 text-warning-foreground";
  if (code >= 500) return "border-danger/30 bg-danger/10 text-danger";
  return "border-border bg-muted/60 text-muted-foreground";
};

const statusIcon = (code: number) => {
  if (code >= 200 && code < 300) return <CheckCircle className="size-3" />;
  if (code >= 400 && code < 500) return <AlertTriangle className="size-3" />;
  if (code >= 500) return <XCircle className="size-3" />;
  return null;
};

const columns: ColumnDef<TableFeatures, AuditEntry>[] = [
  {
    accessorKey: "performedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = new Date(row.getValue("performedAt"));
      return (
        <div className="text-sm">
          <p>{d.toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">{d.toLocaleTimeString()}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "actor",
    header: "Actor",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
          <Shield className="size-3.5" />
        </div>
        <span className="text-sm font-medium">{row.getValue("actor")}</span>
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      return (
        <Badge variant="outline" className={methodColors[method] ?? "border-border bg-muted/60 text-muted-foreground"}>
          {method}
        </Badge>
      );
    },
  },
  {
    accessorKey: "path",
    header: "Path",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-faint">{row.getValue("path")}</span>
    ),
  },
  {
    accessorKey: "statusCode",
    header: "Status",
    cell: ({ row }) => {
      const code = row.getValue("statusCode") as number;
      return (
        <Badge variant="outline" className={`${statusColors(code)} gap-1`}>
          {statusIcon(code)}
          {code}
        </Badge>
      );
    },
  },
  {
    accessorKey: "detail",
    header: "Detail",
    cell: ({ row }) => {
      const detail = row.getValue("detail") as string | null;
      return detail ? <span className="text-xs text-muted-foreground">{detail}</span> : "—";
    },
  },
  {
    accessorKey: "remoteAddress",
    header: "IP",
    cell: ({ row }) => {
      const ip = row.getValue("remoteAddress") as string | null;
      return ip ? <span className="font-mono text-xs text-faint">{ip}</span> : "—";
    },
  },
];

export default function AuditPage() {
  const { data, isLoading } = useAuditLog(200);
  const entries = data?.entries ?? [];

  const successCount = entries.filter((e) => e.statusCode >= 200 && e.statusCode < 300).length;
  const errorCount = entries.filter((e) => e.statusCode >= 400).length;
  const uniqueActors = new Set(entries.map((e) => e.actor)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-danger text-white">
          <Shield className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Immutable record of all write operations across your organization.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Operations"
          value={entries.length}
          icon={<Clock className="size-4" />}
          iconBg="bg-primary"
          caption="Recent operations"
        />
        <MetricCard
          title="Success Rate"
          value={entries.length > 0 ? `${Math.round((successCount / entries.length) * 100)}%` : "—"}
          badge={entries.length > 0 ? `${successCount}/${entries.length}` : undefined}
          badgeType="positive"
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-success"
          caption="2xx responses"
        />
        <MetricCard
          title="Errors"
          value={errorCount}
          badgeType={errorCount > 0 ? "negative" : "positive"}
          icon={<XCircle className="size-4" />}
          iconBg="bg-danger"
          caption="4xx + 5xx responses"
        />
        <MetricCard
          title="Unique Actors"
          value={uniqueActors}
          icon={<Shield className="size-4" />}
          iconBg="bg-primary"
          caption="Active users / services"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>{entries.length} recent operations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading audit logs...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={entries}
              filterPlaceholder="Search by actor or path..."
              filterColumn="actor"
              pageSize={15}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
