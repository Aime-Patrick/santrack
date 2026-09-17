"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ExternalLink, LoaderCircle, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useVerificationAttempts } from "@/hooks/trace";
import type { VerificationAttemptSummary } from "@/services/trace.service";
import { cn } from "@/lib/utils";
import { FLAG_DANGER, FLAG_YELLOW } from "@/lib/badge-tones";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AnomalyRow = VerificationAttemptSummary & {
  code: string;
  kind: string;
};

export function ScanAnomalyWatch({
  onOpen,
  compact = false,
}: {
  /** When set (e.g. on Trace), opens the identity in-place instead of navigating. */
  onOpen?: (code: string) => void;
  /** Tighter chrome for embedding beside other panels. */
  compact?: boolean;
}) {
  const { data, isLoading } = useVerificationAttempts({
    minAttempts: 5,
    limit: 50,
  });
  const rows = useMemo<AnomalyRow[]>(
    () =>
      (data?.attempts ?? []).map((row) => ({
        ...row,
        code: row.itemCode ?? row.token,
        kind: row.known ? (row.productName ?? "Known identity") : "Unknown code",
      })),
    [data?.attempts],
  );
  const note =
    data?.note ||
    "Scan counts are a signal to investigate, not evidence of counterfeiting on their own.";

  const columns = useMemo<ColumnDef<TableFeatures, AnomalyRow>[]>(
    () => [
      {
        id: "signal",
        accessorFn: (row) => (row.attempts >= 50 ? 2 : 1),
        header: "",
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <AlertTriangle
            className={cn(
              "size-3.5",
              row.original.attempts >= 50 ? "text-danger" : "text-warning",
            )}
            aria-hidden
          />
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "kind",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.kind}</span>
        ),
      },
      {
        accessorKey: "attempts",
        header: "Scans",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "h-auto px-2.5 py-1 text-white",
              row.original.attempts >= 50 ? FLAG_DANGER : FLAG_YELLOW,
            )}
          >
            {row.original.attempts} scans
          </Badge>
        ),
      },
      {
        accessorKey: "lastSeenAt",
        header: "Last seen",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatWhen(row.original.lastSeenAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const code = row.original.code;
          const className =
            "inline-flex items-center gap-0.5 text-[13px] font-medium leading-none text-primary hover:underline";
          if (onOpen) {
            return (
              <button
                type="button"
                className={className}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(code);
                }}
              >
                Trace
                <ExternalLink className="size-3" />
              </button>
            );
          }
          return (
            <Link
              href={`/dashboard/manufacturing/trace?code=${encodeURIComponent(code)}`}
              className={className}
              onClick={(e) => e.stopPropagation()}
            >
              Trace
              <ExternalLink className="size-3" />
            </Link>
          );
        },
      },
    ],
    [onOpen],
  );

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card",
        compact ? "p-3" : "p-4 sm:p-5",
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <ScanLine className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Scan anomalies</h2>
            <Badge variant="default" className="h-auto px-2 py-0.5">
              {rows.length}
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          filterPlaceholder="Search code or product…"
          pageSize={compact ? 5 : 10}
          pageSizeOptions={[5, 10, 25, 50]}
          noBorder
          showSelectionCount={false}
          onRowClick={
            onOpen
              ? (row) => onOpen(row.code)
              : undefined
          }
        />
      )}
    </section>
  );
}
