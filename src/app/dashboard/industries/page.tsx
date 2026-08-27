"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building2, MoreHorizontal, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useCapabilities } from "@/hooks/permissions";
import { IndustryEditDialog } from "./edit-dialog";
import { useState } from "react";
import type { OrganizationResponse } from "@/lib/api";

type Industry = {
  id: string;
  name: string;
  category: string;
  type: string;
  status: "active" | "pending" | "inactive";
  orgId: number;
  staff: number;
  products: number;
};

/**
 * Whether a business is currently licensed to trade.
 *
 * This column used to be hard-coded to "active" for everybody, which made the
 * screen useless to the people it exists for — a register that says every
 * company is fine is not a compliance tool. It now reads the licences the
 * registry returns.
 */
function licenceStanding(
  licenses: { status: string }[],
): Industry["status"] {
  if (licenses.some((l) => l.status === "ACTIVE")) return "active";
  if (licenses.some((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW"))
    return "pending";
  return "inactive";
}

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

function StatusBadge({ status }: { status: Industry["status"] }) {
  return (
    <Badge
      variant={status === "active" ? "success" : status === "pending" ? "warning" : "ghost"}
      className={
        status === "active"
          ? undefined
          : status === "pending"
            ? undefined
            : "bg-muted-foreground text-white"
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

/**
 * The industry register.
 *
 * A supervisory screen, not an operational one: proposal section 3 puts
 * industry registration, licensing and compliance with the regulatory
 * authorities, so this is what they and the platform operator see. Everyone
 * else is turned away by the route guard before this component renders, and by
 * the API if they call it directly.
 *
 * Reading the register and changing it are different permissions. A regulator
 * supervises the businesses on the platform; only the operator edits the
 * record of who they are.
 */
export default function IndustriesPage() {
  const router = useRouter();
  const permissions = useCapabilities();
  const mayAdminister = permissions.can("ADMINISTER_PLATFORM");

  const { data: orgs, isLoading } = useIndustryRegistry();
  const [editOrg, setEditOrg] = useState<OrganizationResponse | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const industries: Industry[] =
    orgs?.map((org) => ({
      id: `ORG-${String(org.id).padStart(3, "0")}`,
      name: org.name,
      category: TYPE_LABELS[org.type] ?? org.type,
      type: org.type,
      status: licenceStanding(org.licenses),
      orgId: org.id,
      staff: org.staff,
      products: org.products,
    })) ?? [];

  const columns: ColumnDef<TableFeatures, Industry>[] = [
    {
      accessorKey: "name",
      header: "Industry",
      cell: ({ row }) => {
        const industry = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-success text-white text-xs">
                {industry.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{industry.name}</div>
              <div className="text-xs text-muted-foreground">{industry.id}</div>
            </div>
          </div>
        );
      },
    },
    { accessorKey: "category", header: "Category" },
    {
      id: "scale",
      header: "Scale",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{row.original.staff}</span> staff
          <span className="mx-1.5 text-faint">·</span>
          <span className="font-medium text-foreground">{row.original.products}</span> products
        </div>
      ),
    },
    {
      id: "status",
      header: "Licence",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const industry = row.original;
        const org = orgs?.find((o) => o.id === industry.orgId);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/industries/${industry.orgId}`)}>
                <Eye className="mr-2 size-4" /> View Details
              </DropdownMenuItem>
              {/* Supervising a business and editing the record of who it is
                  are different jobs. A regulator does the first. */}
              {mayAdminister && (
                <DropdownMenuItem
                  onClick={() => {
                    setEditOrg(org ?? null);
                    setShowEdit(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Edit
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Industries</h1>
            <p className="text-sm text-muted-foreground">
              Every business registered on the platform, with its licence
              standing
            </p>
          </div>
        </div>
        {mayAdminister && (
          <Link href="/dashboard/industries/new">
            <Button><Plus className="mr-2 size-4" /> Add Industry</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={industries} filterColumn="name" filterPlaceholder="Search industries..." pageSize={5} noBorder />
          )}
        </CardContent>
      </Card>

      <IndustryEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        organization={editOrg}
      />
    </div>
  );
}
