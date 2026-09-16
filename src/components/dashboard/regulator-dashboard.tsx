"use client";

import Link from "next/link";
import {
  Building2,
  FileBadge,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/stat-card";
import { RegulatorCharts } from "@/components/dashboard/regulator-charts";
import { useComplianceFindings, useRegulatorQueue } from "@/hooks/licensing";
import { useRegulatoryCommand } from "@/hooks/regulatory-command";
import { useCurrentUser } from "@/hooks/use-current-user";
import { RecentActivities } from "@/components/dashboard/recent-activities";

/**
 * Home screen for a licensing authority (REGULATOR organization).
 * Supervises industries and decides licence applications — not a factory floor.
 */
export function RegulatorDashboard() {
  const { data: me } = useCurrentUser();
  const { data: command, isLoading: commandLoading } = useRegulatoryCommand();
  const { data: findings } = useComplianceFindings();
  const { data: queue, isLoading: queueLoading } = useRegulatorQueue();

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
          title="Supervised"
          value={commandLoading ? "—" : (command?.supervisedBusinesses ?? 0)}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Businesses licensed by us"
          href="/dashboard/industries?scope=licensed_by_us"
        />
        <MetricCard
          title="Licence queue"
          value={queueLoading ? "—" : pending}
          icon={<FileBadge className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Awaiting review"
          href="/dashboard/regulator"
        />
        <MetricCard
          title="Compliance findings"
          value={findingCount}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-danger"
          caption="Recent industry signals"
          href="/dashboard/compliance/findings"
        />
        <MetricCard
          title="Trace"
          value="Open"
          icon={<Clock className="size-4" />}
          iconBg="bg-success"
          caption="Investigate any identity"
          href="/dashboard/manufacturing/trace"
        />
      </div>

      <RegulatorCharts
        command={command}
        queue={queue}
        findings={findings?.findings}
        loading={commandLoading || queueLoading}
      />

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

      <RecentActivities />
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
