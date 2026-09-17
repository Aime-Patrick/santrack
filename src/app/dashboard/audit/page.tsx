"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useAuditLog } from "@/hooks/audit";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useCapabilities } from "@/hooks/permissions";
import type { AuditEntry } from "@/services/audit.service";
import { cn } from "@/lib/utils";

const methodColors: Record<string, string> = {
  POST: "border-transparent bg-success text-white",
  PATCH: "border-transparent bg-primary text-white",
  PUT: "border-transparent bg-primary text-white",
  DELETE: "border-transparent bg-danger text-white",
};

const statusSolid = (code: number) => {
  if (code >= 200 && code < 300) return "border-transparent bg-success text-white";
  if (code >= 400 && code < 500)
    return "border-transparent bg-warning-foreground text-white";
  if (code >= 500) return "border-transparent bg-danger text-white";
  return "border-transparent bg-muted text-foreground";
};

const statusIcon = (code: number) => {
  if (code >= 200 && code < 300) return <CheckCircle className="size-3" />;
  if (code >= 400 && code < 500) return <AlertTriangle className="size-3" />;
  if (code >= 500) return <XCircle className="size-3" />;
  return null;
};

function truncate(text: string, max = 64): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function AuditPage() {
  const router = useRouter();
  const permissions = useCapabilities();
  // The platform-wide log is read by the operator and licensing authorities
  // (READ_AUDIT), not by a job title - an auditor at an authority sees the
  // whole platform's footprint just like the operator does.
  const isPlatform = permissions.can("READ_AUDIT");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const organizationId =
    isPlatform && orgFilter !== "all" ? Number(orgFilter) : undefined;

  const { data, isLoading } = useAuditLog(200, organizationId);
  const { data: registry } = useIndustryRegistry({ enabled: isPlatform });
  const entries = data?.entries ?? [];
  const scope = data?.scope ?? "organization";

  const successCount = entries.filter(
    (e) => e.statusCode >= 200 && e.statusCode < 300,
  ).length;
  const errorCount = entries.filter((e) => e.statusCode >= 400).length;
  const uniqueActors = new Set(entries.map((e) => e.actor)).size;
  const uniqueOrgs = new Set(
    entries
      .map((e) => e.organizationId)
      .filter((id): id is number => id != null),
  ).size;

  const columns = useMemo(() => {
    const cols: ColumnDef<TableFeatures, AuditEntry>[] = [
      {
        accessorKey: "performedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
            className="h-8 px-2"
          >
            Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const d = new Date(row.getValue("performedAt"));
          return (
            <div className="whitespace-nowrap text-sm">
              <p>{d.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                {d.toLocaleTimeString()}
              </p>
            </div>
          );
        },
      },
    ];

    if (scope === "platform" || isPlatform) {
      cols.push({
        accessorKey: "organizationName",
        header: "Organization",
        cell: ({ row }) => {
          const name = row.original.organizationName;
          return name ? (
            <div className="flex max-w-[140px] items-center gap-1.5 text-sm">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate" title={name}>
                {name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-faint">Platform</span>
          );
        },
      });
    }

    cols.push(
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <div className="flex max-w-[140px] items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <Shield className="size-3.5" />
            </div>
            <span
              className="truncate text-sm font-medium"
              title={row.getValue("actor") as string}
            >
              {row.getValue("actor")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
          const method = row.getValue("method") as string;
          return (
            <Badge
              className={
                methodColors[method] ??
                "border-transparent bg-muted text-foreground"
              }
            >
              {method}
            </Badge>
          );
        },
      },
      {
        accessorKey: "path",
        header: "Path",
        cell: ({ row }) => {
          const path = row.getValue("path") as string;
          return (
            <span
              className="block max-w-[180px] truncate font-mono text-xs text-faint"
              title={path}
            >
              {truncate(path, 40)}
            </span>
          );
        },
      },
      {
        accessorKey: "statusCode",
        header: "Status",
        cell: ({ row }) => {
          const code = row.getValue("statusCode") as number;
          return (
            <Badge className={cn(statusSolid(code), "gap-1")}>
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
          if (!detail) return <span className="text-xs text-faint">—</span>;
          return (
            <span
              className="block max-w-[220px] truncate text-xs text-muted-foreground"
              title={detail}
            >
              {truncate(detail)}
            </span>
          );
        },
      },
      {
        accessorKey: "remoteAddress",
        header: "IP",
        cell: ({ row }) => {
          const ip = row.getValue("remoteAddress") as string | null;
          return ip ? (
            <span className="whitespace-nowrap font-mono text-xs text-faint">
              {ip}
            </span>
          ) : (
            "—"
          );
        },
      },
    );

    return cols;
  }, [scope, isPlatform]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-danger text-white">
            <Shield className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">
              {isPlatform
                ? "Digital footprint of every write across all organizations on the platform."
                : "Immutable record of all write operations across your organization."}
            </p>
          </div>
        </div>

        {isPlatform && (
          <Select
            value={orgFilter}
            onValueChange={(v) => setOrgFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All organizations">
                {orgFilter === "all"
                  ? "All organizations"
                  : registry?.find((o) => String(o.id) === orgFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {(registry ?? []).map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Operations"
          value={entries.length}
          icon={<Clock className="size-4" />}
          iconBg="bg-primary"
          caption="Recent operations"
        />
        <MetricCard
          title="Success Rate"
          value={
            entries.length > 0
              ? `${Math.round((successCount / entries.length) * 100)}%`
              : "—"
          }
          badge={
            entries.length > 0 ? `${successCount}/${entries.length}` : undefined
          }
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
          title={isPlatform ? "Organizations" : "Unique Actors"}
          value={isPlatform ? uniqueOrgs : uniqueActors}
          icon={
            isPlatform ? (
              <Building2 className="size-4" />
            ) : (
              <Shield className="size-4" />
            )
          }
          iconBg="bg-primary"
          caption={isPlatform ? "Touched in this window" : "Active users"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {entries.length} recent operations
            {scope === "platform" ? " · platform-wide" : ""}
            {" · "}click a row for the full record
          </CardDescription>
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
              filterPlaceholder="Search by actor, org or path..."
              filterColumn="actor"
              pageSize={10}
              noBorder
              onRowClick={(row) => router.push(`/dashboard/audit/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
