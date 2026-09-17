"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BellRing,
  ClipboardList,
  Eye,
  Gavel,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useActivateSupervisedAuthority,
  useNudgeSupervisedAuthority,
  useOverrideSupervisedLicence,
  usePullUpSupervisedCase,
  useRegulatoryOversightSummary,
  useSupervisedOversightCases,
  useSupervisedOversightLicences,
  useSupervisedPendingLicences,
} from "@/hooks/regulatory-oversight";
import type { OversightLicenceOverrideAction } from "@/services/regulatory-oversight.service";
import { cn } from "@/lib/utils";

export function OversightDashboard() {
  const { data, isLoading } = useRegulatoryOversightSummary(true);
  const [filterAuthorityId, setFilterAuthorityId] = useState<number | "all">(
    "all",
  );
  const canSupervise = !!data?.canSupervise;
  const supervised = useSupervisedOversightCases(
    canSupervise,
    filterAuthorityId === "all" ? undefined : filterAuthorityId,
  );
  const licences = useSupervisedOversightLicences(canSupervise);
  const pendingLicences = useSupervisedPendingLicences(canSupervise);
  const nudge = useNudgeSupervisedAuthority();
  const activate = useActivateSupervisedAuthority();
  const pullUp = usePullUpSupervisedCase();
  const overrideLicence = useOverrideSupervisedLicence();

  const [pullReason, setPullReason] = useState<Record<number, string>>({});
  const [overrideReason, setOverrideReason] = useState<Record<number, string>>(
    {},
  );

  const superviseAuthorities = useMemo(
    () => (data?.authorities ?? []).filter((row) => row.mode === "SUPERVISE"),
    [data?.authorities],
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading oversight…
      </div>
    );
  }
  if (!data) return null;

  const overdueReferrals = data.authorities.reduce(
    (total, row) => total + row.overdueReferrals,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Eye className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Regulatory oversight
          </h1>
          <p className="text-sm text-muted-foreground">
            {canSupervise
              ? "Supervise subordinate authorities: follow queues, pull cases up, override licences, and activate staged desks."
              : "Aggregate system health. Ask a platform admin for Supervise scope to manage subordinate authorities."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Pending referrals" value={data.referrals.pending} />
        <Stat label="Referral responses overdue" value={overdueReferrals} />
        <Stat label="Accepted referrals" value={data.referrals.accepted} />
        <Stat label="Declined referrals" value={data.referrals.declined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authorities in scope</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {data.authorities.map((row) => (
            <div
              key={row.authority.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.authority.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold",
                      row.mode === "SUPERVISE"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.mode === "SUPERVISE" ? "Supervise" : "Observe"}
                  </Badge>
                  {row.authority.isActive === false ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-800"
                    >
                      Pending activation
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.authority.code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{row.open} open</Badge>
                {row.overdue > 0 && (
                  <Badge variant="destructive">{row.overdue} overdue</Badge>
                )}
                {row.overdueReferrals > 0 && (
                  <Badge variant="destructive">
                    {row.overdueReferrals} referral responses overdue
                  </Badge>
                )}
                <Badge variant="outline">{row.unassigned} unassigned</Badge>
                <Badge variant="outline">{row.resolved} resolved</Badge>
                {row.mode === "SUPERVISE" && row.authority.isActive === false ? (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={activate.isPending}
                    onClick={() => activate.mutate(row.authority.id)}
                  >
                    <ShieldCheck className="size-3.5" />
                    Authorize desk
                  </Button>
                ) : null}
                {row.mode === "SUPERVISE" && row.authority.isActive !== false ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={nudge.isPending}
                    onClick={() =>
                      nudge.mutate({
                        authorityId: row.authority.id,
                        note: "Please review open and overdue cases on your desk.",
                      })
                    }
                  >
                    <BellRing className="size-3.5" />
                    Follow up
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {canSupervise ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-4 text-muted-foreground" />
              Supervised open queue
            </CardTitle>
            <select
              aria-label="Filter supervised authority"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={
                filterAuthorityId === "all" ? "all" : String(filterAuthorityId)
              }
              onChange={(event) =>
                setFilterAuthorityId(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
            >
              <option value="all">All supervised</option>
              {superviseAuthorities.map((row) => (
                <option key={row.authority.id} value={row.authority.id}>
                  {row.authority.name}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="p-0">
            {supervised.isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading cases…</p>
            ) : (supervised.data?.length ?? 0) === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No open cases on supervised desks.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {supervised.data?.map((caseRow) => (
                  <div
                    key={caseRow.id}
                    className="space-y-2 px-5 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{caseRow.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {caseRow.caseNumber ?? `Case #${caseRow.id}`} ·{" "}
                          {caseRow.organization.name}
                          {caseRow.leadAuthority
                            ? ` · ${caseRow.leadAuthority.name}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">{caseRow.status}</Badge>
                        <Badge variant="outline">{caseRow.priority}</Badge>
                        {caseRow.overdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : null}
                        {caseRow.assignedTo ? (
                          <Badge variant="outline">
                            {caseRow.assignedTo.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={pullReason[caseRow.id] ?? ""}
                        onChange={(e) =>
                          setPullReason((prev) => ({
                            ...prev,
                            [caseRow.id]: e.target.value,
                          }))
                        }
                        placeholder="Reason to pull onto your desk…"
                        className="h-9"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                        disabled={
                          pullUp.isPending ||
                          (pullReason[caseRow.id] ?? "").trim().length < 3
                        }
                        onClick={() =>
                          pullUp.mutate(
                            {
                              caseId: caseRow.id,
                              reason: (pullReason[caseRow.id] ?? "").trim(),
                            },
                            {
                              onSuccess: () =>
                                setPullReason((prev) => {
                                  const next = { ...prev };
                                  delete next[caseRow.id];
                                  return next;
                                }),
                            },
                          )
                        }
                      >
                        <Upload className="size-3.5" />
                        Pull up
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {canSupervise ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-muted-foreground" />
              Pending applications in supervised mandates
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/dashboard/regulator?tab=licences">
                Open decide queue
                <ArrowRightLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {pendingLicences.isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">
                Loading pending applications…
              </p>
            ) : (pendingLicences.data?.length ?? 0) === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No submitted applications match supervised authority mandates.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {pendingLicences.data?.map((license) => (
                  <div
                    key={license.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">
                        {license.licenseNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {license.organization.name}
                        {license.organization.industrySector
                          ? ` · ${license.organization.industrySector}`
                          : " · sector unset"}
                        {license.category
                          ? ` · ${license.category.name}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{license.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {canSupervise ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="size-4 text-muted-foreground" />
              Licences issued by supervised authorities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {licences.isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">
                Loading licences…
              </p>
            ) : (licences.data?.length ?? 0) === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No active or suspended licences from supervised desks yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {licences.data?.map((license) => (
                  <div key={license.id} className="space-y-2 px-5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium">
                          {license.licenseNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {license.organization.name}
                          {license.issuedBy
                            ? ` · issued by ${license.issuedBy.name}`
                            : ""}
                          {license.category
                            ? ` · ${license.category.name}`
                            : ""}
                        </p>
                      </div>
                      <Badge variant="outline">{license.status}</Badge>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={overrideReason[license.id] ?? ""}
                        onChange={(e) =>
                          setOverrideReason((prev) => ({
                            ...prev,
                            [license.id]: e.target.value,
                          }))
                        }
                        placeholder="Oversight reason…"
                        className="h-9"
                      />
                      {(
                        [
                          ["SUSPEND", "Suspend"],
                          ["REVOKE", "Revoke"],
                          ["REINSTATE", "Reinstate"],
                        ] as Array<[OversightLicenceOverrideAction, string]>
                      ).map(([action, label]) => (
                        <Button
                          key={action}
                          size="sm"
                          variant={action === "REVOKE" ? "destructive" : "outline"}
                          className="shrink-0"
                          disabled={
                            overrideLicence.isPending ||
                            (overrideReason[license.id] ?? "").trim().length < 3
                          }
                          onClick={() =>
                            overrideLicence.mutate(
                              {
                                licenseId: license.id,
                                action,
                                reason: (overrideReason[license.id] ?? "").trim(),
                              },
                              {
                                onSuccess: () =>
                                  setOverrideReason((prev) => {
                                    const next = { ...prev };
                                    delete next[license.id];
                                    return next;
                                  }),
                              },
                            )
                          }
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
