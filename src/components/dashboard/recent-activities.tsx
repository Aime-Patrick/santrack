"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

type Activity = {
  activity: string;
  module: string;
  user: string;
  date: string;
  status: "success" | "pending";
};

const activities: Activity[] = [
  {
    activity: 'New industry "Inyange Milk Ltd" added',
    module: "Industries",
    user: "Pacifique Shema",
    date: "18 Aug 2026 10:30",
    status: "success",
  },
  {
    activity: 'Inventory item "Cement" updated',
    module: "Inventory",
    user: "Claudine Niyonzima",
    date: "18 Aug 2026 09:15",
    status: "success",
  },
  {
    activity: "Production batch #PRD-00876 completed",
    module: "Production",
    user: "Jean Uwamahoro",
    date: "18 Aug 2026 08:47",
    status: "success",
  },
  {
    activity: "Maintenance request #MNT-0023 created",
    module: "Maintenance",
    user: "Mugisha Didier",
    date: "18 Aug 2026 08:20",
    status: "pending",
  },
];

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
        <Badge
          variant={status === "success" ? "default" : "secondary"}
          className={
            status === "success"
              ? "bg-success/10 text-success border-success/20"
              : "bg-warning/10 text-warning-foreground border-warning/20"
          }
        >
          {status === "success" ? "Success" : "Pending"}
        </Badge>
      );
    },
  },
];

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={activities}
          filterColumn="activity"
          filterPlaceholder="Search activities..."
          pageSize={5}
          showPagination={false}
          noBorder
        />
      </CardContent>
    </Card>
  );
}
