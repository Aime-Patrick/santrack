"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useAuthorityRecentActivity } from "@/hooks/accountability";
import type { AccountabilityEntry } from "@/services/accountability.service";

const SOURCE_BADGE: Record<AccountabilityEntry["source"], string> = {
  CASE: "bg-danger text-white",
  LICENSE: "bg-rwanda-blue text-white",
  INSPECTION: "bg-rwanda-yellow text-white",
  TRACEABILITY: "bg-rwanda-green text-white",
  FINDING: "bg-danger text-white",
  COMPLAINT: "bg-rwanda-blue text-white",
};

const SOURCE_LABEL: Record<AccountabilityEntry["source"], string> = {
  CASE: "Case",
  LICENSE: "Licence",
  INSPECTION: "Inspection",
  TRACEABILITY: "Trace",
  FINDING: "Finding",
  COMPLAINT: "Complaint",
};

type Row = {
  activity: string;
  source: AccountabilityEntry["source"];
  business: string;
  officer: string;
  date: string;
  organizationId: number | null;
  caseId: number | null;
  findingId: number | null;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegulatorRecentActivity() {
  const router = useRouter();
  const { data = [], isLoading } = useAuthorityRecentActivity(40);
  const [showAll, setShowAll] = useState(false);

  const rows: Row[] = useMemo(
    () =>
      data.map((entry) => ({
        activity: entry.summary,
        source: entry.source,
        business: entry.organization ?? "—",
        officer: entry.actor ?? "System",
        date: formatWhen(entry.recordedAt),
        organizationId: entry.organizationId ?? null,
        caseId: entry.caseId ?? null,
        findingId: entry.findingId ?? null,
      })),
    [data],
  );

  const preview = rows.slice(0, 10);
  const visible = showAll ? rows : preview;

  const columns: ColumnDef<TableFeatures, Row>[] = useMemo(
    () => [
      {
        accessorKey: "activity",
        header: "Activity",
        meta: { sticky: "left" },
        cell: ({ row }) => (
          <span
            className="block max-w-[14rem] truncate text-xs font-semibold text-foreground lg:max-w-[18rem]"
            title={row.original.activity}
          >
            {row.getValue("activity")}
          </span>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const source = row.original.source;
          return (
            <Badge className={`${SOURCE_BADGE[source]} h-auto px-2.5 py-0.5`}>
              {SOURCE_LABEL[source]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "business",
        header: "Business",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">{row.getValue("business")}</span>
        ),
      },
      {
        accessorKey: "officer",
        header: "Officer",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">{row.getValue("officer")}</span>
        ),
      },
      {
        accessorKey: "date",
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">{row.getValue("date")}</span>
        ),
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent regulatory activity</CardTitle>
        {rows.length > 10 ? (
          <button
            type="button"
            onClick={() => setShowAll((open) => !open)}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            {showAll ? "Show less" : "View all →"}
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading activity…</p>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No case, licence, inspection, finding, or complaint events yet.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a row to open the related case, finding, licence, or business.
            </p>
            <DataTable
              columns={columns}
              data={visible}
              pageSize={10}
              noBorder
              onRowClick={(row) => {
                if (row.caseId) {
                  router.push(`/dashboard/regulator?tab=enforcement&case=${row.caseId}`);
                  return;
                }
                if (row.findingId) {
                  router.push(`/dashboard/compliance/findings/${row.findingId}`);
                  return;
                }
                if (row.source === "COMPLAINT") {
                  router.push("/dashboard/regulator?tab=intelligence");
                  return;
                }
                if (row.source === "LICENSE" && row.organizationId) {
                  router.push(`/dashboard/industries/${row.organizationId}?tab=licences`);
                  return;
                }
                if (row.organizationId) {
                  router.push(`/dashboard/industries/${row.organizationId}`);
                }
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
