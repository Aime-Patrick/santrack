"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMe, useChangePassword, useUpdateProfile } from "@/hooks/auth";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { ROLE_LABELS } from "@/lib/user-roles";
import { AuthoritySelfSetup } from "@/components/regulator/authority-self-setup";
import { OversightScopeSettings } from "@/components/dashboard/oversight-scope-settings";
import { getApiErrorMessage } from "@/lib/api";

// ── sidebar nav definition ───────────────────────────────────────────────────

type SettingsTab =
  | "profile"
  | "general"
  | "security"
  | "organization"
  | "members"
  | "platform";

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
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: { fullName: me.fullName ?? "" },
  });

  // Re-sync when me data refreshes
  useEffect(() => { reset({ fullName: me.fullName ?? "" }); }, [me.fullName, reset]);

  const initials = (me.fullName ?? me.email)
    .split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  function onSubmit(data: { fullName: string }) {
    update.mutate(
      { fullName: data.fullName.trim() },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your personal identity on the platform.
        </p>
      </div>

      {/* Avatar block */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl border-2 border-primary/20">
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{me.fullName ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{me.email}</p>
              <Badge variant="outline" className="mt-1.5 text-[11px]">
                {ROLE_LABELS[me.role] ?? me.role}
              </Badge>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
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
              <Label>Email address</Label>
              <Input value={me.email} disabled className="bg-muted/40 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">
                Contact an administrator to change your email.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input value={String(me.id)} disabled className="bg-muted/40 font-mono text-muted-foreground text-xs" />
            </div>

            <Button
              type="submit"
              disabled={!isDirty || update.isPending}
              className="bg-[#067eda] hover:bg-[#0569c0] text-white"
            >
              {update.isPending ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                <><Check className="size-3.5 mr-1.5" /> Save changes</>
              )}
            </Button>
          </form>
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
  const changePassword = useChangePassword();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Keep your account secure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            Change password
          </CardTitle>
          <CardDescription>
            Use a strong, unique password you don't use elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                autoComplete="current-password"
                {...register("currentPassword", { required: "Required" })}
              />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("newPassword", {
                  required: "Required",
                  minLength: { value: 8, message: "At least 8 characters" },
                })}
              />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword", {
                  required: "Required",
                  validate: (v) => v === newPwd || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-[#067eda] hover:bg-[#0569c0] text-white"
            >
              {changePassword.isPending ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Updating…</>
              ) : "Update password"}
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
  const [active, setActive] = useState<SettingsTab>("profile");

  if (isLoading || !me) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading settings…
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
    <div className="flex gap-8 min-h-full">
      {/* ── Left sidebar ── */}
      <aside className="w-52 shrink-0">
        {/* Account group */}
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <nav className="space-y-0.5 mb-5">
          {accountItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                active === item.id
                  ? "bg-slate-100 text-foreground font-semibold"
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
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                    active === item.id
                      ? "bg-slate-100 text-foreground font-semibold"
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
      <div className="flex-1 min-w-0">
        {renderPanel()}
      </div>
    </div>
  );
}
