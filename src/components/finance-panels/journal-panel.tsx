"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useJournals, useCreateJournalEntry } from "@/hooks/finance";
import { JournalEntryDialog } from "@/components/finance/journal-entry-dialog";
import type { JournalEntry } from "@/services/finance.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

const columns: ColumnDef<TableFeatures, JournalEntry>[] = [
  {
    accessorKey: "entryNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Entry #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <FileText className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("entryNumber")}</span>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("description")}</span>,
  },
  {
    accessorKey: "postedOn",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Posted On
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("postedOn")).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "lines",
    header: "Lines",
    cell: ({ row }) => {
      const lines = row.getValue("lines") as JournalEntry["lines"];
      return <span className="text-sm">{lines.length} line{lines.length !== 1 ? "s" : ""}</span>;
    },
  },
  {
    id: "debit",
    header: "Debit",
    cell: ({ row }) => {
      const lines = row.original.lines;
      const total = lines.reduce((sum, l) => sum + l.debit, 0);
      return <span className="text-sm font-medium">{total > 0 ? formatCurrency(total) : "—"}</span>;
    },
  },
  {
    id: "credit",
    header: "Credit",
    cell: ({ row }) => {
      const lines = row.original.lines;
      const total = lines.reduce((sum, l) => sum + l.credit, 0);
      return <span className="text-sm font-medium">{total > 0 ? formatCurrency(total) : "—"}</span>;
    },
  },
];

export function JournalPanel() {
  const { data, isLoading } = useJournals();
  const [creating, setCreating] = useState(false);
  const create = useCreateJournalEntry();
  const entries = data ?? [];
  const total = entries.length;
  const totalDebit = entries.reduce((sum, e) => sum + e.lines.reduce((s, l) => s + l.debit, 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.lines.reduce((s, l) => s + l.credit, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">General Journal</h2>
            <p className="text-sm text-muted-foreground">View and create journal entries.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> New Entry
        </Button>
      </div>

      <JournalEntryDialog
        open={creating}
        onOpenChange={setCreating}
        pending={create.isPending}
        onSubmit={(draft) =>
          create.mutate(draft, { onSuccess: () => setCreating(false) })
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Entries" value={total} icon={<FileText className="size-4" />} iconBg="bg-primary" caption="Journal entries" />
        <MetricCard title="Total Debit" value={formatCurrency(totalDebit)} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="Sum of debits" />
        <MetricCard title="Total Credit" value={formatCurrency(totalCredit)} icon={<DollarSign className="size-4" />} iconBg="bg-danger" caption="Sum of credits" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>{total} entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading journal entries...</div>
          ) : (
            <DataTable columns={columns} data={entries} filterPlaceholder="Search entries..." filterColumn="description" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
