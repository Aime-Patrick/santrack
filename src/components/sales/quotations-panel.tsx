"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Plus,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  useQuotations,
  useCreateQuotation,
  useSendQuotation,
  useAcceptQuotation,
  useRejectQuotation,
  useExpireQuotation,
  useCreateSalesOrderFromQuotation,
  useCustomers,
} from "@/hooks/commerce";
import { useProducts } from "@/hooks/products";
import { sellableUnits } from "@/lib/sales-unit";
import type { CommerceLineInput, Customer, Quotation } from "@/services/commerce.service";
import type { Product } from "@/services/product.service";

const statusColors: Record<string, string> = {
  DRAFT: "border-border bg-muted/60 text-muted-foreground",
  SENT: "border-primary/30 bg-primary/10 text-primary",
  ACCEPTED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  EXPIRED: "border-warning/30 bg-warning/10 text-warning-foreground",
};

export function QuotationsPanel() {
  const { data, isLoading } = useQuotations();
  const { data: customerData } = useCustomers();
  const createQuotation = useCreateQuotation();
  const sendQuotation = useSendQuotation();
  const acceptQuotation = useAcceptQuotation();
  const rejectQuotation = useRejectQuotation();
  const expireQuotation = useExpireQuotation();
  const createFromQuote = useCreateSalesOrderFromQuotation();

  const [createOpen, setCreateOpen] = useState(false);

  const quotations = data?.content ?? [];
  const total = data?.total ?? 0;
  const customers = customerData?.content ?? [];
  const draftCount = quotations.filter((q) => q.status === "DRAFT").length;
  const sentCount = quotations.filter((q) => q.status === "SENT").length;
  const acceptedCount = quotations.filter((q) => q.status === "ACCEPTED").length;

  const columns: ColumnDef<TableFeatures, Quotation>[] = [
    {
      accessorKey: "quotationNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Quote #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("quotationNumber")}</span>
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
      accessorKey: "validUntilOn",
      header: "Valid Until",
      cell: ({ row }) => {
        const d = new Date(row.getValue("validUntilOn") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.getValue("createdAt") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quote.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => sendQuotation.mutate(quote.id)}>
                  <Send className="mr-2 size-4" /> Send
                </DropdownMenuItem>
              )}
              {quote.status === "SENT" && (
                <>
                  <DropdownMenuItem onClick={() => acceptQuotation.mutate(quote.id)}>
                    <CheckCircle className="mr-2 size-4" /> Accept
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => rejectQuotation.mutate({ id: quote.id, data: { reason: "Rejected" } })} className="text-destructive">
                    <XCircle className="mr-2 size-4" /> Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => expireQuotation.mutate(quote.id)}>
                    <Clock className="mr-2 size-4" /> Expire
                  </DropdownMenuItem>
                </>
              )}
              {quote.status === "ACCEPTED" && (
                <DropdownMenuItem
                  onClick={() => createFromQuote.mutate(quote)}
                  disabled={createFromQuote.isPending}
                >
                  <ShoppingCart className="mr-2 size-4" /> Convert to order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Create and manage price quotations for customers.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" /> New quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Quotes" value={total} icon={<FileText className="size-4" />} iconBg="bg-primary" caption="All quotations" />
        <MetricCard title="Drafts" value={draftCount} icon={<Clock className="size-4" />} iconBg="bg-muted text-muted-foreground" caption="Not yet sent" />
        <MetricCard title="Sent" value={sentCount} icon={<Send className="size-4" />} iconBg="bg-primary" caption="Awaiting response" />
        <MetricCard title="Accepted" value={acceptedCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Converted to orders" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation List</CardTitle>
          <CardDescription>{total} quotations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading quotations...</div>
          ) : (
            <DataTable columns={columns} data={quotations} filterPlaceholder="Search quotations..." filterColumn="quotationNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <NewQuotationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        customers={customers}
        onSubmit={(data) =>
          createQuotation.mutate(data, { onSuccess: () => setCreateOpen(false) })
        }
        pending={createQuotation.isPending}
      />
    </div>
  );
}

type DraftLine = {
  productId: string;
  requestedQuantity: string;
  salesUnit: string;
  unitPrice: string;
};

function NewQuotationDialog({
  open,
  onOpenChange,
  customers,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSubmit: (data: {
    customerId: number;
    lines: CommerceLineInput[];
    taxPercent?: string;
    notes?: string;
  }) => void;
  pending: boolean;
}) {
  const { data: products } = useProducts(0, 200);
  const [customerId, setCustomerId] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { productId: "", requestedQuantity: "", salesUnit: "", unitPrice: "" },
  ]);

  const chosen = customers.find((c) => String(c.id) === customerId);
  const catalogue = products?.content ?? [];

  const updateLine = (index: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const selectProduct = (index: number, productId: string) => {
    const product = catalogue.find((p) => String(p.id) === productId);
    const units = product ? sellableUnits(product) : [];
    updateLine(index, { productId, salesUnit: units[0] ?? "" });
  };

  const validLines = lines.filter((line) => {
    if (line.productId === "" || Number(line.requestedQuantity) <= 0 || line.unitPrice === "") {
      return false;
    }
    const product = catalogue.find((p) => String(p.id) === line.productId);
    const units = product ? sellableUnits(product) : [];
    if (units.length > 0 && !line.salesUnit) return false;
    return true;
  });

  const reset = () => {
    setCustomerId("");
    setTaxPercent("");
    setLines([{ productId: "", requestedQuantity: "", salesUnit: "", unitPrice: "" }]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New quotation</DialogTitle>
          <DialogDescription>
            Quote in the customer&apos;s sales unit. Nothing is reserved until an order is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Who is this for">
                    {chosen ? () => chosen.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-tax">Tax %</Label>
              <Input
                id="quote-tax"
                type="number"
                min={0}
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lines</Label>
            <div className="space-y-2">
              {lines.map((line, index) => {
                const product = catalogue.find((p) => String(p.id) === line.productId);
                const units = product ? sellableUnits(product) : [];
                return (
                  <QuoteLineRow
                    key={index}
                    line={line}
                    products={catalogue}
                    units={units}
                    canRemove={lines.length > 1}
                    onProductChange={(id) => selectProduct(index, id)}
                    onChange={(patch) => updateLine(index, patch)}
                    onRemove={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  />
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { productId: "", requestedQuantity: "", salesUnit: "", unitPrice: "" },
                ])
              }
            >
              <Plus className="mr-2 size-4" /> Add line
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!customerId || validLines.length === 0 || pending}
            onClick={() =>
              onSubmit({
                customerId: Number(customerId),
                lines: validLines.map((line) => ({
                  productId: Number(line.productId),
                  requestedQuantity: line.requestedQuantity,
                  unitPrice: line.unitPrice,
                  salesUnit: line.salesUnit || undefined,
                })),
                taxPercent: taxPercent || undefined,
              })
            }
          >
            {pending ? "Creating..." : "Create quotation"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function QuoteLineRow({
  line,
  products,
  units,
  canRemove,
  onProductChange,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  products: Product[];
  units: string[];
  canRemove: boolean;
  onProductChange: (productId: string) => void;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
}) {
  const grid =
    units.length > 0
      ? "grid-cols-[1fr_90px_110px_110px_auto]"
      : "grid-cols-[1fr_90px_110px_auto]";

  return (
    <div className={`grid ${grid} gap-2`}>
      <Select value={line.productId} onValueChange={(v) => onProductChange(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Product">
            {line.productId
              ? () => products.find((p) => String(p.id) === line.productId)?.name ?? line.productId
              : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={String(product.id)}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        value={line.requestedQuantity}
        onChange={(e) => onChange({ requestedQuantity: e.target.value })}
        placeholder="Qty"
        aria-label="Requested quantity"
      />
      {units.length > 0 ? (
        <Select value={line.salesUnit} onValueChange={(v) => onChange({ salesUnit: v ?? "" })}>
          <SelectTrigger>
            <SelectValue placeholder="Unit">
              {line.salesUnit ? () => line.salesUnit : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Input
        type="number"
        min={0}
        value={line.unitPrice}
        onChange={(e) => onChange({ unitPrice: e.target.value })}
        placeholder="Unit price"
        aria-label="Unit price"
      />
      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0"
        disabled={!canRemove}
        onClick={onRemove}
        aria-label="Remove line"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
