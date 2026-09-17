"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileBadge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { IndustryLicenceActionsMenu } from "@/components/regulator/industry-licence-actions-menu";
import { statusLabel } from "@/hooks/licensing";
import {
  FLAG_BLUE,
  FLAG_DANGER,
  FLAG_GREEN,
  FLAG_NEUTRAL,
  FLAG_YELLOW,
} from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { RegistryLicense } from "@/services/organization.service";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: FLAG_GREEN,
  SUBMITTED: FLAG_BLUE,
  UNDER_REVIEW: FLAG_BLUE,
  CHANGES_REQUESTED: FLAG_YELLOW,
  DRAFT: FLAG_NEUTRAL,
  EXPIRED: FLAG_DANGER,
  REVOKED: FLAG_DANGER,
  REJECTED: FLAG_DANGER,
  SUSPENDED: FLAG_YELLOW,
  CANCELLED: FLAG_NEUTRAL,
};

const STATUS_RANK: Record<string, number> = {
  SUSPENDED: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
  CHANGES_REQUESTED: 3,
  ACTIVE: 4,
  EXPIRED: 5,
  REVOKED: 6,
  REJECTED: 7,
  DRAFT: 8,
  CANCELLED: 9,
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type IndustryLicenceRow = RegistryLicense & {
  organizationId: number;
  organizationName: string;
};

function rankLicences(licenses: IndustryLicenceRow[]): IndustryLicenceRow[] {
  return [...licenses].sort(
    (a, b) =>
      (STATUS_RANK[a.status] ?? 50) - (STATUS_RANK[b.status] ?? 50) ||
      a.licenseNumber.localeCompare(b.licenseNumber),
  );
}

export function IndustryLicencesTable({
  organizationId,
  organizationName,
  licenses,
  pageSize = 10,
}: {
  organizationId: number;
  organizationName: string;
  licenses: RegistryLicense[];
  pageSize?: number;
}) {
  const data = useMemo(
    () =>
      rankLicences(
        licenses.map((licence) => ({
          ...licence,
          organizationId,
          organizationName,
        })),
      ),
    [licenses, organizationId, organizationName],
  );

  const columns = useMemo<ColumnDef<TableFeatures, IndustryLicenceRow>[]>(
    () => [
      {
        id: "licence",
        accessorFn: (row) =>
          `${row.categoryName ?? row.activity ?? ""} ${row.licenseNumber}`,
        header: "Licence",
        cell: ({ row }) => {
          const licence = row.original;
          const title = licence.categoryName || licence.activity || "Licence";
          return (
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-white",
                  STATUS_STYLE[licence.status] ?? FLAG_NEUTRAL,
                )}
              >
                <FileBadge className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {licence.licenseNumber}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              STATUS_STYLE[row.original.status] ?? FLAG_NEUTRAL,
              "text-[10px] px-2 py-0.5 font-medium",
            )}
          >
            {statusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "activity",
        header: "Activity",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.activity || "—"}
          </span>
        ),
      },
      {
        id: "site",
        accessorFn: (row) => row.facilityName ?? "",
        header: "Site",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.facilityName || "—"}
          </span>
        ),
      },
      {
        id: "issuer",
        accessorFn: (row) => row.issuedByOrgName ?? "",
        header: "Issuer",
        cell: ({ row }) => (
          <span
            className="max-w-48 truncate text-sm text-muted-foreground"
            title={row.original.issuedByOrgName ?? undefined}
          >
            {row.original.issuedByOrgName || "—"}
          </span>
        ),
      },
      {
        id: "validity",
        accessorFn: (row) => row.expiresOn ?? row.issuedOn ?? "",
        header: "Validity",
        cell: ({ row }) => (
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p>Issued {formatDate(row.original.issuedOn)}</p>
            <p>
              {row.original.expiresOn
                ? `Expires ${formatDate(row.original.expiresOn)}`
                : "No expiry"}
            </p>
            {row.original.statusChangedAt ? (
              <p>Updated {formatDate(row.original.statusChangedAt)}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "reason",
        accessorFn: (row) => row.statusReason ?? "",
        header: "Recorded reason",
        cell: ({ row }) =>
          row.original.statusReason ? (
            <p
              className="max-w-64 truncate text-xs text-muted-foreground"
              title={row.original.statusReason}
            >
              {row.original.statusReason}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { sticky: "right" },
        cell: ({ row }) => <IndustryLicenceActionsMenu licence={row.original} />,
      },
    ],
    [],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 p-8 text-center">
        <FileBadge className="mx-auto mb-3 size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No licences on record</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="Search licence, activity, issuer…"
      filterColumn="licence"
      pageSize={pageSize}
      pageSizeOptions={[5, 10, 25, 50]}
      showSelectionCount={false}
      rowClassName={(row) =>
        row.original.status === "SUSPENDED" ||
        row.original.status === "SUBMITTED" ||
        row.original.status === "UNDER_REVIEW"
          ? "bg-[#f8fbff]"
          : ""
      }
    />
  );
}
