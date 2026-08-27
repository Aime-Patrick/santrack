"use client";

import Link from "next/link";
import {
  Building2,
  FileBadge,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useComplianceFindings, useRegulatorQueue } from "@/hooks/licensing";
import { useCurrentUser } from "@/hooks/use-current-user";
import { RecentActivities } from "@/components/dashboard/recent-activities";

/**
 * Home screen for a licensing authority (REGULATOR organization).
 * Supervises industries and decides licence applications — not a factory floor.
 */
export function RegulatorDashboard() {
  const { data: me } = useCurrentUser();
  const { data: registry, isLoading: registryLoading } = useIndustryRegistry();
  const { data: findings } = useComplianceFindings();
  const { data: queue, isLoading: queueLoading } = useRegulatorQueue();

  const industries = (registry ?? []).filter((o) => o.type !== "REGULATOR");
  const findingCount = findings?.findings?.length ?? 0;
  const pending = queue?.length ?? 0;

  const orgName = me?.organization?.name ?? "Authority";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Regulatory dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {orgName} — industry oversight, licence decisions, and compliance
            signals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Industries"
          value={registryLoading ? "—" : industries.length}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Businesses under supervision"
        />
        <MetricCard
          title="Licence queue"
          value={queueLoading ? "—" : pending}
          icon={<FileBadge className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Awaiting review"
        />
        <MetricCard
          title="Compliance findings"
          value={findingCount}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-danger"
          caption="Recent industry signals"
        />
        <MetricCard
          title="Trace"
          value="Open"
          icon={<Clock className="size-4" />}
          iconBg="bg-success"
          caption="Investigate any identity"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink
          href="/dashboard/industries"
          title="Industries"
          description="Register and standing of every business"
        />
        <QuickLink
          href="/dashboard/regulator"
          title="License Review"
          description="Decide submitted applications"
        />
        <QuickLink
          href="/dashboard/compliance/findings"
          title="Industry compliance"
          description="Findings across supervised businesses"
        />
        <QuickLink
          href="/dashboard/manufacturing/trace"
          title="Trace & Act"
          description="Follow a product identity end to end"
        />
        <QuickLink
          href="/dashboard/recall"
          title="Recalls"
          description="Active and historical recalls"
        />
        <QuickLink
          href="/dashboard/settings"
          title="Settings"
          description="Authority profile and staff"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Next decisions</CardTitle>
                <CardDescription>
                  Jump to the licence queue or findings that need attention
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/regulator" />}
              >
                Review
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Use <span className="font-medium text-foreground">License Review</span>{" "}
                to approve or refuse applications. Use{" "}
                <span className="font-medium text-foreground">Industries</span>{" "}
                for the register — not Licenses &amp; Permits (that is for
                applicants).
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <RecentActivities />
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
      <p className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
