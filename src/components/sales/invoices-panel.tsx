"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, FileText, DollarSign, Clock, CheckCircle, MoreHorizontal, Send, Ban, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogPopup, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useInvoices, useIssueInvoice, useVoidInvoice, usePayInvoice, useCreateInvoice, useSalesOrders } from "@/hooks/commerce";
import type { Invoice, SalesOrder } from "@/services/commerce.service";

const statusColors: Record<string, string> = {
  DRAFT: "border-border bg-muted/60 text-muted-foreground",
  ISSUED: "border-primary/30 bg-primary/10 text-primary",
  PAID: "border-success/30 bg-success/10 text-success",
  VOIDED: "border-danger/30 bg-danger/10 text-danger",
  OVERDUE: "border-warning/30 bg-warning/10 text-warning-foreground",
};

export function InvoicesPanel() {
  const { data, isLoading } = useInvoices();
  const issueInvoice = useIssueInvoice();
  const voidInvoice = useVoidInvoice();
  const payInvoice = usePayInvoice();
  const createInvoice = useCreateInvoice();
  const { data: orderData } = useSalesOrders(0, 100);
  const [open, setOpen] = useState(false);
  const [payInvoiceTarget, setPayInvoiceTarget] = useState<Invoice | null>(null);
  const invoices = data?.content ?? [];
  const total = data?.total ?? 0;
  const issuedCount = invoices.filter((i) => i.status === "ISSUED").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

  const columns: ColumnDef<TableFeatures, Invoice>[] = useMemo(() => [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("invoiceNumber")}</span>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("customerName")}</span>,
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
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number | null;
        return amount ? <span className="text-sm font-medium">{amount.toLocaleString()} RWF</span> : "—";
      },
    },
    {
      accessorKey: "amountPaid",
      header: "Paid",
      cell: ({ row }) => {
        const paid = row.getValue("amountPaid") as number;
        return <span className="text-sm">{paid.toLocaleString()} RWF</span>;
      },
    },
    {
      accessorKey: "dueOn",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.getValue("dueOn") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => issueInvoice.mutate(invoice.id)}>
                  <Send className="mr-2 size-4" /> Issue
                </DropdownMenuItem>
              )}
              {invoice.status === "ISSUED" && (
                <DropdownMenuItem onClick={() => setPayInvoiceTarget(invoice)}>
                  <CreditCard className="mr-2 size-4" /> Record Payment
                </DropdownMenuItem>
              )}
              {invoice.status !== "VOID" && invoice.status !== "PAID" && (
                <DropdownMenuItem onClick={() => voidInvoice.mutate(invoice.id)} className="text-destructive">
                  <Ban className="mr-2 size-4" /> Void
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [issueInvoice, voidInvoice]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Manage invoices, record payments, and track balances.
        </p>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Create invoice</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Invoices" value={total} icon={<FileText className="size-4" />} iconBg="bg-primary" caption="All invoices" />
        <MetricCard title="Revenue" value={`${totalRevenue.toLocaleString()} RWF`} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="Total invoiced" />
        <MetricCard title="Outstanding" value={issuedCount} icon={<Clock className="size-4" />} iconBg="bg-warning-foreground" caption="Awaiting payment" />
        <MetricCard title="Paid" value={paidCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Fully paid" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>{total} invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading invoices...</div>
          ) : (
            <DataTable columns={columns} data={invoices} filterPlaceholder="Search invoices..." filterColumn="invoiceNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <NewInvoiceDialog
        open={open}
        onOpenChange={setOpen}
        orders={(orderData?.content ?? []).filter((o) => o.status === "CONFIRMED")}
        onSubmit={(payload) => createInvoice.mutate(payload, { onSuccess: () => setOpen(false) })}
        pending={createInvoice.isPending}
      />

      <PayInvoiceDialog
        invoice={payInvoiceTarget}
        onOpenChange={(next) => {
          if (!next) setPayInvoiceTarget(null);
        }}
        onSubmit={(data) =>
          payInvoice.mutate(
            { id: payInvoiceTarget!.id, data },
            { onSuccess: () => setPayInvoiceTarget(null) },
          )
        }
        pending={payInvoice.isPending}
      />
    </div>
  );
}

/**
 * An invoice bills a sales order — the customer and the amounts come from it,
 * which is why there are no invoice lines to fill in here.
 *
 * Only a CONFIRMED order can be invoiced: the API refuses a PLACED one (nothing
 * is committed yet) and a FULFILLED one (the window has passed). So bill the
 * order after confirming it and before fulfilling it.
 */
function NewInvoiceDialog({
  open,
  onOpenChange,
  orders,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: SalesOrder[];
  onSubmit: (data: { salesOrderId: number; issuedOn?: string; dueOn?: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [orderId, setOrderId] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [notes, setNotes] = useState("");

  const chosen = orders.find((o) => String(o.id) === orderId);

  const reset = () => {
    setOrderId("");
    setIssuedOn("");
    setDueOn("");
    setNotes("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create an invoice</DialogTitle>
          <DialogDescription>
            Bills a confirmed sales order. It starts as a draft — issuing it is a separate step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Sales order</Label>
            <Select value={orderId} onValueChange={(v) => setOrderId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Which order is being billed">
                  {chosen ? () => `${chosen.orderNumber} — ${chosen.customerName}` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={String(order.id)}>
                    {order.orderNumber} — {order.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orders.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No confirmed orders to bill. Confirm an order first — once it is fulfilled it can
                no longer be invoiced.
              </p>
            ) : null}
            {chosen ? (
              <p className="text-xs text-muted-foreground">
                Billing {chosen.customerName} for{" "}
                <span className="tabular-nums">
                  RWF {(chosen.totalAmount ?? 0).toLocaleString()}
                </span>
                . The amounts come from the order.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issued-on">Issued on</Label>
              <Input id="issued-on" type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-on">Due on</Label>
              <Input id="due-on" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-notes">Notes (optional)</Label>
            <Input id="invoice-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!orderId || pending}
            onClick={() =>
              onSubmit({
                salesOrderId: Number(orderId),
                issuedOn: issuedOn || undefined,
                dueOn: dueOn || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            {pending ? "Creating..." : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "MOBILE_MONEY", label: "Mobile money" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
] as const;

function PayInvoiceDialog({
  invoice,
  onOpenChange,
  onSubmit,
  pending,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { amount: string; method: string; reference?: string }) => void;
  pending: boolean;
}) {
  const open = invoice != null;
  const balance =
    invoice == null
      ? 0
      : Math.max(0, (invoice.totalAmount ?? 0) - invoice.amountPaid);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("CASH");
  const [reference, setReference] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && invoice) {
          setAmount(String(Math.max(0, (invoice.totalAmount ?? 0) - invoice.amountPaid)));
          setMethod("CASH");
          setReference("");
        }
        if (!next) {
          setAmount("");
          setMethod("CASH");
          setReference("");
        }
        onOpenChange(next);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {invoice
              ? `Payment against ${invoice.invoiceNumber} — balance RWF ${balance.toLocaleString()}.`
              : "Record a payment against this invoice."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v ?? "CASH")}>
              <SelectTrigger>
                <SelectValue>
                  {() => PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-reference">Reference (optional)</Label>
            <Input
              id="pay-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Txn id, slip number…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!amount || Number(amount) <= 0 || pending}
            onClick={() =>
              onSubmit({
                amount,
                method,
                reference: reference.trim() || undefined,
              })
            }
          >
            {pending ? "Recording..." : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
