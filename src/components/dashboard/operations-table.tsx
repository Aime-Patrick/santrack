"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import {
  GripVertical,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OperationTab {
  key: string;
  label: string;
  count?: number;
}

export type OperationStatus = "Completed" | "In Process" | "Pending";

export interface OperationRow {
  id: string;
  title: string;
  category: string;
  status: OperationStatus;
  targetUnits: number;
  limitDays: number;
  officer: string;
}

export interface OperationsTableProps {
  /** Tab list shown above the table */
  tabs?: OperationTab[];
  /** Row data — defaults to built-in demo rows */
  data?: OperationRow[];
  /** href for the "+ Add Record" button */
  addHref?: string;
  /** Label for the add button */
  addLabel?: string;
  /** Number of rows per page */
  pageSize?: number;
  className?: string;
}

// ── Default demo data ─────────────────────────────────────────────────────────

const DEFAULT_DATA: OperationRow[] = [
  { id: "1", title: "Inyange Milk Ltd — Batch #PRD-00876 Processing",        category: "Dairy & Beverages",    status: "In Process", targetUnits: 1850, limitDays: 5,  officer: "Pacifique Shema"    },
  { id: "2", title: "Cimerwa Cement — Raw Materials Quarry Batch #MNT-0023", category: "Mining & Construction", status: "Completed",  targetUnits: 2900, limitDays: 24, officer: "Claudine Niyonzima" },
  { id: "3", title: "Rulindo Agro Processing Plant Inspection",               category: "Agro-Processing",       status: "Completed",  targetUnits: 1020, limitDays: 13, officer: "Jean Uwamahoro"     },
  { id: "4", title: "Bralirwa Brewery Facility Compliance Audit",             category: "Food & Beverage",       status: "Completed",  targetUnits: 2750, limitDays: 23, officer: "Mugisha Didier"     },
  { id: "5", title: "Kinazi Cassava Plant — Packaging Line Upgrade",          category: "Manufacturing",         status: "In Process", targetUnits: 620,  limitDays: 16, officer: "Jean Uwamahoro"     },
  { id: "6", title: "Bugesera Industrial Zone Water Supply Testing",          category: "Infrastructure",        status: "In Process", targetUnits: 2000, limitDays: 8,  officer: "Claudine Niyonzima" },
  { id: "7", title: "East Africa Granite Quarry Export Clearance",            category: "Export & Logistics",    status: "Pending",    targetUnits: 1940, limitDays: 21, officer: "Pacifique Shema"    },
  { id: "8", title: "Kigali Special Economic Zone – Phase 2 Review",          category: "Manufacturing",         status: "Pending",    targetUnits: 3100, limitDays: 30, officer: "Mugisha Didier"     },
  { id: "9", title: "Inyange Industries Yoghurt Line Sanitation Audit",       category: "Dairy & Beverages",    status: "Completed",  targetUnits: 900,  limitDays: 7,  officer: "Pacifique Shema"    },
  { id: "10",title: "Bugesera Agro-Processing Factory Permit Renewal",        category: "Agro-Processing",       status: "Pending",    targetUnits: 1200, limitDays: 18, officer: "Jean Uwamahoro"     },
];

const DEFAULT_TABS: OperationTab[] = [
  { key: "all",         label: "All Operations" },
  { key: "production",  label: "Production Batches",  count: 3 },
  { key: "maintenance", label: "Maintenance & Audits", count: 2 },
  { key: "licenses",    label: "Active Licenses" },
];

// ── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OperationStatus }) {
  if (status === "Completed")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#00953C]">
        <span className="size-2 rounded-full bg-[#00953C]" />
        Completed
      </span>
    );
  if (status === "In Process")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#067eda]">
        <span className="size-2 rounded-full bg-[#067eda]" />
        In Process
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b8860b]">
      <span className="size-2 rounded-full bg-[#fac600]" />
      Pending Review
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

const columns: ColumnDef<TableFeatures, OperationRow>[] = [
  // Drag handle
  {
    id: "drag",
    header: () => null,
    cell: () => (
      <span className="flex items-center justify-center text-muted-foreground/40 cursor-grab hover:text-muted-foreground transition-colors">
        <GripVertical className="size-3.5" />
      </span>
    ),
    enableSorting: false,
  },
  // Title
  {
    accessorKey: "title",
    header: "Operation / Industry",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.title}</span>
    ),
  },
  // Category
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="inline-flex rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
        {row.original.category}
      </span>
    ),
  },
  // Status
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  // Target Units
  {
    accessorKey: "targetUnits",
    header: () => <span className="text-right block">Target Units</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold text-foreground">
        {row.original.targetUnits.toLocaleString()}
      </span>
    ),
  },
  // Due (Days)
  {
    accessorKey: "limitDays",
    header: () => <span className="text-right block">Due (Days)</span>,
    cell: ({ row }) => (
      <span className="block text-right font-medium text-foreground">
        {row.original.limitDays}
      </span>
    ),
  },
  // Lead Officer
  {
    accessorKey: "officer",
    header: "Lead Officer",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.officer}</span>
    ),
  },
  // Row actions
  {
    id: "actions",
    header: () => null,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            />
          }
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
          <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Edit Record</DropdownMenuItem>
          <DropdownMenuItem className="text-xs text-danger">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export function OperationsTable({
  tabs = DEFAULT_TABS,
  data = DEFAULT_DATA,
  addHref = "/dashboard/inventory/new",
  addLabel = "Add Record",
  pageSize = 7,
  className,
}: OperationsTableProps) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.key ?? "all");

  return (
    <Card className={cn("border border-border/80 bg-white shadow-xs", className)}>
      {/* ── Header: Tabs + Toolbar ── */}
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/60 p-0 px-4 pt-0">
        {/* Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative py-3.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
                activeTab === tab.key
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#067eda]/12 text-[#067eda] text-[10px] font-bold px-1">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#067eda] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                />
              }
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span>Customize Columns</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
              <DropdownMenuItem className="text-xs">Operation / Industry</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Category</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Status</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Target Units</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Due (Days)</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Lead Officer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href={addHref}
            className="flex items-center gap-1.5 rounded-lg bg-[#067eda] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0570c4] transition-colors"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>{addLabel}</span>
          </Link>
        </div>
      </CardHeader>

      {/* ── Table (via reusable DataTable) ── */}
      <CardContent className="p-0">
        <DataTable<OperationRow>
          columns={columns}
          data={data}
          pageSize={pageSize}
          showFilter={false}
          showPagination={true}
          noBorder
          tableClassName="text-xs"
          headerClassName="bg-muted/20 border-b border-border/60 text-muted-foreground font-semibold text-[11px]"
          rowClassName={(row) =>
            cn("hover:bg-muted/30 transition-colors", row.getIsSelected() && "bg-muted/40")
          }
        />
      </CardContent>
    </Card>
  );
}
