"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  User,
  Globe,
  Clock,
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
import { useAuditEntry } from "@/hooks/audit";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/user-roles";

const methodColors: Record<string, string> = {
  POST: "border-transparent bg-success text-white",
  PATCH: "border-transparent bg-primary text-white",
  PUT: "border-transparent bg-primary text-white",
  DELETE: "border-transparent bg-danger text-white",
};

function statusSurface(code: number) {
  if (code >= 200 && code < 300)
    return {
      className: "border-transparent bg-success text-white",
      icon: <CheckCircle className="size-3.5" />,
      label: "Success",
    };
  if (code >= 400 && code < 500)
    return {
      className: "border-transparent bg-warning-foreground text-white",
      icon: <AlertTriangle className="size-3.5" />,
      label: "Client error",
    };
  if (code >= 500)
    return {
      className: "border-transparent bg-danger text-white",
      icon: <XCircle className="size-3.5" />,
      label: "Server error",
    };
  return {
    className: "border-transparent bg-muted-foreground text-white",
    icon: null,
    label: "Response",
  };
}

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

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, isError, error } = useAuditEntry(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" render={<Link href="/dashboard/audit" />}>
          <ArrowLeft className="size-3.5" />
          Back to audit
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {getApiErrorMessage(error) || "This audit entry could not be loaded."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusSurface(data.statusCode);
  const when = new Date(data.performedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/audit" />}
          >
            <ArrowLeft className="size-3.5" />
            Back to audit
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-danger text-white">
              <Shield className="size-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Audit entry #{data.id}
              </h1>
              <p className="text-sm text-muted-foreground">
                Full digital footprint for this write — every field retained on
                the platform.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              methodColors[data.method] ??
              "border-border bg-muted/60 text-muted-foreground"
            }
          >
            {data.method}
          </Badge>
          <Badge variant="outline" className={`${status.className} gap-1`}>
            {status.icon}
            {data.statusCode} · {status.label}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4" />
            Request
          </CardTitle>
          <CardDescription>
            Append-only record written when the response left the API
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Performed at">
            {when.toLocaleString(undefined, {
              dateStyle: "full",
              timeStyle: "medium",
            })}
          </Field>
          <Field label="Method">
            <Badge
              variant="outline"
              className={
                methodColors[data.method] ??
                "border-border bg-muted/60 text-muted-foreground"
              }
            >
              {data.method}
            </Badge>
          </Field>
          <Field label="Status code">
            <Badge variant="outline" className={`${status.className} gap-1`}>
              {status.icon}
              {data.statusCode}
            </Badge>
          </Field>
          <Field label="Path" mono>
            {data.path}
          </Field>
          <Field label="Remote address" mono>
            {data.remoteAddress}
          </Field>
          <Field label="Entry id" mono>
            {data.id}
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Detail / change summary">
              {data.detail ? (
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm">
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
              <User className="size-4" />
              Actor
            </CardTitle>
            <CardDescription>
              Who performed the write (account at the time of the request)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.actor ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Display name">
                  {data.actor.fullName || data.actorDisplay}
                </Field>
                <Field label="Email" mono>
                  {data.actor.email}
                </Field>
                <Field label="User id" mono>
                  {data.actor.id}
                </Field>
                <Field label="Role">
                  <Badge variant="outline">
                    {ROLE_LABELS[data.actor.role as keyof typeof ROLE_LABELS] ??
                      data.actor.role}
                  </Badge>
                </Field>
                <Field label="Must change password">
                  {data.actor.mustChangePassword ? "Yes" : "No"}
                </Field>
                <Field label="Account created">
                  {new Date(data.actor.createdAt).toLocaleString()}
                </Field>
                <Field label="Actor's organization">
                  {data.actor.organizationName ?? (
                    <span className="text-faint">None (platform account)</span>
                  )}
                </Field>
                <Field label="Actor org type">
                  {data.actor.organizationType ? (
                    <Badge variant="outline">{data.actor.organizationType}</Badge>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Actor organization id" mono>
                  {data.actor.organizationId}
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Anonymous or unauthenticated write — no actor was attached.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Organization touched
            </CardTitle>
            <CardDescription>
              Whose data this write affected (may differ from the actor&apos;s home
              org)
            </CardDescription>
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
                <Field label="Registered on platform">
                  {new Date(data.organization.createdAt).toLocaleString()}
                </Field>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
                <Globe className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Platform-scoped write</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No organization was attached — typically a platform-admin
                    action (regulators, registry, users without an org context).
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
