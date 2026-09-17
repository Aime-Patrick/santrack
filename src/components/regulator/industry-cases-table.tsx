"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Shield, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  FLAG_BLUE,
  FLAG_DANGER,
  FLAG_GREEN,
  FLAG_NEUTRAL,
  FLAG_YELLOW,
} from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { RegulatoryCase } from "@/services/regulatory-case.service";

const STATUS_STYLE: Record<string, string> = {
  OPEN: FLAG_DANGER,
  IN_PROGRESS: FLAG_BLUE,
  AWAITING_BUSINESS: FLAG_YELLOW,
  ESCALATED: FLAG_DANGER,
  RESOLVED: FLAG_GREEN,
  CLOSED: FLAG_NEUTRAL,
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: FLAG_NEUTRAL,
  NORMAL: FLAG_BLUE,
  HIGH: FLAG_YELLOW,
  CRITICAL: FLAG_DANGER,
};

function isOpenCase(status: string) {
  return (
    status === "OPEN" ||
    status === "IN_PROGRESS" ||
    status === "ESCALATED" ||
    status === "AWAITING_BUSINESS"
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function IndustryCasesTable({ cases }: { cases: RegulatoryCase[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const visible = useMemo(
    () => (filter === "open" ? cases.filter((c) => isOpenCase(c.status)) : cases),
    [cases, filter],
  );

  const columns = useMemo<ColumnDef<TableFeatures, RegulatoryCase>[]>(
    () => [
      {
        id: "case",
        accessorFn: (row) => `${row.title} ${row.caseNumber ?? row.id}`,
        header: "Case",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-white",
                  STATUS_STYLE[c.status] ?? FLAG_DANGER,
                )}
              >
                <ShieldAlert className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.caseNumber ?? `CASE-${String(c.id).padStart(4, "0")}`}
                  {c.caseCategory ? ` · ${c.caseCategory}` : ""}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge
            className={cn(
              PRIORITY_STYLE[row.original.priority] ?? PRIORITY_STYLE.NORMAL,
              "text-[10px] px-2 py-0.5 font-medium",
            )}
          >
            {row.original.priority}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              STATUS_STYLE[row.original.status] ?? STATUS_STYLE.OPEN,
              "text-[10px] px-2 py-0.5 font-medium",
            )}
          >
            {row.original.status.replaceAll("_", " ")}
          </Badge>
        ),
      },
      {
        id: "assignee",
        accessorFn: (row) => row.assignedTo?.name ?? "",
        header: "Assignee",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.assignedTo?.name ?? "Unassigned"}
          </span>
        ),
      },
      {
        id: "dueOn",
        accessorFn: (row) => row.dueOn ?? "",
        header: "Due",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.dueOn)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { sticky: "right" },
        cell: () => <ArrowRight className="size-4 text-muted-foreground" />,
      },
    ],
    [],
  );

  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 p-8 text-center">
        <Shield className="mx-auto mb-3 size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No regulatory cases on record</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(
          [
            {
              id: "open" as const,
              label: "Needs work",
              count: cases.filter((c) => isOpenCase(c.status)).length,
            },
            { id: "all" as const, label: "All", count: cases.length },
          ]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
              filter === option.id
                ? "bg-[#067eda] text-white"
                : "bg-muted text-muted-foreground",
            )}
          >
            {option.label} {option.count}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No open cases. Switch to All to see closed work.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          filterPlaceholder="Search case title or number…"
          filterColumn="case"
          pageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          showSelectionCount={false}
          onRowClick={(row) =>
            router.push(`/dashboard/regulator?tab=enforcement&case=${row.id}`)
          }
        />
      )}
    </div>
  );
}
