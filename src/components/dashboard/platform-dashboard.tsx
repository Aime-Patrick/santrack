"use client";

import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Shield,
  Users,
  FileBadge,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/stat-card";
import { PlatformActivityChart } from "@/components/dashboard/platform-activity-chart";
import { useIndustryRegistry, useRegulators } from "@/hooks/organizations";
import { useUsers } from "@/hooks/users";
import { useAuditLog } from "@/hooks/audit";
import { useComplianceFindings } from "@/hooks/licensing";
import { cn } from "@/lib/utils";

const TOP_RECENT = 6;

function statusSolid(code: number) {
  if (code >= 200 && code < 300) {
    return "border-transparent bg-success text-white";
  }
  if (code >= 400 && code < 500) {
    return "border-transparent bg-warning-foreground text-white";
  }
  if (code >= 500) {
    return "border-transparent bg-danger text-white";
  }
  return "border-transparent bg-muted text-foreground";
}

/**
 * Home screen for the platform operator (SYSTEM_ADMIN).
 * No organization context — counts and shortcuts across the whole platform.
 */
export function PlatformDashboard() {
  const { data: registry, isLoading: registryLoading } = useIndustryRegistry();
  const { data: regulators, isLoading: regulatorsLoading } = useRegulators();
  const { data: users, isLoading: usersLoading } = useUsers(undefined);
  const { data: audit, isLoading: auditLoading } = useAuditLog(200);
  const { data: findings } = useComplianceFindings();

  const industries = registry ?? [];
  const tradeOrgs = industries.filter((o) => o.type !== "REGULATOR");
  const loading = registryLoading || regulatorsLoading || usersLoading;

  const entries = audit?.entries ?? [];
  const recent = entries.slice(0, TOP_RECENT);
  const findingCount = findings?.findings?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Shield className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platform dashboard</h1>
          <p className="text-sm text-muted-foreground">
            SAN TECH overview — every organization, authority, and digital
            footprint.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Industries"
          value={loading ? "—" : tradeOrgs.length}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Registered businesses"
        />
        <MetricCard
          title="Regulators"
          value={loading ? "—" : (regulators ?? []).length}
          icon={<FileBadge className="size-4" />}
          iconBg="bg-success"
          caption="Licensing authorities"
        />
        <MetricCard
          title="Users"
          value={loading ? "—" : (users ?? []).length}
          icon={<Users className="size-4" />}
          iconBg="bg-primary"
          caption="Accounts on the platform"
        />
        <MetricCard
          title="Compliance findings"
          value={findingCount}
          icon={<Activity className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Recent industry signals"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink
          href="/dashboard/industries"
          title="Industries"
          description="Full business register and licence standing"
        />
        <QuickLink
          href="/dashboard/regulators"
          title="Regulators"
          description="Grant or withdraw regulatory standing"
        />
        <QuickLink
          href="/dashboard/audit"
          title="Audit logs"
          description="Digital footprint across every organization"
        />
        <QuickLink
          href="/dashboard/compliance/findings"
          title="Industry compliance"
          description="Findings across all businesses"
        />
        <QuickLink
          href="/dashboard/manufacturing/trace"
          title="Trace"
          description="Investigate any product identity"
        />
        <QuickLink
          href="/dashboard/users"
          title="Users"
          description="Accounts across organizations"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PlatformActivityChart entries={entries} isLoading={auditLoading} />
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full border border-border/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>Top {TOP_RECENT} latest writes</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/audit" />}
              >
                All
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No audit entries yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/dashboard/audit/${entry.id}`}
                        className="flex items-start justify-between gap-2 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {entry.actor}
                            {entry.organizationName ? (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {entry.organizationName}
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate font-mono text-xs text-faint">
                            {entry.method} {entry.path}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(entry.performedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 font-mono text-xs",
                            statusSolid(entry.statusCode),
                          )}
                        >
                          {entry.statusCode}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground group-hover:text-primary">
            {title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <ClipboardList className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}
