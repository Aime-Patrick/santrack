"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, BookOpen, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useAccounts, useCreateAccount } from "@/hooks/finance";
import { ResourceFormDialog, str } from "@/components/ui/resource-form-dialog";
import { ACCOUNT_TYPES } from "@/lib/finance-options";
import type { Account } from "@/services/finance.service";

const typeColors: Record<string, string> = {
  ASSET: "border-primary/30 bg-primary/10 text-primary",
  LIABILITY: "border-danger/30 bg-danger/10 text-danger",
  EQUITY: "border-success/30 bg-success/10 text-success",
  REVENUE: "border-success/30 bg-success/10 text-success",
  EXPENSE: "border-warning/30 bg-warning/10 text-warning-foreground",
};

const columns: ColumnDef<TableFeatures, Account>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <BookOpen className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("code")}</span>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline" className={typeColors[type] ?? "border-border bg-muted/60 text-muted-foreground"}>{type}</Badge>;
    },
  },
  {
    accessorKey: "parentCode",
    header: "Parent",
    cell: ({ row }) => {
      const code = row.getValue("parentCode") as string | null;
      return code ? <span className="font-mono text-sm text-faint">{code}</span> : "—";
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />;
    },
  },
];

export function AccountsPanel() {
  const { data, isLoading } = useAccounts();
  const [creating, setCreating] = useState(false);
  const create = useCreateAccount();

  const parentOptions = (data ?? []).map((account) => ({
    value: account.code,
    label: account.name,
    hint: account.code,
  }));
  const accounts = data ?? [];
  const total = accounts.length;
  const assetCount = accounts.filter((a) => a.type === "ASSET").length;
  const liabilityCount = accounts.filter((a) => a.type === "LIABILITY").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <BookOpen className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Chart of Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage your chart of accounts and account structure.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Add Account
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add an account"
        description="A line in the chart of accounts. Journal entries post against these, so the type decides which way an amount moves the balance."
        submitLabel="Add account"
        pending={create.isPending}
        fields={[
          {
            name: "code",
            label: "Code",
            kind: "text",
            required: true,
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "1200",
            hint: "Numbering usually groups by type.",
          },
          {
            name: "type",
            label: "Type",
            kind: "select",
            required: true,
            half: true,
            options: ACCOUNT_TYPES,
          },
          {
            name: "name",
            label: "Name",
            kind: "text",
            required: true,
            placeholder: "e.g. Trade receivables",
          },
          {
            name: "parentCode",
            label: "Parent account",
            kind: "select",
            options: parentOptions,
            emptyMessage: "No accounts yet — this will be a top-level one",
            hint: "Leave blank for a top-level account.",
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              code: v.code.trim(),
              name: v.name.trim(),
              type: v.type,
              parentCode: str(v, "parentCode"),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Accounts" value={total} icon={<BookOpen className="size-4" />} iconBg="bg-primary" caption="Chart of accounts" />
        <MetricCard title="Assets" value={assetCount} icon={<BookOpen className="size-4" />} iconBg="bg-primary" caption="Asset accounts" />
        <MetricCard title="Liabilities" value={liabilityCount} icon={<BookOpen className="size-4" />} iconBg="bg-danger" caption="Liability accounts" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account List</CardTitle>
          <CardDescription>{total} accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading accounts...</div>
          ) : (
            <DataTable columns={columns} data={accounts} filterPlaceholder="Search accounts..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
