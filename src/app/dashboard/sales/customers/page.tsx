"use client";

import { useState } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Building2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogPopup, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useOrganizations } from "@/hooks/organizations";
import { TRADE_TYPES } from "@/services/organization.service";
import { useCustomers, useCreateCustomer } from "@/hooks/commerce";
import type { Customer } from "@/services/commerce.service";

const columns: ColumnDef<TableFeatures, Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Customer Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="size-4" />
        </div>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="font-mono text-xs text-faint">{row.original.code}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className={type === "BUSINESS" ? "border-primary/30 bg-primary/10 text-primary" : "border-success/30 bg-success/10 text-success"}>
          {type}
        </Badge>
      );
    },
  },
  {
    id: "buyer",
    header: "Fulfilment",
    cell: ({ row }) =>
      row.original.buyerOrganizationId ? (
        <div className="text-sm">
          <div>Transfer</div>
          <div className="text-xs text-faint">{row.original.buyerOrganizationName}</div>
        </div>
      ) : (
        // Nobody downstream can confirm a receipt, so the goods leave the chain.
        <span className="text-sm text-muted-foreground">Sale — off-platform</span>
      ),
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    cell: ({ row }) => <span className="text-sm">{row.getValue("contactPerson") || "—"}</span>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="size-3.5" />
        {row.getValue("phone") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Mail className="size-3.5" />
        {row.getValue("email") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "creditLimit",
    header: "Credit Limit",
    cell: ({ row }) => {
      const limit = row.getValue("creditLimit") as number | null;
      return limit ? <span className="text-sm font-medium">{limit.toLocaleString()} RWF</span> : "—";
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge variant="outline" className={active ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted/60 text-muted-foreground"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [open, setOpen] = useState(false);
  const customers = data?.content ?? [];
  const total = data?.total ?? 0;
  const businessCount = customers.filter((c) => c.type === "BUSINESS").length;
  const consumerCount = customers.filter((c) => c.type === "CONSUMER").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">Manage your customer directory and credit accounts.</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Add customer</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Customers" value={total} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="Registered buyers" />
        <MetricCard title="Business" value={businessCount} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="B2B accounts" />
        <MetricCard title="Consumers" value={consumerCount} icon={<Building2 className="size-4" />} iconBg="bg-success" caption="B2C accounts" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>{total} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading customers...</div>
          ) : (
            <DataTable columns={columns} data={customers} filterPlaceholder="Search customers..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <NewCustomerDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => createCustomer.mutate(data, { onSuccess: () => setOpen(false) })}
        pending={createCustomer.isPending}
      />
    </div>
  );
}

/**
 * Whether the buyer is a business on the platform is the one field here that
 * changes what the system does later: with it set, fulfilling an order raises
 * a transfer the buyer confirms; without it, the goods leave the traceable
 * chain and fulfilment records a sale.
 */
function NewCustomerDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Customer> & { buyerOrganizationId?: number }) => void;
  pending: boolean;
}) {
  const { data: businesses } = useOrganizations(TRADE_TYPES);

  const [name, setName] = useState("");
  const [type, setType] = useState("BUSINESS");
  const [buyerOrganizationId, setBuyerOrganizationId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const reset = () => {
    setName("");
    setType("BUSINESS");
    setBuyerOrganizationId("");
    setContactPerson("");
    setPhone("");
    setEmail("");
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
          <DialogTitle>Add a customer</DialogTitle>
          <DialogDescription>
            Someone you sell to. Link them to a registered organization if they are on the
            platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "BUSINESS")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="CONSUMER">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Buying organization (optional)</Label>
            <Select
              value={buyerOrganizationId}
              onValueChange={(v) => setBuyerOrganizationId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Not on the platform">
                  {buyerOrganizationId
                    ? () =>
                        businesses?.find((o) => String(o.id) === buyerOrganizationId)?.name ??
                        buyerOrganizationId
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {businesses?.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Set it and fulfilment transfers goods to them, which they confirm on receipt. Leave
              it blank and fulfilment sells the goods out of the chain.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer-contact">Contact</Label>
              <Input
                id="customer-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={name.trim().length === 0 || pending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                type,
                buyerOrganizationId: buyerOrganizationId
                  ? Number(buyerOrganizationId)
                  : undefined,
                contactPerson: contactPerson.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
              })
            }
          >
            {pending ? "Adding..." : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
