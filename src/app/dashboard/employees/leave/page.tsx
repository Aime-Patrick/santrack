"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useLeaves, useApproveLeave, useRejectLeave } from "@/hooks/payroll";
import type { Leave } from "@/services/payroll.service";

const statusColors: Record<string, string> = {
  PENDING: "border-warning/30 bg-warning/10 text-warning-foreground",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

export default function LeavePage() {
  const { data, isLoading } = useLeaves();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const columns: ColumnDef<TableFeatures, Leave>[] = [
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => <span className="text-sm">{new Date(row.getValue("startDate") as string).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => <span className="text-sm">{new Date(row.getValue("endDate") as string).toLocaleDateString()}</span>,
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
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{row.getValue("reason")}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const leave = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {leave.status === "PENDING" && (
                <>
                  <DropdownMenuItem onClick={() => approveLeave.mutate(leave.id)}>
                    <CheckCircle className="mr-2 size-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => rejectLeave.mutate({ id: leave.id, data: { reason: "Rejected by manager" } })} className="text-danger">
                    <XCircle className="mr-2 size-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const leaves = data ?? [];
  const total = leaves.length;
  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
          <Calendar className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage employee leave requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Requests" value={total} icon={<Calendar className="size-4" />} iconBg="bg-primary" caption="All leave requests" />
        <MetricCard title="Pending" value={pendingCount} icon={<Clock className="size-4" />} iconBg="bg-warning-foreground" caption="Awaiting approval" />
        <MetricCard title="Approved" value={approvedCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Approved leaves" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>{total} requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading leaves...</div>
          ) : (
            <DataTable columns={columns} data={leaves} filterPlaceholder="Search leaves..." filterColumn="employeeName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
