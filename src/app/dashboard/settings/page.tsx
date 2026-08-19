"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus, MoreHorizontal, Shield, Building2, Mail, UserCog,
  Wrench, Settings as SettingsIcon, AlertTriangle, CheckCircle,
  Clock, Cog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useMe } from "@/hooks/auth";
import { useUsers } from "@/hooks/users";
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

const userColumns: ColumnDef<TableFeatures, UserResponse>[] = [
  {
    accessorKey: "fullName",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <span className="text-xs font-medium">
            {(row.getValue("fullName") as string)?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <span className="font-medium">{row.getValue("fullName")}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Mail className="size-3.5" />
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <Badge variant="outline">{roleLabels[role] ?? role}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit Role</DropdownMenuItem>
          <DropdownMenuItem>Reset Password</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const maintenanceFeatures = [
  {
    icon: <Cog className="size-5 text-white" />,
    iconBg: "bg-primary",
    title: "Machine Management",
    description: "Track machine status, register new machines, and monitor active equipment.",
    status: "available" as const,
  },
  {
    icon: <Wrench className="size-5 text-white" />,
    iconBg: "bg-success",
    title: "Preventive Maintenance",
    description: "Schedule preventive maintenance and track service history.",
    status: "planned" as const,
  },
  {
    icon: <AlertTriangle className="size-5 text-white" />,
    iconBg: "bg-warning-foreground",
    title: "Warranty Tracking",
    description: "Manage product warranties, track activation dates, and process claims.",
    status: "planned" as const,
  },
];

const maintenanceStatus = {
  available: { label: "Available", color: "border-success/30 bg-success/10 text-success" },
  planned: { label: "Planned", color: "border-border bg-muted/60 text-muted-foreground" },
};

export default function SettingsPage() {
  const { data: me } = useMe();
  const { data: users, isLoading: usersLoading } = useUsers(me?.organization?.id);
  const org = me?.organization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <SettingsIcon className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization profile, team, and maintenance.
          </p>
        </div>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">
            <Building2 className="mr-1.5 size-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="mr-1.5 size-4" />
            Users & Roles
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="mr-1.5 size-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Your business identity on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {org ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="font-medium">{org.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <Badge variant="outline">{org.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                    <Badge variant="outline">{roleLabels[me?.role ?? ""] ?? me?.role}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm text-faint">{me?.id}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No organization linked.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>{users?.length ?? 0} users in your organization</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">Loading users...</div>
              ) : (
                <DataTable
                  columns={userColumns}
                  data={users ?? []}
                  filterPlaceholder="Search users..."
                  filterColumn="fullName"
                  pageSize={10}
                  noBorder
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance & Equipment</CardTitle>
                <CardDescription>Manage machine lifecycle, maintenance schedules, and warranties</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              {maintenanceFeatures.map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${f.iconBg} text-white`}>
                        {f.icon}
                      </div>
                      <Badge variant="outline" className={maintenanceStatus[f.status].color}>
                        {maintenanceStatus[f.status].label}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
