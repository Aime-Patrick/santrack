"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Building2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useComplianceFindings } from "@/hooks/licensing";
import type { ComplianceFindingRow } from "@/services/license.service";

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  UNLICENSED_ACTIVITY: {
    label: "Unlicensed activity",
    className: "border-red-600 bg-red-600 text-white dark:border-red-700 dark:bg-red-700",
  },
  EXPIRED_LICENCE: {
    label: "Expired licence",
    className: "border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600",
  },
  SUSPENDED_LICENCE: {
    label: "Suspended licence",
    className: "border-orange-500 bg-orange-500 text-white dark:border-orange-600 dark:bg-orange-600",
  },
};

function truncate(text: string, max = 72): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function IndustryFindingsPage() {
  const router = useRouter();
  const { data, isLoading } = useComplianceFindings();
  const findings = data?.findings ?? [];

  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of findings) {
      counts[f.type] = (counts[f.type] ?? 0) + 1;
    }
    return counts;
  }, [findings]);

  const uniqueOrgs = useMemo(
    () => new Set(findings.map((f) => f.organizationId)).size,
    [findings],
  );

  const columns = useMemo<ColumnDef<TableFeatures, ComplianceFindingRow>[]>(
    () => [
      {
        accessorKey: "recordedAt",
        header: "When",
        cell: ({ row }) => {
          const d = new Date(row.getValue("recordedAt"));
          return (
            <div className="text-sm">
              <p>{d.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                {d.toLocaleTimeString()}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "organizationName",
        header: "Organization",
        cell: ({ row }) => (
          <div className="flex max-w-[160px] items-center gap-1.5 text-sm">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.getValue("organizationName")}</span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Finding",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return (
            <Badge
              variant="outline"
              className={TYPE_CONFIG[type]?.className ?? "border-muted bg-muted text-muted-foreground"}
            >
              {TYPE_CONFIG[type]?.label ?? type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "activity",
        header: "Activity",
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("activity") ?? "—"}</span>
        ),
      },
      {
        accessorKey: "licenseNumber",
        header: "Licence",
        cell: ({ row }) => {
          const n = row.getValue("licenseNumber") as string | null;
          return n ? (
            <span className="font-mono text-xs">{n}</span>
          ) : (
            <span className="text-xs text-faint">—</span>
          );
        },
      },
      {
        accessorKey: "detail",
        header: "Detail",
        cell: ({ row }) => {
          const detail = (row.getValue("detail") as string) || "";
          return detail ? (
            <span
              className="block max-w-[280px] truncate text-xs text-muted-foreground"
              title={detail}
            >
              {truncate(detail)}
            </span>
          ) : (
            <span className="text-xs text-faint">—</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Industry compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Licence compliance findings across every registered business. Click a row for the full record.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Findings"
          value={findings.length}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Recent signals"
        />
        <MetricCard
          title="Organizations"
          value={uniqueOrgs}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="With at least one finding"
        />
        <MetricCard
          title="Unlicensed"
          value={byType.UNLICENSED_ACTIVITY ?? 0}
          icon={<ShieldCheck className="size-4" />}
          iconBg="bg-danger"
          caption="Activity outside cover"
        />
        <MetricCard
          title="Expired / suspended"
          value={
            (byType.EXPIRED_LICENCE ?? 0) + (byType.SUSPENDED_LICENCE ?? 0)
          }
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Licence problems"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Findings log</CardTitle>
          <CardDescription>
            Recorded when a business acts outside what its licence covers.
            Detail is truncated here — open a row to read everything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading findings...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={findings}
              filterPlaceholder="Search by organization..."
              filterColumn="organizationName"
              pageSize={15}
              noBorder
              onRowClick={(row) =>
                router.push(`/dashboard/compliance/findings/${row.id}`)
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
