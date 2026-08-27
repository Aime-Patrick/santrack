"use client";

import {
  Building2, UserCog, Wrench, Settings as SettingsIcon, AlertTriangle, Cog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/auth";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { ROLE_LABELS } from "@/lib/user-roles";

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
  const org = me?.organization;

  return (
    <div className="space-y-6">
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
                    <Badge variant="outline">
                      {ROLE_LABELS[me?.role ?? "ORG_ADMIN"] ?? me?.role}
                    </Badge>
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

        <TabsContent value="users" className="mt-4">
          <TeamMembersPanel />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance & Equipment</CardTitle>
                <CardDescription>
                  Manage machine lifecycle, maintenance schedules, and warranties
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              {maintenanceFeatures.map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${f.iconBg} text-white`}
                      >
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
