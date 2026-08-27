"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Plus,
  Send,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  useCreatePurchaseOrder,
  useCreateSupplier,
  usePurchaseOrders,
  useReceivePurchaseOrder,
  useSendPurchaseOrder,
  useSuppliers,
} from "@/hooks/purchasing";
import { useProducts } from "@/hooks/products";
import type { PurchaseOrder, Supplier } from "@/services/purchasing.service";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  SENT: "border-info bg-info text-white",
  CONFIRMED: "border-primary bg-primary text-white",
  RECEIVING: "border-warning bg-warning text-warning-foreground",
  CLOSED: "border-success bg-success text-white",
  CANCELLED: "border-danger bg-danger text-white",
};

/**
 * Inbound purchasing workspace (DR-10).
 *
 * POs are commercial paper: receive updates quantities on the document.
 * Physical custody still moves through Transfer receive elsewhere.
 */
export default function PurchasingPage() {
  const [tab, setTab] = useState("orders");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <ShoppingBag className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground">
            Suppliers and purchase orders. Receiving here records the paper trail —
            stock still arrives via transfer receive.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="size-3.5" /> Orders
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="size-3.5" /> Suppliers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersPanel />
        </TabsContent>
        <TabsContent value="suppliers">
          <SuppliersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersPanel() {
  const { data, isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const create = useCreatePurchaseOrder();
  const send = useSendPurchaseOrder();
  const confirm = useConfirmPurchaseOrder();
  const cancel = useCancelPurchaseOrder();
  const receive = useReceivePurchaseOrder();
  const [createOpen, setCreateOpen] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);

  const orders = data?.content ?? [];

  const columns: ColumnDef<TableFeatures, PurchaseOrder>[] = [
    {
      accessorKey: "poNumber",
      header: "PO #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("poNumber")}</span>
      ),
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={cn("font-semibold", statusColors[status])}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number | null;
        return (
          <span className="tabular-nums text-sm">
            {amount == null ? "—" : `RWF ${amount.toLocaleString()}`}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {order.status === "DRAFT" ? (
                <DropdownMenuItem onClick={() => send.mutate(order.id)}>
                  <Send className="mr-2 size-4" /> Send
                </DropdownMenuItem>
              ) : null}
              {order.status === "SENT" ? (
                <DropdownMenuItem onClick={() => confirm.mutate(order.id)}>
                  <CheckCircle className="mr-2 size-4" /> Confirm
                </DropdownMenuItem>
              ) : null}
              {order.status === "CONFIRMED" || order.status === "RECEIVING" ? (
                <DropdownMenuItem onClick={() => setReceiving(order)}>
                  <Truck className="mr-2 size-4" /> Record receipt
                </DropdownMenuItem>
              ) : null}
              {order.status === "DRAFT" ||
              order.status === "SENT" ||
              order.status === "CONFIRMED" ? (
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => cancel.mutate(order.id)}
                >
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" /> New purchase order
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Purchase orders</CardTitle>
          <CardDescription>
            Draft → send → confirm → record receipt on the document. Custody moves via
            transfers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              filterColumn="poNumber"
              filterPlaceholder="Search POs…"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <NewPoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        suppliers={suppliers}
        pending={create.isPending}
        onSubmit={(data) =>
          create.mutate(data, { onSuccess: () => setCreateOpen(false) })
        }
      />

      <ReceiveDialog
        order={receiving}
        onOpenChange={(open) => !open && setReceiving(null)}
        pending={receive.isPending}
        onSubmit={(receipts) => {
          if (!receiving) return;
          receive.mutate(
            { id: receiving.id, data: { receipts } },
            { onSuccess: () => setReceiving(null) },
          );
        }}
      />
    </div>
  );
}

function SuppliersPanel() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const create = useCreateSupplier();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const columns: ColumnDef<TableFeatures, Supplier>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("code")}</span>
      ),
    },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.active
              ? "border-transparent bg-success text-white"
              : "border-border bg-muted text-muted-foreground"
          }
        >
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" /> Add supplier
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>
            Who you buy from. Optionally link a platform organization later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable columns={columns} data={suppliers} pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Add supplier</DialogTitle>
            <DialogDescription>Name is enough to start buying.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || create.isPending}
              onClick={() =>
                create.mutate(
                  { name: name.trim() },
                  {
                    onSuccess: () => {
                      setName("");
                      setOpen(false);
                    },
                  },
                )
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function NewPoDialog({
  open,
  onOpenChange,
  suppliers,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  pending: boolean;
  onSubmit: (data: {
    supplierId: number;
    lines: { productId: number; quantity: string; unitPrice: string }[];
  }) => void;
}) {
  const { data: productsPage } = useProducts(0, 200);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const list = productsPage?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>One line to start — add more later if needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter((s) => s.active)
                  .map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Catalogue item to stock" />
              </SelectTrigger>
              <SelectContent>
                {list.map((p: { id: number; name: string }) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unit price</Label>
              <Input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !supplierId ||
              !productId ||
              !quantity ||
              !unitPrice ||
              pending
            }
            onClick={() =>
              onSubmit({
                supplierId: Number(supplierId),
                lines: [
                  {
                    productId: Number(productId),
                    quantity,
                    unitPrice,
                  },
                ],
              })
            }
          >
            Create draft
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function ReceiveDialog({
  order,
  onOpenChange,
  onSubmit,
  pending,
}: {
  order: PurchaseOrder | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (receipts: { lineId: number; quantity: string }[]) => void;
  pending: boolean;
}) {
  const [qtyByLine, setQtyByLine] = useState<Record<number, string>>({});

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Record receipt · {order.poNumber}</DialogTitle>
          <DialogDescription>
            Updates the PO document only. Confirm physical stock on the transfer receive
            screen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {order.lines.map((line) => {
            const remaining = line.quantity - line.receivedQuantity;
            return (
              <div key={line.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Ordered {line.quantity} · received {line.receivedQuantity} · remaining{" "}
                    {remaining}
                  </p>
                </div>
                <Input
                  placeholder="Qty this receipt"
                  value={qtyByLine[line.id] ?? ""}
                  onChange={(e) =>
                    setQtyByLine((prev) => ({ ...prev, [line.id]: e.target.value }))
                  }
                />
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              const receipts = order.lines
                .map((line) => ({
                  lineId: line.id,
                  quantity: qtyByLine[line.id] ?? "",
                }))
                .filter((r) => Number(r.quantity) > 0);
              if (receipts.length) onSubmit(receipts);
            }}
          >
            Save receipt
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
