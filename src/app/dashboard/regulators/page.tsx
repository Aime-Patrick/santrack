"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, ShieldPlus, MoreHorizontal, CheckCircle2, RefreshCw, Copy, Check, Eye, EyeOff, Users, AlertCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  organizationKeys,
  useRegulators,
  useOrganizations,
  useGrantStanding,
  useRevokeStanding,
} from "@/hooks/organizations";
import { useUsers, useCreateUser, useResendOrgAdminInvite } from "@/hooks/users";
import { TRADE_TYPES, type RegulatorResponse } from "@/services/organization.service";
import { getApiErrorMessage, type OrganizationType, type UserRole } from "@/lib/api";
import { toast } from "sonner";
import { useOnboardAuthorityFull, useRegulatoryAuthorities } from "@/hooks/regulatory-authorities";
import { generatePassword } from "@/lib/generate-password";

/**
 * Regulator management, for the platform operator.
 *
 * This page used to render the unfiltered organization directory — every
 * manufacturer, warehouse and shop on the platform — under a regulator
 * heading, "and its grant and revoke calls sent no body", so both were rejected.
 * It now works from the regulator roster, and each action does what its label
 * says.
 *
 * Standing is the organization's type, which is why withdrawing it asks what
 * the body becomes rather than guessing.
 */

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
};

/**
 * Roles a regulator's staff can hold. There is no REGULATOR role — authority
 * comes from the organization's standing, and the role decides what that
 * person does inside it.
 */
const STAFF_ROLES: UserRole[] = ["ORG_ADMIN", "AUDITOR", "MANAGEMENT"];

export default function RegulatorsPage() {
  const { data: regulators, isLoading } = useRegulators();
  const { data: authorities = [] } = useRegulatoryAuthorities();
  const onboardAuthorityFull = useOnboardAuthorityFull();
  const { data: businesses } = useOrganizations(TRADE_TYPES);

  const grantStanding = useGrantStanding();
  const revokeStanding = useRevokeStanding();
  const resendAdminInvite = useResendOrgAdminInvite();

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardFor, setOnboardFor] = useState<RegulatorResponse | null>(null);
  const [onboardSuccess, setOnboardSuccess] = useState<{ orgName: string; code: string; email: string; password?: string; alreadyExisted?: boolean } | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeFor, setRevokeFor] = useState<RegulatorResponse | null>(null);

  const rows = regulators ?? [];
  const staffed = rows.filter((r) => r.staff > 0).length;

  const authoritiesByOrganization = new Map(authorities.filter((authority) => authority.operatingOrganization).map((authority) => [authority.operatingOrganization!.id, authority]));
  const columns: ColumnDef<TableFeatures, RegulatorResponse>[] = useMemo(
    () => [
      {
        id: "workspace",
        header: "Authority workspace",
        cell: ({ row }) => {
          const authority = authoritiesByOrganization.get(row.original.id);
          return authority ? <Badge variant={authority.isActive ? "success" : "outline"}>{authority.isActive ? `Active · ${authority.code}` : "Inactive"}</Badge> : <Badge variant="warning">Not onboarded</Badge>;
        },
      },
      {
        accessorKey: "name",
        header: "Authority",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success text-white">
              <Shield className="size-4" />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="font-mono text-xs text-faint">ORG-{row.original.id}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "staff",
        header: "Staff",
        cell: ({ row }) =>
          row.original.staff > 0 ? (
            <span className="tabular-nums">{row.original.staff}</span>
          ) : (
            <Badge variant="warning">
              No one assigned
            </Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Registered",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const authority = authoritiesByOrganization.get(row.original.id);
          const needsOnboarding = !authority || row.original.staff === 0;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {needsOnboarding && (
                  <DropdownMenuItem onClick={() => setOnboardFor(row.original)}>
                    <ShieldPlus className="mr-2 size-4" /> Complete onboarding
                  </DropdownMenuItem>
                )}
                {row.original.staff > 0 && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const res = await resendAdminInvite.mutateAsync(row.original.id);
                        if (res.temporaryPassword) {
                          setOnboardSuccess({
                            orgName: row.original.name,
                            code: authoritiesByOrganization.get(row.original.id)?.code ?? `ORG-${row.original.id}`,
                            email: res.email ?? "Admin",
                            password: res.temporaryPassword,
                            alreadyExisted: false,
                          });
                        }
                        toast.success(`Invite & login instructions resent to ${row.original.name}`);
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, "Failed to resend invite"));
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 size-4" /> Resend login email
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setRevokeFor(row.original)}>
                  <ShieldOff className="mr-2 size-4" /> Withdraw standing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [authoritiesByOrganization, resendAdminInvite],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 lg:size-10 items-center justify-center rounded-lg bg-success text-white">
            <Shield className="size-4 lg:size-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Authority onboarding</h1>
            <p className="text-sm text-muted-foreground">
              Create the technical workspace; each authority configures its own operations.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGrantOpen(true)}>
            <Shield className="mr-2 size-4" /> Grant standing
          </Button>
          <Button onClick={() => setOnboardOpen(true)}>
            <ShieldPlus className="mr-2 size-4" /> Onboard authority
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Regulator organizations"
          value={rows.length}
          icon={<Shield className="size-4 lg:size-5" />}
          iconBg="bg-success"
          caption="Organizations eligible for onboarding"
        />
        <MetricCard
          title="Staffed"
          value={staffed}
          icon={<Users className="size-4 lg:size-5" />}
          iconBg="bg-primary"
          caption="With at least one user"
        />
        <MetricCard
          title="Businesses"
          value={businesses?.length ?? 0}
          icon={<ShieldPlus className="size-4 lg:size-5" />}
          iconBg="bg-muted text-muted-foreground"
          caption="Eligible for standing"
        />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Authority workspaces</CardTitle>
          <CardDescription>
            Authorities work only their configured cases. Oversight visibility is separately configured and read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading regulators...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Shield className="size-8 text-faint" />
              <p className="text-sm text-muted-foreground">
                No regulator organization is registered yet. Onboard your first authority workspace.
              </p>
              <Button size="sm" onClick={() => setOnboardOpen(true)}>
                <ShieldPlus className="mr-2 size-4" /> Onboard the first authority
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              filterColumn="name"
              filterPlaceholder="Search regulators..."
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <UnifiedOnboardDialog
        open={onboardOpen || !!onboardFor}
        regulator={onboardFor}
        onOpenChange={(open) => {
          if (!open) {
            setOnboardOpen(false);
            setOnboardFor(null);
          }
        }}
        onSubmit={(input, onError) =>
          onboardAuthorityFull.mutate(input, {
            onSuccess: (data) => {
              setOnboardOpen(false);
              setOnboardFor(null);
              setOnboardSuccess({
                orgName: data.organization.name,
                code: data.authority.code,
                email: data.adminUser.email,
                password: input.adminPassword,
                alreadyExisted: data.adminUser.alreadyExisted,
              });
            },
            onError: (err) => {
              const msg = getApiErrorMessage(err, "Could not onboard this authority");
              if (onError) onError(msg);
              toast.error(msg);
            },
          })
        }
        pending={onboardAuthorityFull.isPending}
      />

      <OnboardSuccessDialog
        info={onboardSuccess}
        onOpenChange={(open) => !open && setOnboardSuccess(null)}
      />

      <GrantDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        businesses={businesses ?? []}
        onSubmit={(id, name) =>
          grantStanding.mutate({ id, name }, { onSuccess: () => setGrantOpen(false) })
        }
        pending={grantStanding.isPending}
      />

      <RevokeDialog
        regulator={revokeFor}
        onOpenChange={(open) => !open && setRevokeFor(null)}
        onSubmit={(revertTo, reason) =>
          revokeFor &&
          revokeStanding.mutate(
            { id: revokeFor.id, name: revokeFor.name, revertTo, reason },
            { onSuccess: () => setRevokeFor(null) },
          )
        }
        pending={revokeStanding.isPending}
      />

    </div>
  );
}

function UnifiedOnboardDialog({
  open,
  regulator,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  regulator: RegulatorResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    input: {
      name: string;
      code: string;
      operatingOrganizationId?: number;
      adminFullName?: string;
      adminEmail?: string;
      adminPassword?: string;
    },
    onError?: (message: string) => void,
  ) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasExistingStaff = !!regulator && regulator.staff > 0;

  useEffect(() => {
    if (regulator) {
      setName(regulator.name);
      setCode(regulator.name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8));
    } else {
      setName("");
      setCode("");
    }
    setAdminEmail("");
    setAdminPassword(hasExistingStaff ? "" : generatePassword());
    setShowPassword(true);
    setError(null);
  }, [regulator, open, hasExistingStaff]);

  const canSubmit = hasExistingStaff
    ? name.trim().length >= 2 && /^[A-Z0-9_]{2,32}$/.test(code)
    : name.trim().length >= 2 &&
      /^[A-Z0-9_]{2,32}$/.test(code) &&
      adminEmail.trim().includes("@") &&
      adminPassword.length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {regulator ? `Complete onboarding · ${regulator.name}` : "Onboard authority"}
          </DialogTitle>
          <DialogDescription>
            {hasExistingStaff
              ? "Set the authority identifier to activate regulatory standing."
              : "Set up the authority workspace and first administrator login."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-muted p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {hasExistingStaff && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3.5 py-2.5 text-xs text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span>Staff account ({regulator.staff} {regulator.staff === 1 ? "user" : "users"}) already assigned.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Authority name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                disabled={!!regulator}
                placeholder="Authority name"
                autoFocus={!regulator}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-code">Authority code</Label>
              <Input
                id="auth-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g. RSB, FDA"
                className="font-mono font-medium uppercase tracking-wider"
                autoFocus={!!regulator}
              />
            </div>
          </div>

          {!hasExistingStaff && (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email">Admin email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="admin@authority.gov.rw"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password">Generated password</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        id="admin-password"
                        readOnly
                        type={showPassword ? "text" : "password"}
                        value={adminPassword}
                        className="bg-background pr-8 font-mono text-sm"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      title="Regenerate"
                      onClick={() => setAdminPassword(generatePassword())}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                    <CopyButton text={adminPassword} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || pending}
            onClick={() => {
              setError(null);
              onSubmit(
                {
                  name: name.trim(),
                  code: code.trim(),
                  operatingOrganizationId: regulator?.id,
                  adminEmail: hasExistingStaff ? undefined : adminEmail.trim(),
                  adminPassword: hasExistingStaff ? undefined : adminPassword,
                },
                (errMessage) => setError(errMessage),
              );
            }}
          >
            {pending
              ? "Saving…"
              : hasExistingStaff
                ? "Complete onboarding"
                : "Onboard authority"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

/** Tiny copy-to-clipboard button with a brief checkmark feedback. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0"
      title="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

function OnboardSuccessDialog({
  info,
  onOpenChange,
}: {
  info: { orgName: string; code: string; email: string; password?: string; alreadyExisted?: boolean } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <Dialog open={!!info} onOpenChange={onOpenChange}>
      <DialogPopup className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" /> Authority onboarded
          </DialogTitle>
          <DialogDescription>
            Workspace is ready.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authority</span>
              <span className="font-medium">{info?.orgName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-mono font-medium">{info?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin Login</span>
              <span className="font-medium">{info?.email}</span>
            </div>
            {info?.alreadyExisted ? (
              <div className="rounded-md border border-border bg-card p-2 text-xs text-muted-foreground">
                Existing login remains active.
              </div>
            ) : info?.password ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Password</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-medium">
                    {showPw ? info.password : "••••••••••••"}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? <span className="text-xs">hide</span> : <span className="text-xs">show</span>}
                  </button>
                  <CopyButton text={info.password} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ------------------------------------------------------------------- grant

function GrantDialog({
  open,
  onOpenChange,
  businesses,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businesses: { id: number; name: string; type: OrganizationType }[];
  onSubmit: (id: number, name: string) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = useState("");
  const chosen = businesses.find((b) => String(b.id) === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grant regulatory standing</DialogTitle>
          <DialogDescription>
            Promotes an existing business to an oversight body with platform-wide chain of custody visibility.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Organization</Label>
          <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a business">
                {chosen ? () => `${chosen.name} — ${TYPE_LABELS[chosen.type] ?? chosen.type}` : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name} — {TYPE_LABELS[b.type] ?? b.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {businesses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No businesses are registered yet.
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!chosen || pending}
            onClick={() => chosen && onSubmit(chosen.id, chosen.name)}
          >
            {pending ? "Granting..." : "Grant standing"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ------------------------------------------------------------------ revoke

function RevokeDialog({
  regulator,
  onOpenChange,
  onSubmit,
  pending,
}: {
  regulator: RegulatorResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (revertTo: OrganizationType, reason: string) => void;
  pending: boolean;
}) {
  const [revertTo, setRevertTo] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={!!regulator} onOpenChange={onOpenChange}>
      <DialogPopup className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Withdraw standing from {regulator?.name}</DialogTitle>
          <DialogDescription>
            Select the replacement organization type. The entity keeps its staff and audit history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>New organization type</Label>
            <Select value={revertTo} onValueChange={(v) => setRevertTo(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a business type">
                  {revertTo ? () => TYPE_LABELS[revertTo] ?? revertTo : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TRADE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TYPE_LABELS[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="revoke-reason">Reason</Label>
            <Input
              id="revoke-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mandate ended"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!revertTo || reason.trim().length === 0 || pending}
            onClick={() => onSubmit(revertTo as OrganizationType, reason.trim())}
          >
            {pending ? "Withdrawing..." : "Withdraw standing"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

