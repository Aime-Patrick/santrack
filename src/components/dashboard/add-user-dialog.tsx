"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/users";
import { useOrganizations } from "@/hooks/organizations";
import { useMe } from "@/hooks/auth";
import type { UserRole } from "@/lib/api";
import { ROLE_LABELS, apiErrorMessage, assignableRoles } from "@/lib/user-roles";
import { toast } from "sonner";
import { generatePassword } from "@/lib/generate-password";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, "the new user is always created in this org (org admin path"). */
  lockedOrganizationId?: number;
}



export function AddUserDialog({
  open,
  onOpenChange,
  lockedOrganizationId,
}: AddUserDialogProps) {
  const { data: me } = useMe();
  const createUser = useCreateUser();
  const needsOrgPicker = !lockedOrganizationId && me?.role === "SYSTEM_ADMIN";
  const { data: organizations } = useOrganizations();

  const roles = assignableRoles(me?.role);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [autoPassword, setAutoPassword] = useState(true);
  const [showAutoPassword, setShowAutoPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("QUALITY_OFFICER");
  const [organizationId, setOrganizationId] = useState<string>(
    lockedOrganizationId ? String(lockedOrganizationId) : "",
  );
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextRole = assignableRoles(me?.role).includes("QUALITY_OFFICER")
      ? "QUALITY_OFFICER"
      : (assignableRoles(me?.role)[0] ?? "ORG_ADMIN");
    setFullName("");
    setEmail("");
    setAutoPassword(true);
    setShowAutoPassword(true);
    setPassword(generatePassword());
    setRole(nextRole);
    setOrganizationId(lockedOrganizationId ? String(lockedOrganizationId) : "");
    setCreatedSecret(null);
    setCopied(false);
  }, [open, lockedOrganizationId, me?.role]);

  const resolvedOrgId = lockedOrganizationId ?? Number(organizationId);
  const canSubmit =
    email.trim().length > 0 &&
    (autoPassword || password.length >= 8) &&
    Number.isFinite(resolvedOrgId) &&
    resolvedOrgId > 0 &&
    !createUser.isPending;

  const submit = () => {
    if (!canSubmit) return;
    createUser.mutate(
      {
        fullName: fullName.trim() || undefined,
        email: email.trim(),
        organizationId: resolvedOrgId,
        role,
        password,
        generatePassword: false,
      },
      {
        onSuccess: () => {
          toast.success(
            `${fullName.trim() || email.trim()} added as ${ROLE_LABELS[role]}`,
          );
          setCreatedSecret(password);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Could not create user"));
        },
      },
    );
  };

  const copySecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    toast.success("Temporary password copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {createdSecret ? "Share temporary password" : "Add team member"}
          </DialogTitle>
          <DialogDescription>
            {createdSecret
              ? "An invite email was sent if mail is configured. Copy this password in case they need it."
              : needsOrgPicker
                ? "Creates a login on the platform. They must change the temporary password on first sign-in."
                : "Creates a login in your organization. They must change the temporary password on first sign-in."}
          </DialogDescription>
        </DialogHeader>

        {createdSecret ? (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
              <p className="text-xs text-muted-foreground">Temporary password</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-sm">{createdSecret}</code>
                <Button type="button" variant="outline" size="sm" onClick={copySecret}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="add-user-name">
                  Full name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="add-user-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-user-email">Email</Label>
                <Input
                  id="add-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={autoPassword ? "default" : "outline"}
                    onClick={() => {
                      setAutoPassword(true);
                      setPassword(generatePassword());
                    }}
                  >
                    Generate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!autoPassword ? "default" : "outline"}
                    onClick={() => setAutoPassword(false)}
                  >
                    Set myself
                  </Button>
                </div>
                {autoPassword ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        type={showAutoPassword ? "text" : "password"}
                        value={password}
                        className="font-mono text-sm bg-background pr-8"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAutoPassword(!showAutoPassword)}
                        title={showAutoPassword ? "Hide password" : "Show password"}
                      >
                        {showAutoPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      title="Regenerate"
                      onClick={() => setPassword(generatePassword())}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  They will be forced to change this password on first login.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => v && setRole(v as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role">
                      {ROLE_LABELS[role]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    className="min-w-[var(--anchor-width)] w-auto max-w-[min(100vw-2rem,28rem)]"
                  >
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsOrgPicker ? (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Select
                    value={organizationId}
                    onValueChange={(v) => setOrganizationId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select organization">
                        {(organizations ?? []).find(
                          (o) => String(o.id) === organizationId,
                        )?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      align="start"
                      className="min-w-[var(--anchor-width)] w-auto max-w-[min(100vw-2rem,28rem)]"
                    >
                      {(organizations ?? []).map((org) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={submit}>
                {createUser.isPending ? "Adding…" : "Add user"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}
