"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileBadge,
  User,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useComplianceFinding } from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/user-roles";

const typeLabel: Record<string, string> = {
  UNLICENSED_ACTIVITY: "Unlicensed activity",
  EXPIRED_LICENCE: "Expired licence",
  SUSPENDED_LICENCE: "Suspended licence",
};

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm"}>
        {children ?? <span className="text-faint">—</span>}
      </div>
    </div>
  );
}

export default function FindingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, isError, error } = useComplianceFinding(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/compliance/findings" />}
        >
          <ArrowLeft className="size-3.5" />
          Back to findings
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {getApiErrorMessage(error) ||
              "This finding could not be loaded."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const when = new Date(data.recordedAt);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/compliance/findings" />}
        >
          <ArrowLeft className="size-3.5" />
          Back to findings
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Finding #{data.id}
              </h1>
              <p className="text-sm text-muted-foreground">
                Full compliance record — nothing truncated.
              </p>
            </div>
          </div>
          <Badge variant="warning">
            {typeLabel[data.type] ?? data.type}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What was recorded</CardTitle>
          <CardDescription>
            Append-only signal from licence enforcement (
            {data.enforcement})
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Recorded at">
            {when.toLocaleString(undefined, {
              dateStyle: "full",
              timeStyle: "medium",
            })}
          </Field>
          <Field label="Finding type">
            {typeLabel[data.type] ?? data.type}
          </Field>
          <Field label="Activity">{data.activity ?? "—"}</Field>
          <Field label="Action" mono>
            {data.action}
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Detail">
              {data.detail ? (
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                  {data.detail}
                </p>
              ) : (
                <span className="text-faint">No detail recorded</span>
              )}
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.organization ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name">{data.organization.name}</Field>
                <Field label="Type">
                  <Badge variant="outline">{data.organization.type}</Badge>
                </Field>
                <Field label="Organization id" mono>
                  {data.organization.id}
                </Field>
                <Field label="TIN" mono>
                  {data.organization.tin}
                </Field>
                <Field label="Registration number" mono>
                  {data.organization.registrationNumber}
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileBadge className="size-4" />
              Licence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.license ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Licence number" mono>
                  {data.license.licenseNumber}
                </Field>
                <Field label="Status">
                  <Badge variant="outline">{data.license.status}</Badge>
                </Field>
                <Field label="Expires">
                  {data.license.expiresOn
                    ? new Date(data.license.expiresOn).toLocaleDateString()
                    : "—"}
                </Field>
                <Field label="Licence id" mono>
                  {data.license.id}
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No licence attached — typically unlicensed activity.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Actor at the time
          </CardTitle>
          <CardDescription>
            Who triggered the write that raised this finding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.actor ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Name">
                {data.actor.fullName ?? data.actor.email}
              </Field>
              <Field label="Email" mono>
                {data.actor.email}
              </Field>
              <Field label="Role">
                <Badge variant="outline">
                  {ROLE_LABELS[data.actor.role as keyof typeof ROLE_LABELS] ??
                    data.actor.role}
                </Badge>
              </Field>
              <Field label="User id" mono>
                {data.actor.id}
              </Field>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No actor was attached to this finding.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
