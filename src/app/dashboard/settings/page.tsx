"use client";

import Link from "next/link";
import {
  Building2,
  UserCog,
  Wrench,
  Settings as SettingsIcon,
  AlertTriangle,
  Cog,
  Shield,
  Users,
  FileBadge,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/auth";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { ROLE_LABELS } from "@/lib/user-roles";
import { AuthoritySelfSetup } from "@/components/regulator/authority-self-setup";
import { OversightScopeSettings } from "@/components/dashboard/oversight-scope-settings";

const maintenanceFeatures = [
  {
    icon: <Cog className="size-5 text-white" />,
    iconBg: "bg-primary",
    title: "Machine Management",
    description:
      "Track machine status, register new machines, and monitor active equipment.",
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
    description:
      "Manage product warranties, track activation dates, and process claims.",
    status: "planned" as const,
  },
];

const maintenanceStatus = {
  available: {
    label: "Available",
    color: "border-transparent bg-success text-white",
  },
  planned: {
    label: "Planned",
    color: "border-transparent bg-muted-foreground text-white",
  },
};

const platformLinks = [
  {
    href: "/dashboard/industries",
    title: "Industries",
    description: "Business register and licence standing",
    icon: Building2,
  },
  {
    href: "/dashboard/regulators",
    title: "Regulators",
    description: "Grant or withdraw regulatory standing",
    icon: FileBadge,
  },
  {
    href: "/dashboard/users",
    title: "Users",
    description: "Accounts across every organization",
    icon: Users,
  },
  {
    href: "/dashboard/audit",
    title: "Audit logs",
    description: "Digital footprint across the platform",
    icon: ClipboardList,
  },
];

function PlatformSettings({
  me,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Shield className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platform settings</h1>
          <p className="text-sm text-muted-foreground">
            SAN TECH operator account and platform controls — not an organization
            profile.
          </p>
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <Shield className="mr-1.5 size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Cog className="mr-1.5 size-4" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="mr-1.5 size-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Operator account</CardTitle>
              <CardDescription>
                Your platform identity. You are not attached to a trading
                organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Full name
                  </p>
                  <p className="font-medium">{me.fullName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="font-mono text-sm">{me.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Role
                  </p>
                  <Badge variant="outline">
                    {ROLE_LABELS[me.role] ?? me.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    User ID
                  </p>
                  <p className="font-mono text-sm text-faint">{me.id}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Organization
                  </p>
                  <p className="text-sm text-muted-foreground">
                    None — platform operator. Use Industries and Regulators to
                    manage businesses and authorities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="mt-4">
          <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
            {platformLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <link.icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary">
                        {link.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div><OversightScopeSettings /></div>
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Create and manage accounts across organizations.
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/users" />}
            >
              Open users
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </div>
          <TeamMembersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrganizationSettings({
  me,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
}) {
  const org = me.organization;
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const initialTab =
    searchParams?.get("tab") === "maintenance" ||
    searchParams?.get("tab") === "users"
      ? (searchParams.get("tab") as string)
      : "organization";

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

      <Tabs defaultValue={initialTab}>
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
          {org?.type === "REGULATOR" && me.role === "ORG_ADMIN" ? <div className="mb-4"><AuthoritySelfSetup /></div> : null}
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Your business identity on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {org ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="font-medium">{org.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Type
                    </p>
                    <Badge variant="outline">{org.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Your Role
                    </p>
                    <Badge variant="outline">
                      {ROLE_LABELS[me.role] ?? me.role}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      User ID
                    </p>
                    <p className="font-mono text-sm text-faint">{me.id}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No organization linked.
                </p>
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
                  Manage machine lifecycle, "maintenance schedules", and warranties
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
                      <Badge
                        variant="outline"
                        className={maintenanceStatus[f.status].color}
                      >
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

export default function SettingsPage() {
  const { data: me, isLoading } = useMe();

  if (isLoading || !me) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  if (me.role === "SYSTEM_ADMIN" && !me.organization) {
    return <PlatformSettings me={me} />;
  }

  return <OrganizationSettings me={me} />;
}
