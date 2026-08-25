"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useAttendance } from "@/hooks/payroll";
import type { Attendance } from "@/services/payroll.service";

const statusColors: Record<string, string> = {
  PRESENT: "border-success/30 bg-success/10 text-success",
  ABSENT: "border-danger/30 bg-danger/10 text-danger",
  LATE: "border-warning/30 bg-warning/10 text-warning-foreground",
  HALF_DAY: "border-primary/30 bg-primary/10 text-primary",
};

const columns: ColumnDef<TableFeatures, Attendance>[] = [
  {
    accessorKey: "employeeName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Employee
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("employeeName")}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm">{new Date(row.getValue("date") as string).toLocaleDateString()}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline" className={statusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "clockIn",
    header: "Clock In",
    cell: ({ row }) => <span className="text-sm font-mono text-faint">{(row.getValue("clockIn") as string) || "—"}</span>,
  },
  {
    accessorKey: "clockOut",
    header: "Clock Out",
    cell: ({ row }) => <span className="text-sm font-mono text-faint">{(row.getValue("clockOut") as string) || "—"}</span>,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{(row.getValue("notes") as string) || "—"}</span>,
  },
];

export function AttendancePanel() {
  const { data, isLoading } = useAttendance();
  const records = data ?? [];
  const total = records.length;
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Clock className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Attendance</h2>
          <p className="text-sm text-muted-foreground">Track daily employee attendance and punctuality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Records" value={total} icon={<Clock className="size-4" />} iconBg="bg-primary" caption="Attendance entries" />
        <MetricCard title="Present" value={presentCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Today" />
        <MetricCard title="Absent" value={absentCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Today" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>{total} records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading attendance...</div>
          ) : (
            <DataTable columns={columns} data={records} filterPlaceholder="Search attendance..." filterColumn="employeeName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
