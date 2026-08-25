"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FileBarChart, DollarSign, Users, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { usePayrollSummary, useLeaveReport } from "@/hooks/payroll";
import type { PayrollRunLine } from "@/services/payroll.service";

const lineColumns: ColumnDef<TableFeatures, PayrollRunLine>[] = [
  {
    accessorKey: "employeeNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Emp #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono text-faint">{row.getValue("employeeNumber")}</span>,
  },
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
    accessorKey: "departmentName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Department
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm">{(row.getValue("departmentName") as string) || "—"}</span>,
  },
  {
    accessorKey: "baseSalary",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Base Salary
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono">{(row.getValue("baseSalary") as number).toLocaleString()} RWF</span>,
  },
  {
    accessorKey: "allowances",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Allowances
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono text-success">{(row.getValue("allowances") as number).toLocaleString()} RWF</span>,
  },
  {
    accessorKey: "deductions",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Deductions
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono text-danger">{(row.getValue("deductions") as number).toLocaleString()} RWF</span>,
  },
  {
    accessorKey: "net",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Net
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono font-medium">{(row.getValue("net") as number).toLocaleString()} RWF</span>,
  },
];

export function PayrollReportsPanel() {
  const { data: summary, isLoading: summaryLoading } = usePayrollSummary();
  const { data: leaveReport, isLoading: leaveLoading } = useLeaveReport();

  const s = summary?.summary;
  const lines = summary?.lines ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <FileBarChart className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Payroll Reports</h2>
          <p className="text-sm text-muted-foreground">View payroll summaries, deductions, and leave statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Employees" value={s?.totalEmployees ?? 0} icon={<Users className="size-4" />} iconBg="bg-primary" caption="This period" />
        <MetricCard title="Total Gross" value={`${(s?.totalGross ?? 0).toLocaleString()} RWF`} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="All employees" />
        <MetricCard title="Total Deductions" value={`${(s?.totalDeductions ?? 0).toLocaleString()} RWF`} icon={<TrendingDown className="size-4" />} iconBg="bg-danger" caption="This period" />
        <MetricCard title="Total Net" value={`${(s?.totalNet ?? 0).toLocaleString()} RWF`} icon={<TrendingUp className="size-4" />} iconBg="bg-success" caption="Disbursed" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Detail</CardTitle>
          <CardDescription>{lines.length} payslips</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading payroll data...</div>
          ) : (
            <DataTable columns={lineColumns} data={lines} filterPlaceholder="Search payslips..." filterColumn="employeeName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      {!leaveLoading && leaveReport && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Report</CardTitle>
            <CardDescription>Leave request statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total Requests</p>
                <p className="text-xl font-bold tracking-tight text-foreground">{leaveReport.totalRequests}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Approved</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold tracking-tight text-foreground">{leaveReport.approved}</p>
                  <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Approved</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Rejected</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold tracking-tight text-foreground">{leaveReport.rejected}</p>
                  <Badge variant="outline" className="border-danger/30 bg-danger/10 text-danger">Rejected</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pending</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold tracking-tight text-foreground">{leaveReport.pending}</p>
                  <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning-foreground">Pending</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
