"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, ShieldPlus, MoreHorizontal, Users, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  useRegisterRegulator,
  useGrantStanding,
  useRevokeStanding,
} from "@/hooks/organizations";
import { useUsers, useCreateUser } from "@/hooks/users";
import { TRADE_TYPES, type RegulatorResponse } from "@/services/organization.service";
import type { OrganizationType, UserRole } from "@/lib/api";
import { toast } from "sonner";

/**
 * Regulator management, for the platform operator.
 *
 * This page used to render the unfiltered organization directory — every
 * manufacturer, warehouse and shop on the platform — under a regulator
 * heading, and its grant and revoke calls sent no body, so both were rejected.
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
  const { data: businesses } = useOrganizations(TRADE_TYPES);

  const registerRegulator = useRegisterRegulator();
  const grantStanding = useGrantStanding();
  const revokeStanding = useRevokeStanding();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [staffFor, setStaffFor] = useState<RegulatorResponse | null>(null);
  const [revokeFor, setRevokeFor] = useState<RegulatorResponse | null>(null);

  const rows = regulators ?? [];
  const staffed = rows.filter((r) => r.staff > 0).length;

  const columns: ColumnDef<TableFeatures, RegulatorResponse>[] = useMemo(
    () => [
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
            // An authority nobody works at reviews nothing, and that is worth
            // seeing at a glance rather than counting to zero.
            <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
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
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStaffFor(row.original)}>
                <Users className="mr-2 size-4" /> Manage staff
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRevokeFor(row.original)}>
                <ShieldOff className="mr-2 size-4" /> Withdraw standing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <Shield className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regulators</h1>
            <p className="text-sm text-muted-foreground">
              Register oversight bodies, staff them, and withdraw standing.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGrantOpen(true)}>
            <ShieldPlus className="mr-2 size-4" /> Grant standing
          </Button>
          <Button onClick={() => setRegisterOpen(true)}>
            <Shield className="mr-2 size-4" /> Register regulator
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Regulators"
          value={rows.length}
          icon={<Shield className="size-4" />}
          iconBg="bg-success"
          caption="Bodies holding standing"
        />
        <MetricCard
          title="Staffed"
          value={staffed}
          icon={<Users className="size-4" />}
          iconBg="bg-primary"
          caption="With at least one user"
        />
        <MetricCard
          title="Businesses"
          value={businesses?.length ?? 0}
          icon={<ShieldPlus className="size-4" />}
          iconBg="bg-muted text-muted-foreground"
          caption="Eligible for standing"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oversight bodies</CardTitle>
          <CardDescription>
            A regulator reads every timeline on the platform and can recall any batch.
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
                No regulator is registered yet. Nothing on the platform is being overseen.
              </p>
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                Register the first one
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

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={(name) =>
          registerRegulator.mutate(name, { onSuccess: () => setRegisterOpen(false) })
        }
        pending={registerRegulator.isPending}
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

      <StaffDialog regulator={staffFor} onOpenChange={(open) => !open && setStaffFor(null)} />
    </div>
  );
}

// ---------------------------------------------------------------- register

function RegisterDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Register a regulator</DialogTitle>
          <DialogDescription>
            Creates the authority as its own organization. You are not added to it — staff are
            assigned afterwards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="regulator-name">Name of the authority</Label>
          <Input
            id="regulator-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rwanda Standards Board"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={name.trim().length < 2 || pending}
            onClick={() => onSubmit(name.trim())}
          >
            {pending ? "Registering..." : "Register"}
          </Button>
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
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Grant regulatory standing</DialogTitle>
          <DialogDescription>
            Promotes an existing business to an oversight body. It will be able to read every
            organization&apos;s chain of custody and recall any batch.
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
        <DialogFooter>
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
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Withdraw standing from {regulator?.name}</DialogTitle>
          <DialogDescription>
            Standing is the organization&apos;s type, so something has to replace it. Say what
            this body becomes — it keeps its record and its staff either way.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>It becomes a</Label>
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
        <DialogFooter>
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

// ------------------------------------------------------------------- staff

function StaffDialog({
  regulator,
  onOpenChange,
}: {
  regulator: RegulatorResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: staff, isLoading } = useUsers(regulator?.id);
  const createUser = useCreateUser();
  const qc = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("AUDITOR");

  const reset = () => {
    setAdding(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("AUDITOR");
  };

  const submit = () => {
    if (!regulator) return;
    createUser.mutate(
      {
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
        organizationId: regulator.id,
        role: role as UserRole,
        generatePassword: false,
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: organizationKeys.regulators });
          toast.success(`${fullName.trim() || email.trim()} added to ${regulator.name}`);
          reset();
        },
        onError: (error: unknown) => {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Could not add that person";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Dialog
      open={!!regulator}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{regulator?.name} staff</DialogTitle>
          <DialogDescription>
            Authority comes from the organization&apos;s standing; the role decides what each
            person does inside it.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading staff...</p>
          ) : (staff?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody works here yet, so nothing gets reviewed. Add the first inspector.
            </p>
          ) : (
            staff?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{user.fullName}</div>
                  <div className="font-mono text-xs text-faint">{user.email}</div>
                </div>
                <Badge variant="outline">{user.role.replace(/_/g, " ")}</Badge>
              </div>
            ))
          )}
        </div>

        {adding ? (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full name (optional)</Label>
                <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-password">Temporary password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v ?? "AUDITOR")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {adding ? (
            <>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                disabled={
                  email.trim().length === 0 ||
                  password.length < 8 ||
                  createUser.isPending
                }
                onClick={submit}
              >
                {createUser.isPending ? "Adding..." : "Add to regulator"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setAdding(true)}>
                <UserPlus className="mr-2 size-4" /> Add staff
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
