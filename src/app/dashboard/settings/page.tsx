"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Users,
  Building2,
  ArrowRight,
  FileBadge,
  ClipboardList,
  Lock,
  Loader2,
  Check,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMe, useChangePassword, useUpdateProfile, useDisableMfa, useRequestEmailChange, useCancelEmailChange } from "@/hooks/auth";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { isPasswordAllowed, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import { ROLE_LABELS } from "@/lib/user-roles";
import { AuthoritySelfSetup } from "@/components/regulator/authority-self-setup";
import { OversightScopeSettings } from "@/components/dashboard/oversight-scope-settings";
import { getApiErrorMessage } from "@/lib/api";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  AvatarEditButton,
  AvatarPickerDialog,
} from "@/components/profile/avatar-picker-dialog";

type SettingsTab =
  | "profile"
  | "general"
  | "security"
  | "organization"
  | "members"
  | "platform";

const SETTINGS_TABS = new Set<SettingsTab>([
  "profile",
  "general",
  "security",
  "organization",
  "members",
  "platform",
]);

function parseSettingsTab(value: string | null): SettingsTab | null {
  if (!value) return null;
  return SETTINGS_TABS.has(value as SettingsTab) ? (value as SettingsTab) : null;
}

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "account" | "workspace";
  /** Only shown to specific role conditions */
  show?: (me: ReturnType<typeof useMe>["data"]) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile",      label: "My Profile",   icon: UserIcon,      group: "account" },
  { id: "general",      label: "General",       icon: SettingsIcon,  group: "account" },
  { id: "security",     label: "Security",      icon: Lock,          group: "account" },
  { id: "organization", label: "Organization",  icon: Building2,     group: "workspace",
    show: (me) => !!me?.organization },
  { id: "members",      label: "Members",       icon: Users,         group: "workspace" },
  { id: "platform",     label: "Platform",      icon: Shield,        group: "workspace",
    show: (me) => me?.role === "SYSTEM_ADMIN" && !me?.organization },
];

// ── My Profile panel ─────────────────────────────────────────────────────────

function ProfilePanel({ me }: { me: NonNullable<ReturnType<typeof useMe>["data"]> }) {
  const update = useUpdateProfile();
  const requestEmailChange = useRequestEmailChange();
  const cancelEmailChange = useCancelEmailChange();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: { fullName: me.fullName ?? "" },
  });

  // Re-sync when me data refreshes
  useEffect(() => { reset({ fullName: me.fullName ?? "" }); }, [me.fullName, reset]);

  function onSubmit(data: { fullName: string }) {
    update.mutate(
      { fullName: data.fullName.trim() },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  function onRequestEmailChange() {
    const email = newEmail.trim();
    if (!email || !emailPassword) return;
    requestEmailChange.mutate(
      { email, password: emailPassword },
      {
        onSuccess: () => {
          setNewEmail("");
          setEmailPassword("");
          toast.success(
            `Verification sent to ${email}. Your current email stays until you confirm (30 minutes).`,
          );
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  const pendingEmail = me.pendingEmail ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">My Profile</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your personal identity on the platform.
        </p>
      </div>

      <AvatarPickerDialog
        user={me}
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
      />

      {/* Avatar block */}
      <Card>
        <CardContent className="p-2">
          <div className="flex min-w-0 flex-wrap items-center gap-5">
            <div className="relative shrink-0">
              <UserAvatar
                user={me}
                className="size-16 border-2 border-primary/20"
                fallbackClassName="text-lg"
              />
              <AvatarEditButton onClick={() => setAvatarOpen(true)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{me.fullName ?? "—"}</p>
              <p className="truncate text-sm text-muted-foreground">{me.email}</p>
              <Badge variant="outline" className="mt-1.5 text-[13px]">
                {ROLE_LABELS[me.role] ?? me.role}
              </Badge>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAvatarOpen(true)}
                >
                  Change photo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal information</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                placeholder="Your full name"
                {...register("fullName", { required: "Name is required", minLength: { value: 2, message: "At least 2 characters" } })}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input value={String(me.id)} disabled className="bg-muted/40 font-mono text-xs text-muted-foreground" />
            </div>

            <Button
              type="submit"
              disabled={!isDirty || update.isPending}
              className="bg-[#067eda] text-white hover:bg-[#0569c0]"
            >
              {update.isPending ? (
                <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Check className="mr-1.5 size-3.5" /> Save changes</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Email address</CardTitle>
          <CardDescription>
            Current sign-in email stays active until you verify the new inbox.
            Verification links expire in 30 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label>Current email</Label>
            <Input value={me.email} disabled className="bg-muted/40 text-muted-foreground" />
          </div>

          {pendingEmail ? (
            <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
              <p className="text-sm text-foreground">
                Pending verification: <span className="font-medium">{pendingEmail}</span>
              </p>
              {me.pendingEmailExpiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(me.pendingEmailExpiresAt).toLocaleString()}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cancelEmailChange.isPending}
                onClick={() =>
                  cancelEmailChange.mutate(undefined, {
                    onSuccess: () => toast.success("Pending email change cancelled"),
                    onError: (e) => toast.error(getApiErrorMessage(e)),
                  })
                }
              >
                Cancel pending change
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-new-email">New email</Label>
                <Input
                  id="profile-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email-password">Current password</Label>
                <PasswordInput
                  id="profile-email-password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Confirm with your password"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="button"
                disabled={
                  !newEmail.trim() ||
                  !emailPassword ||
                  newEmail.trim().toLowerCase() === me.email.toLowerCase() ||
                  requestEmailChange.isPending
                }
                onClick={onRequestEmailChange}
              >
                {requestEmailChange.isPending ? (
                  <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Sending…</>
                ) : (
                  "Send verification"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── General (notifications) panel ────────────────────────────────────────────

function GeneralPanel() {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">General</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage how the platform notifies you.
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            My Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium">Email Notification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive email whenever your organization requires your attention.
              </p>
            </div>
            <Switch
              checked={notifyEmail}
              onCheckedChange={setNotifyEmail}
            />
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive push notifications whenever your organization requires your attention.
              </p>
            </div>
            <Switch
              checked={notifyPush}
              onCheckedChange={setNotifyPush}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Security panel ───────────────────────────────────────────────────────────

function SecurityPanel() {
  const { data: me } = useMe();
  const changePassword = useChangePassword();
  const disableMfa = useDisableMfa();
  const [disableOpen, setDisableOpen] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const disableForm = useForm({
    defaultValues: { password: "", code: "" },
  });
  const newPwd = watch("newPassword");

  function onSubmit(data: { currentPassword: string; newPassword: string }) {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success("Password updated successfully");
          reset();
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  function onDisableMfa(data: { password: string; code: string }) {
    disableMfa.mutate(
      { password: data.password, code: data.code },
      {
        onSuccess: () => {
          toast.success("Two-factor authentication disabled");
          disableForm.reset();
          setDisableOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Password and authenticator settings for your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-factor authentication</CardTitle>
          <CardDescription>
            Add an authenticator app for an extra sign-in step. Recommended for
            every account — especially admins and regulator staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">
                {me?.mfaEnabled ? "Enabled" : "Disabled"}
              </span>
            </p>
            {me?.mfaEnabled ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => setDisableOpen(true)}
              >
                <ShieldOff className="size-3.5" />
                Disable 2FA
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5"
                nativeButton={false}
                render={<Link href="/mfa/setup" />}
              >
                <ShieldCheck className="size-3.5" />
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) disableForm.reset();
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Confirm with your current password and a code from your authenticator
              app. You can turn 2FA back on anytime from this page.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-4 space-y-4"
            onSubmit={disableForm.handleSubmit(onDisableMfa)}
          >
            <div className="space-y-1.5">
              <Label htmlFor="disable-password">Current password</Label>
              <PasswordInput
                id="disable-password"
                autoComplete="current-password"
                placeholder="Enter your current password"
                {...disableForm.register("password", { required: "Required" })}
              />
              {disableForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {disableForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disable-code">Authenticator code</Label>
              <Input
                id="disable-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                className="font-mono tracking-widest"
                {...disableForm.register("code", {
                  required: "Required",
                  minLength: { value: 6, message: "Enter the 6-digit code" },
                })}
              />
              {disableForm.formState.errors.code && (
                <p className="text-xs text-destructive">
                  {disableForm.formState.errors.code.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisableOpen(false)}
                disabled={disableMfa.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={disableMfa.isPending}
              >
                {disableMfa.isPending ? "Disabling…" : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-muted-foreground" />
            Change password
          </CardTitle>
          <CardDescription>
            Use a strong, unique password you don&apos;t use elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <PasswordInput
                autoComplete="current-password"
                placeholder="Enter your current password"
                {...register("currentPassword", { required: "Required" })}
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>New password</Label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="At least 12 characters, letter + number"
                {...register("newPassword", {
                  required: "Required",
                  validate: (v) => isPasswordAllowed(v) || PASSWORD_POLICY_MESSAGE,
                })}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                {...register("confirmPassword", {
                  required: "Required",
                  validate: (v) => v === newPwd || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Organization panel ───────────────────────────────────────────────────────

function OrganizationPanel({ me }: { me: NonNullable<ReturnType<typeof useMe>["data"]> }) {
  const org = me.organization;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Organization</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your business identity on the platform.</p>
      </div>

      {org?.type === "REGULATOR" && me.role === "ORG_ADMIN" && (
        <AuthoritySelfSetup />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Organization profile</CardTitle>
        </CardHeader>
        <CardContent>
          {org ? (
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground font-medium">Name</dt>
                <dd className="font-medium">{org.name}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground font-medium">Type</dt>
                <dd><Badge variant="outline">{org.type}</Badge></dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground font-medium">Your role</dt>
                <dd><Badge variant="outline">{ROLE_LABELS[me.role] ?? me.role}</Badge></dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground font-medium">Org ID</dt>
                <dd className="font-mono text-xs text-muted-foreground">{org.id}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No organization linked.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Members panel ────────────────────────────────────────────────────────────

function MembersPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your team.</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/roles" />}>
          Roles &amp; permissions <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <TeamMembersPanel />
    </div>
  );
}

// ── Platform panel (SYSTEM_ADMIN only) ───────────────────────────────────────

const platformLinks = [
  { href: "/dashboard/industries", title: "Industries",  description: "Business register and licence standing",        icon: Building2 },
  { href: "/dashboard/regulators", title: "Regulators",  description: "Grant or withdraw regulatory standing",          icon: FileBadge },
  { href: "/dashboard/users",      title: "Users",        description: "Accounts across every organization",            icon: Users },
  { href: "/dashboard/audit",      title: "Audit logs",   description: "Digital footprint across the platform",         icon: ClipboardList },
];

function PlatformPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Platform</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Platform-wide controls (SAN TECH operator).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {platformLinks.map((link) => (
          <Link key={link.href} href={link.href}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <link.icon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary">{link.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>
      <OversightScopeSettings />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: me, isLoading } = useMe();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = parseSettingsTab(searchParams.get("tab"));
  const [active, setActive] = useState<SettingsTab>(tabFromUrl ?? "profile");

  // Keep the panel in sync when deep-linking (?tab=security) or using back/forward.
  const [seenUrlTab, setSeenUrlTab] = useState(tabFromUrl);
  if (tabFromUrl !== seenUrlTab) {
    setSeenUrlTab(tabFromUrl);
    if (tabFromUrl) setActive(tabFromUrl);
  }

  function selectTab(tab: SettingsTab) {
    setActive(tab);
    router.replace(`/dashboard/settings?tab=${tab}`, { scroll: false });
  }

  if (isLoading || !me) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.show || item.show(me));

  const accountItems = visibleItems.filter((i) => i.group === "account");
  const workspaceItems = visibleItems.filter((i) => i.group === "workspace");

  function renderPanel() {
    switch (active) {
      case "profile":      return <ProfilePanel me={me!} />;
      case "general":      return <GeneralPanel />;
      case "security":     return <SecurityPanel />;
      case "organization": return <OrganizationPanel me={me!} />;
      case "members":      return <MembersPanel />;
      case "platform":     return <PlatformPanel />;
    }
  }

  return (
    <div className="flex min-h-full gap-8">
      {/* ── Left sidebar ── */}
      <aside className="w-52 shrink-0">
        {/* Account group */}
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <nav className="mb-5 space-y-0.5">
          {accountItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                active === item.id
                  ? "bg-slate-100 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {workspaceItems.length > 0 && (
          <>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <nav className="space-y-0.5">
              {workspaceItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active === item.id
                      ? "bg-slate-100 font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </aside>

      {/* ── Right content ── */}
      <div className="min-w-0 flex-1">
        {renderPanel()}
      </div>
    </div>
  );
}
