"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Plus,
  ClipboardList,
  CheckCircle,
  Truck,
  XCircle,
  MoreHorizontal,
  Trash2,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  useSalesOrders,
  useCreateSalesOrder,
  useConfirmSalesOrder,
  useAcceptRounding,
  useReleaseSalesOrder,
  useFulfilSalesOrder,
  useCancelSalesOrder,
  useFulfilmentPlan,
  useCustomers,
} from "@/hooks/commerce";
import { useProducts } from "@/hooks/products";
import { sellableUnits } from "@/lib/sales-unit";
import type {
  CommerceLineInput,
  Customer,
  FulfilmentPlanLine,
  SalesOrder,
} from "@/services/commerce.service";
import type { Product } from "@/services/product.service";

/**
 * Sales orders — place, confirm, fulfil.
 *
 * Confirming reserves specific identities using FEFO, so the goods committed
 * to this order are the ones expiring soonest and cannot be sold to anyone
 * else. Fulfilling hands them over: to a registered buyer as a transfer they
 * confirm on receipt, and to an off-platform customer as a sale, because
 * nobody downstream can confirm anything.
 */

const statusColors: Record<string, string> = {
  PLACED: "border-border bg-muted/60 text-muted-foreground",
  CONFIRMED: "border-primary/30 bg-primary/10 text-primary",
  FULFILLED: "border-success/30 bg-success/10 text-success",
  CANCELLED: "border-danger/30 bg-danger/10 text-danger",
};

function isRoundingError(message: string | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("rounding");
}

function formatFulfilmentSummary(line: FulfilmentPlanLine): string {
  const unit = line.salesUnit ?? line.baseUnit ?? "units";
  const requested = `${line.requestedQuantity} ${unit} requested`;
  const fulfilment = line.plannedFulfilmentQuantity;
  if (fulfilment == null) {
    return line.shortfall
      ? `${requested} → not enough stock`
      : `${requested} → plan unavailable`;
  }

  const base = line.baseUnit ?? "units";
  const pack = line.packUnit;
  const perPack = line.unitsPerPack;

  if (pack && perPack && perPack >= 2) {
    const cartons = Math.floor(fulfilment / perPack);
    const bottles = Math.round((fulfilment % perPack) * 1e6) / 1e6;
    const parts: string[] = [];
    if (cartons > 0) parts.push(`${cartons} ${pack}`);
    if (bottles > 0) parts.push(`${bottles} ${base}`);
    if (parts.length === 0) parts.push(`0 ${base}`);
    return `${requested} → ${parts.join(" / ")} to fulfil`;
  }

  return `${requested} → ${fulfilment} ${base} to fulfil`;
}

export function SalesOrdersPanel() {
  const { data, isLoading } = useSalesOrders();
  const { data: customerData } = useCustomers();
  const createOrder = useCreateSalesOrder();
  const confirmOrder = useConfirmSalesOrder();
  const acceptRounding = useAcceptRounding();
  const releaseOrder = useReleaseSalesOrder();
  const fulfilOrder = useFulfilSalesOrder();
  const cancelOrder = useCancelSalesOrder();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null);

  const orders = data?.content ?? [];
  const total = data?.total ?? 0;
  const customers = customerData?.content ?? [];

  const placed = orders.filter((o) => o.status === "PLACED").length;
  const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
  const fulfilled = orders.filter((o) => o.status === "FULFILLED").length;

  const openConfirm = (order: SalesOrder) => setConfirmOrderId(order.id);

  const columns: ColumnDef<TableFeatures, SalesOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("orderNumber")}</span>,
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
        return (
          <Badge variant="outline" className={statusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "handover",
      header: "Handover",
      cell: ({ row }) => {
        const order = row.original;
        if (order.transferId) {
          return (
            <span className="text-sm">
              Transfer <span className="font-mono text-xs text-faint">#{order.transferId}</span>
            </span>
          );
        }
        if (order.saleId) {
          return (
            <span className="text-sm">
              Sale <span className="font-mono text-xs text-faint">#{order.saleId}</span>
            </span>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number | null;
        return (
          <span className="text-sm tabular-nums">
            {amount === null ? "—" : `RWF ${amount.toLocaleString()}`}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Placed
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {order.status === "PLACED" ? (
                <DropdownMenuItem onClick={() => openConfirm(order)}>
                  <CheckCircle className="mr-2 size-4" /> Confirm and reserve stock
                </DropdownMenuItem>
              ) : null}
              {order.status === "CONFIRMED" ? (
                <>
                  <DropdownMenuItem onClick={() => releaseOrder.mutate(order.id)}>
                    <Unlock className="mr-2 size-4" /> Release stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fulfilOrder.mutate(order.id)}>
                    <Truck className="mr-2 size-4" /> Fulfil
                  </DropdownMenuItem>
                </>
              ) : null}
              {order.status === "PLACED" || order.status === "CONFIRMED" ? (
                <DropdownMenuItem onClick={() => cancelOrder.mutate(order.id)} className="text-danger">
                  <XCircle className="mr-2 size-4" /> Cancel
                </DropdownMenuItem>
              ) : null}
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
          Place an order, reserve the stock, then hand the goods over.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" /> New order
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Orders" value={total} icon={<ClipboardList className="size-4" />} iconBg="bg-primary" caption="All sales orders" />
        <MetricCard title="Placed" value={placed} icon={<Plus className="size-4" />} iconBg="bg-muted text-muted-foreground" caption="Stock not yet reserved" />
        <MetricCard title="Confirmed" value={confirmed} icon={<CheckCircle className="size-4" />} iconBg="bg-primary" caption="Stock reserved, awaiting dispatch" />
        <MetricCard title="Fulfilled" value={fulfilled} icon={<Truck className="size-4" />} iconBg="bg-success" caption="Goods handed over" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Confirming reserves the identities expiring soonest (FEFO); they cannot be sold or
            dispatched elsewhere while they are held.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="size-8 text-faint" />
              <p className="text-sm text-muted-foreground">No sales orders yet.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Place the first one
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              filterPlaceholder="Search orders..."
              filterColumn="orderNumber"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <NewOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        customers={customers}
        onSubmit={(data) => createOrder.mutate(data, { onSuccess: () => setCreateOpen(false) })}
        pending={createOrder.isPending}
      />

      <ConfirmOrderDialog
        orderId={confirmOrderId}
        order={orders.find((o) => o.id === confirmOrderId) ?? null}
        onOpenChange={(open) => {
          if (!open) setConfirmOrderId(null);
        }}
        onConfirm={(id, onRoundingRequired) =>
          confirmOrder.mutate(id, {
            onSuccess: () => setConfirmOrderId(null),
            onError: (e) => {
              const message =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              if (isRoundingError(message)) onRoundingRequired?.();
            },
          })
        }
        onAcceptRounding={(id) => acceptRounding.mutate(id)}
        confirmPending={confirmOrder.isPending}
        acceptPending={acceptRounding.isPending}
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

function NewOrderDialog({
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
    updateLine(index, {
      productId,
      salesUnit: units[0] ?? "",
    });
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

  const subtotal = validLines.reduce(
    (sum, line) => sum + Number(line.requestedQuantity) * Number(line.unitPrice),
    0,
  );

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
          <DialogTitle>Place a sales order</DialogTitle>
          <DialogDescription>
            Nothing is reserved yet — confirming the order is what commits stock to it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Who is buying">
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
              {chosen ? (
                <p className="text-xs text-muted-foreground">
                  {chosen.buyerOrganizationId
                    ? `Stock will transfer to ${chosen.buyerOrganizationName}, who confirms receipt.`
                    : "Not on SANTRACK — fulfilment records an off-platform sale."}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-percent">Tax %</Label>
              <Input
                id="tax-percent"
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
                  <OrderLineRow
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

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">RWF {subtotal.toLocaleString()}</span>
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
            {pending ? "Placing..." : "Place order"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function OrderLineRow({
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
        <Select
          value={line.salesUnit}
          onValueChange={(v) => onChange({ salesUnit: v ?? "" })}
        >
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

function ConfirmOrderDialog({
  orderId,
  order,
  onOpenChange,
  onConfirm,
  onAcceptRounding,
  confirmPending,
  acceptPending,
}: {
  orderId: number | null;
  order: SalesOrder | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: number, onRoundingRequired?: () => void) => void;
  onAcceptRounding: (id: number) => void;
  confirmPending: boolean;
  acceptPending: boolean;
}) {
  const open = orderId != null;
  const { data: plan, isLoading, isError, refetch } = useFulfilmentPlan(orderId, open);
  const [forceAccept, setForceAccept] = useState(false);

  const needsAccept =
    forceAccept ||
    (!!plan?.needsRoundingAccept && !plan.roundingAcceptedAt && !order?.roundingAcceptedAt);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setForceAccept(false);
        onOpenChange(next);
      }}
    >
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm and reserve stock</DialogTitle>
          <DialogDescription>
            {order
              ? `Review how ${order.orderNumber} will be fulfilled before reserving identities.`
              : "Review fulfilment before reserving stock."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading fulfilment plan…</p>
          ) : isError ? (
            <div className="space-y-2">
              <p className="text-sm text-danger">Could not load the fulfilment plan.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : plan ? (
            <>
              <ul className="space-y-2">
                {plan.lines.map((line) => (
                  <li
                    key={line.lineId}
                    className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{line.productName}</p>
                    <p className="mt-0.5 text-muted-foreground">{formatFulfilmentSummary(line)}</p>
                    {line.roundedUp ? (
                      <p className="mt-1 text-xs text-warning-foreground">
                        Fulfilment rounds up past the requested quantity.
                      </p>
                    ) : null}
                    {line.shortfall ? (
                      <p className="mt-1 text-xs text-danger">Not enough active stock for this line.</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {needsAccept ? (
                <p className="text-sm text-muted-foreground">
                  Warehouse rounding exceeds what was requested. Accept rounding before confirming.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {needsAccept && orderId != null ? (
            <Button
              variant="outline"
              disabled={acceptPending}
              onClick={() => {
                setForceAccept(false);
                onAcceptRounding(orderId);
              }}
            >
              {acceptPending ? "Accepting…" : "Accept rounding"}
            </Button>
          ) : null}
          <Button
            disabled={
              !orderId ||
              confirmPending ||
              isLoading ||
              !!plan?.lines.some((l) => l.shortfall) ||
              needsAccept
            }
            onClick={() =>
              orderId != null &&
              onConfirm(orderId, () => setForceAccept(true))
            }
          >
            {confirmPending ? "Confirming…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
