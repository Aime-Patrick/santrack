"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  Check,
  Search,
  ScanLine,
  Globe,
  ChevronDown,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumb } from "@/components/layout/dashboard-breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLogout } from "@/hooks/auth";
import { useCapabilities } from "@/hooks/permissions";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import {
  GlobalSearch,
  useGlobalSearchHotkey,
} from "@/components/layout/global-search";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { UserResponse } from "@/lib/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── LocaleSwitcher ──────────────────────────────────────────────────────────

function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.href = pathname;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-[13px] font-semibold uppercase tracking-wider cursor-pointer"
            title="Switch language"
          />
        }
      >
        <Globe className="size-3.5" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown className="size-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1">
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className="gap-2 text-xs justify-between"
          >
            <span>{localeNames[code]}</span>
            {locale === code && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── UserProfileMenu ─────────────────────────────────────────────────────────

interface UserProfileMenuProps {
  user: Pick<
    UserResponse,
    "fullName" | "email" | "avatarUrl" | "avatarUploaded"
  >;
  displayName: string;
  email: string;
  role: string;
  canOpenRegulatorPortal: boolean;
  onLogout: () => void;
}

const UserProfileMenu = React.memo(function UserProfileMenu({
  user,
  displayName,
  email,
  role,
  canOpenRegulatorPortal,
  onLogout,
}: UserProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-muted/80 transition-colors outline-none cursor-pointer"
          />
        }
      >
        <UserAvatar
          user={user}
          className="size-8 border border-primary/30"
          fallbackClassName="text-xs"
        />
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-xs font-semibold text-foreground">{displayName}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{role}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-xl bg-white border border-border/80 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-2.5 font-normal bg-[#f0f7ff] rounded-lg mb-1">
            <div className="flex items-center gap-2.5 text-left text-xs">
              <UserAvatar
                user={user}
                className="size-9 border-2 border-[#067eda]/30"
                fallbackClassName="text-sm bg-[#067eda] text-white"
              />
              <div className="grid flex-1 leading-tight min-w-0">
                <span className="truncate font-bold text-foreground text-xs">{displayName}</span>
                <span className="truncate text-[10px] text-muted-foreground">{email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />} className="gap-2 text-xs">
            <UserIcon className="size-3.5 text-muted-foreground" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />} className="gap-2 text-xs">
            <Settings className="size-3.5 text-muted-foreground" />
            Settings
          </DropdownMenuItem>
          {canOpenRegulatorPortal && (
            <DropdownMenuItem render={<Link href="/dashboard/regulator" />} className="gap-2 text-xs">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
              License Review
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2 text-xs text-danger focus:text-danger focus:bg-danger/10"
        >
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// ─── DashboardHeader ─────────────────────────────────────────────────────────

export function DashboardHeader() {
  const { data: me } = useCurrentUser();
  const permissions = useCapabilities();
  const logout = useLogout();
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearchHotkey();

  const canOpenRegulatorPortal = permissions.can("DECIDE_LICENCES");

  const userDisplayName = me?.fullName || "Design Admin";
  const userEmail = me?.email || "admin@santrack.rw";
  const userRole = me?.role || "SYS_ADMIN";
  const avatarUser = {
    fullName: me?.fullName ?? userDisplayName,
    email: me?.email ?? userEmail,
    avatarUrl: me?.avatarUrl ?? null,
    avatarUploaded: me?.avatarUploaded ?? false,
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/80 bg-card px-3 md:px-4">
      {/* ── Left: Trigger & Breadcrumb ── */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted" />
        <Separator orientation="vertical" className="h-4.5 bg-border" />
        <DashboardBreadcrumb />
      </div>

      {/* ── Right: Search, Notifications & User Profile ── */}
      <div className="flex items-center gap-2">
        {/* Global Scan Action */}
        <Link
          href="/dashboard/manufacturing/trace"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition-all text-xs font-semibold cursor-pointer border border-primary/20 shadow-2xs"
          title="Scan & Trace Any Code"
        >
          <ScanLine className="size-4" />
          <span className="hidden sm:inline">Scan Code</span>
        </Link>

        {/* Global search — Cmd/Ctrl+K */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Search (Ctrl+K)"
        >
          <Search className="size-4.5" />
        </button>
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        <NotificationsMenu />

        <LocaleSwitcher />

        <UserProfileMenu
          user={avatarUser}
          displayName={userDisplayName}
          email={userEmail}
          role={userRole}
          canOpenRegulatorPortal={canOpenRegulatorPortal}
          onLogout={logout}
        />
      </div>
    </header>
  );
}
