"use client";

import { useState } from "react";
import { Users, MoreHorizontal, Mail, Shield } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUsers } from "@/hooks/users";
import { useMe } from "@/hooks/auth";
import { EditRoleDialog } from "@/components/dashboard/edit-role-dialog";
import type { UserResponse } from "@/lib/api";

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  ORG_ADMIN: "Org Admin",
  PRODUCTION_MANAGER: "Production Manager",
  PRODUCTION_OFFICER: "Production Officer",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  WAREHOUSE_OFFICER: "Warehouse Officer",
  QUALITY_OFFICER: "Quality Officer",
  LOGISTICS_OFFICER: "Logistics Officer",
  SALES_OFFICER: "Sales Officer",
  MANAGEMENT: "Management",
  AUDITOR: "Auditor",
};

const roleColors: Record<string, string> = {
  SYSTEM_ADMIN: "bg-danger/10 text-danger border-danger/20",
  ORG_ADMIN: "bg-primary/10 text-primary border-primary/20",
  PRODUCTION_MANAGER: "bg-success/10 text-success border-success/20",
  PRODUCTION_OFFICER: "bg-success/10 text-success border-success/20",
  WAREHOUSE_MANAGER: "bg-warning/10 text-warning-foreground border-warning/20",
  WAREHOUSE_OFFICER: "bg-warning/10 text-warning-foreground border-warning/20",
  QUALITY_OFFICER: "bg-info/10 text-info border-info/20",
  LOGISTICS_OFFICER: "bg-primary/10 text-primary border-primary/20",
  SALES_OFFICER: "bg-success/10 text-success border-success/20",
  MANAGEMENT: "bg-muted text-muted-foreground border-border",
  AUDITOR: "bg-muted text-muted-foreground border-border",
};

export default function UsersPage() {
  const { data: me } = useMe();
  const { data: users, isLoading } = useUsers();
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [showEditRole, setShowEditRole] = useState(false);

  const columns: ColumnDef<TableFeatures, UserResponse>[] = [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <span className="text-xs font-medium">
              {row.original.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.original.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.original.organization?.name ?? "No org"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="size-3.5" />
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant="outline" className={roleColors[role] ?? ""}>
            {roleLabels[role] ?? role}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditUser(user);
                  setShowEditRole(true);
                }}
              >
                <Shield className="mr-2 size-4" /> Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem>Reset Password</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Users className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage all users across the platform
          </p>
        </div>
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
                      <div className="h-2 w-24 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users ?? []}
              filterColumn="fullName"
              filterPlaceholder="Search users..."
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <EditRoleDialog
        open={showEditRole}
        onOpenChange={setShowEditRole}
        user={editUser}
      />
    </div>
  );
}
