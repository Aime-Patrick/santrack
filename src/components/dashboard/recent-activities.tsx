"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useAuditLog } from "@/hooks/audit";
import { RecentActivitiesDialog } from "./recent-activities-dialog";

type Activity = {
  activity: string;
  module: string;
  user: string;
  date: string;
  status: "success" | "pending";
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

export function RecentActivities() {
  const { data: auditData, isLoading } = useAuditLog(10);
  const [showAll, setShowAll] = useState(false);

  const activities: Activity[] =
    auditData?.entries?.map((entry) => ({
      activity: deriveActivity(entry.method, entry.path),
      module: deriveModule(entry.path),
      user: entry.actor,
      date: formatDate(entry.performedAt),
      status: entry.statusCode < 400 ? "success" : "pending",
    })) ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            View More →
          </button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
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
              pageSize={5}
              showPagination={false}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <RecentActivitiesDialog open={showAll} onOpenChange={setShowAll} />
    </>
  );
}
