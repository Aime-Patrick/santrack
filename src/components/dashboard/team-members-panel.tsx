"use client";

import { useMemo, useState } from "react";
import {
  KeyRound, Mail, MoreHorizontal, Plus, Shield, UserMinus, Users,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMe } from "@/hooks/auth";
import { useUsers } from "@/hooks/users";
import { AddUserDialog } from "@/components/dashboard/add-user-dialog";
import { EditRoleDialog } from "@/components/dashboard/edit-role-dialog";
import { ResetPasswordDialog } from "@/components/dashboard/reset-password-dialog";
import { DeactivateUserDialog } from "@/components/dashboard/deactivate-user-dialog";
import type { UserResponse } from "@/lib/api";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/user-roles";

interface TeamMembersPanelProps {
  /** Card chrome around the table. Off when the parent already wraps content. */
  framed?: boolean;
  title?: string;
  description?: string;
}

export function TeamMembersPanel({
  framed = true,
  title = "Team members",
  description,
}: TeamMembersPanelProps) {
  const { data: me } = useMe();
  const orgId = me?.organization?.id;
  // Org admins are scoped by the API; pass org id so the list matches Settings.
  // System admins omit it to see everyone.
  const listOrgId = me?.role === "SYSTEM_ADMIN" ? undefined : orgId;
  const listEnabled = me?.role === "SYSTEM_ADMIN" || !!orgId;
  const { data: users, isLoading } = useUsers(listOrgId, { enabled: listEnabled });

  const [addOpen, setAddOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const canAdd = me?.role === "SYSTEM_ADMIN" || !!orgId;
  const showOrgColumn = me?.role === "SYSTEM_ADMIN";

  const columns = useMemo((): ColumnDef<TableFeatures, UserResponse>[] => {
    const cols: ColumnDef<TableFeatures, UserResponse>[] = [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <span className="text-xs font-medium">
                {row.original.fullName?.charAt(0)?.toUpperCase() ??
                  row.original.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium">
                {row.original.fullName || row.original.email}
                {me?.id === row.original.id ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (you)
                  </span>
                ) : null}
              </div>
              {showOrgColumn ? (
                <div className="text-xs text-muted-foreground">
                  {row.original.organization?.name ?? "No organization"}
                </div>
              ) : null}
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
            <Badge variant="outline" className={ROLE_COLORS[role] ?? ""}>
              {ROLE_LABELS[role] ?? role}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = me?.id === user.id;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="size-8 p-0" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem
                  onClick={() => {
                    setActiveUser(user);
                    setEditOpen(true);
                  }}
                >
                  <Shield className="size-4" />
                  Edit role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveUser(user);
                    setResetOpen(true);
                  }}
                >
                  <KeyRound className="size-4" />
                  Reset password
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSelf}
                  onClick={() => {
                    if (isSelf) return;
                    setActiveUser(user);
                    setDeactivateOpen(true);
                  }}
                >
                  <UserMinus className="size-4" />
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
    return cols;
  }, [me?.id, showOrgColumn]);

  const caption =
    description ??
    (me?.role === "SYSTEM_ADMIN"
      ? `${users?.length ?? 0} users across the platform`
      : `${users?.length ?? 0} users in your organization`);

  const addButton = (
    <Button
      size="sm"
      disabled={!canAdd}
      title={!canAdd ? "Complete organization setup before adding users" : undefined}
      onClick={() => setAddOpen(true)}
    >
      <Plus className="mr-1.5 size-4" />
      Add user
    </Button>
  );

  const table = isLoading ? (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center justify-between">
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
  );

  const dialogs = (
    <>
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        lockedOrganizationId={me?.role === "SYSTEM_ADMIN" ? undefined : orgId}
      />
      <EditRoleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={activeUser}
      />
      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        user={activeUser}
      />
      <DeactivateUserDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        user={activeUser}
      />
    </>
  );

  if (!framed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{caption}</p>
          </div>
          {addButton}
        </div>
        {table}
        {dialogs}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              {title}
            </CardTitle>
            <CardDescription>{caption}</CardDescription>
          </div>
          {addButton}
        </CardHeader>
        <CardContent>{table}</CardContent>
      </Card>
      {dialogs}
    </>
  );
}
