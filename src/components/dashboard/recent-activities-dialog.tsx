"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuditLog } from "@/hooks/audit";

type Activity = {
  activity: string;
  module: string;
  user: string;
  date: string;
  status: "success" | "pending";
  path: string;
  method: string;
};

function deriveModule(path: string): string {
  const segment = path.split("/").filter(Boolean)[1] ?? "";
  const map: Record<string, string> = {
    items: "Items",
    inventory: "Inventory",
    organizations: "Organizations",
    productionorders: "Production",
    transfers: "Transfers",
    licenses: "Licensing",
    employees: "Employees",
    invoices: "Commerce",
    sales: "Sales",
    audit: "Security",
    auth: "Auth",
  };
  return map[segment.toLowerCase()] ?? "System";
}

function deriveActivity(method: string, path: string): string {
  const module = deriveModule(path);
  const verb: Record<string, string> = {
    POST: "Created",
    PUT: "Updated",
    PATCH: "Updated",
    DELETE: "Deleted",
    GET: "Viewed",
  };
  return `${verb[method] ?? method} ${module}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const columns: ColumnDef<TableFeatures, Activity>[] = [
  {
    accessorKey: "activity",
    header: "Activity",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("activity")}</span>
    ),
  },
  {
    accessorKey: "module",
    header: "Module",
  },
  {
    accessorKey: "user",
    header: "User",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("date")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "success" ? "success" : "warning"}>
          {status === "success" ? "Success" : "Pending"}
        </Badge>
      );
    },
  },
];

interface RecentActivitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecentActivitiesDialog({ open, onOpenChange }: RecentActivitiesDialogProps) {
  const { data: auditData, isLoading } = useAuditLog(100);

  const activities: Activity[] =
    auditData?.entries?.map((entry) => ({
      activity: deriveActivity(entry.method, entry.path),
      module: deriveModule(entry.path),
      user: entry.actor,
      date: formatDate(entry.performedAt),
      status: entry.statusCode < 400 ? "success" : "pending",
      path: entry.path,
      method: entry.method,
    })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>All Recent Activities</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={activities}
              filterColumn="activity"
              filterPlaceholder="Search activities..."
              pageSize={10}
              showPagination
            />
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
