"use client";

import { useMemo, useState } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Plus,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useOrganizations } from "@/hooks/organizations";
import { TRADE_TYPES } from "@/services/organization.service";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/commerce";
import type { Customer } from "@/services/commerce.service";

type CustomerFormValues = {
  name: string;
  type: string;
  buyerOrganizationId?: number | null;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number | null;
};

export default function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);

  const customers = data?.content ?? [];
  const total = data?.total ?? 0;
  const businessCount = customers.filter((c) => c.type === "BUSINESS").length;
  const consumerCount = customers.filter((c) => c.type === "CONSUMER").length;

  const columns = useMemo<ColumnDef<TableFeatures, Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Customer Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const isBusiness = row.original.type === "BUSINESS";
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                {isBusiness ? (
                  <Building2 className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div>
                <p className="font-medium">{row.getValue("name")}</p>
                <p className="font-mono text-xs text-faint">{row.original.code}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return (
            <Badge
              variant="outline"
              className={
                type === "BUSINESS"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-success/30 bg-success/10 text-success"
              }
            >
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
              <div className="text-xs text-faint">
                {row.original.buyerOrganizationName}
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sale — off-platform</span>
          ),
      },
      {
        accessorKey: "contactPerson",
        header: "Contact",
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("contactPerson") || "—"}</span>
        ),
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
          return limit != null ? (
            <span className="text-sm font-medium">{limit.toLocaleString()} RWF</span>
          ) : (
            "—"
          );
        },
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => {
          const active = row.getValue("active") as boolean;
          return (
            <Badge
              variant="outline"
              className={
                active
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted/60 text-muted-foreground"
              }
            >
              {active ? "Active" : "Suspended"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewing(customer)}>
                  <Eye className="mr-2 size-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(customer);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Edit
                </DropdownMenuItem>
                {customer.active ? (
                  <DropdownMenuItem
                    className="text-danger"
                    onClick={() =>
                      updateCustomer.mutate({
                        id: customer.id,
                        data: { active: false },
                      })
                    }
                  >
                    <Ban className="mr-2 size-4" /> Suspend
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      updateCustomer.mutate({
                        id: customer.id,
                        data: { active: true },
                      })
                    }
                  >
                    <CheckCircle className="mr-2 size-4" /> Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateCustomer],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer directory and credit accounts.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Add customer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Customers"
          value={total}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Registered buyers"
        />
        <MetricCard
          title="Business"
          value={businessCount}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="B2B accounts"
        />
        <MetricCard
          title="Consumers"
          value={consumerCount}
          icon={<User className="size-4" />}
          iconBg="bg-success"
          caption="B2C accounts"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>{total} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading customers...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              filterPlaceholder="Search customers..."
              filterColumn="name"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={formOpen}
        customer={editing}
        pending={createCustomer.isPending || updateCustomer.isPending}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
        onSubmit={(values) => {
          if (editing) {
            updateCustomer.mutate(
              { id: editing.id, data: values },
              {
                onSuccess: () => {
                  setFormOpen(false);
                  setEditing(null);
                },
              },
            );
          } else {
            createCustomer.mutate(values, {
              onSuccess: () => {
                setFormOpen(false);
              },
            });
          }
        }}
      />

      <ViewCustomerDialog
        customer={viewing}
        onOpenChange={(next) => {
          if (!next) setViewing(null);
        }}
        onEdit={() => {
          if (!viewing) return;
          setEditing(viewing);
          setViewing(null);
          setFormOpen(true);
        }}
      />
    </div>
  );
}

function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerFormValues) => void;
  pending: boolean;
}) {
  const { data: businesses } = useOrganizations(TRADE_TYPES);
  const isEdit = !!customer;

  const [name, setName] = useState("");
  const [type, setType] = useState("BUSINESS");
  const [buyerOrganizationId, setBuyerOrganizationId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("");

  const syncFromCustomer = (c: Customer | null) => {
    if (!c) {
      setName("");
      setType("BUSINESS");
      setBuyerOrganizationId("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setCreditLimit("");
      return;
    }
    setName(c.name ?? "");
    setType(c.type ?? "BUSINESS");
    setBuyerOrganizationId(
      c.buyerOrganizationId != null ? String(c.buyerOrganizationId) : "",
    );
    setContactPerson(c.contactPerson ?? "");
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setAddress(c.address ?? "");
    setCreditLimit(c.creditLimit != null ? String(c.creditLimit) : "");
  };

  const companyItems = (businesses ?? []).map((org) => ({
    value: String(org.id),
    label: org.name,
    badge: org.type,
  }));

  const parsedCredit =
    creditLimit.trim() === "" ? null : Number(creditLimit.replace(/,/g, ""));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) syncFromCustomer(customer);
        else syncFromCustomer(null);
        onOpenChange(next);
      }}
    >
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add a customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details used on sales and credit."
              : "Someone you sell to. Businesses can link a SANTRACK company; consumers do not."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer type</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  const next = v ?? "BUSINESS";
                  setType(next);
                  if (next === "CONSUMER") setBuyerOrganizationId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="CONSUMER">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name on your list</Label>
              <Input
                id="customer-name"
                placeholder={
                  type === "CONSUMER"
                    ? "e.g. Walk-in customer"
                    : "e.g. Kigali Wholesale Ltd"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {type === "BUSINESS" ? (
            <div className="space-y-2">
              <Label>Their company on SANTRACK (optional)</Label>
              <SearchableSelect
                value={buyerOrganizationId}
                onValueChange={(v) => {
                  setBuyerOrganizationId(v);
                  if (v) {
                    const org = businesses?.find((o) => String(o.id) === v);
                    if (org && !name.trim()) setName(org.name);
                  }
                }}
                items={companyItems}
                placeholder="Search or leave empty…"
                searchPlaceholder="Search companies…"
                emptyMessage="No matching company."
                allowClear
              />
              <p className="text-xs text-muted-foreground">
                Linked company → fulfilment as transfer. Empty → sale off-platform.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer-contact">Contact person</Label>
              <Input
                id="customer-contact"
                placeholder={
                  type === "CONSUMER" ? "Optional" : "e.g. Jean Uwimana"
                }
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                placeholder="e.g. +250 788 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="e.g. orders@example.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address (optional)</Label>
              <Input
                id="customer-address"
                placeholder="e.g. KN 5 Ave, Kigali"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-credit">Credit limit (RWF)</Label>
              <Input
                id="customer-credit"
                inputMode="numeric"
                placeholder="Leave empty for none"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              name.trim().length === 0 ||
              pending ||
              (creditLimit.trim() !== "" &&
                (parsedCredit == null || Number.isNaN(parsedCredit) || parsedCredit < 0))
            }
            onClick={() =>
              onSubmit({
                name: name.trim(),
                type,
                buyerOrganizationId:
                  type === "BUSINESS"
                    ? buyerOrganizationId
                      ? Number(buyerOrganizationId)
                      : null
                    : null,
                contactPerson: contactPerson.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                address: address.trim() || undefined,
                creditLimit: creditLimit.trim() === "" ? null : parsedCredit,
              })
            }
          >
            {pending
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save changes"
                : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function ViewCustomerDialog({
  customer,
  onOpenChange,
  onEdit,
}: {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <Dialog open={!!customer} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer?.name ?? "Customer"}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {customer?.code}
          </DialogDescription>
        </DialogHeader>

        {customer ? (
          <dl className="grid gap-3 py-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{customer.type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {customer.active ? "Active" : "Suspended"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Fulfilment</dt>
              <dd className="font-medium">
                {customer.buyerOrganizationId
                  ? `Transfer → ${customer.buyerOrganizationName}`
                  : "Sale — off-platform"}
              </dd>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set by linking their SANTRACK company (business only), not a
                separate field.
              </p>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact person</dt>
              <dd>{customer.contactPerson || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{customer.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{customer.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Credit limit</dt>
              <dd>
                {customer.creditLimit != null
                  ? `${customer.creditLimit.toLocaleString()} RWF`
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd>{customer.address || "—"}</dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="mr-2 size-4" /> Edit
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
