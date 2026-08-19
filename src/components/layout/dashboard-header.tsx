"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  Check,
  Search,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLogout } from "@/hooks/auth";

export function DashboardHeader() {
  const { data: me } = useCurrentUser();
  const logout = useLogout();

  const userDisplayName = me?.fullName || "Design Admin";
  const userEmail = me?.email || "admin@santrack.rw";
  const userRole = me?.role || "SYS_ADMIN";
  const userInitials =
    userDisplayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "DA";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-white px-6">
      {/* ── Left: Trigger & Breadcrumb ── */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted" />
        <Separator orientation="vertical" className="h-4.5 bg-border" />
        <DashboardBreadcrumb />
      </div>

      {/* ── Right: Search, Notification Bell & User Profile ── */}
      <div className="flex items-center gap-2">
        {/* Search Icon */}
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Search"
        >
          <Search className="size-4.5" />
        </button>

        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Notifications"
              />
            }
          >
            <Bell className="size-4.5" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#067eda] ring-2 ring-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 pb-2">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">
                Mark all as read
              </span>
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="p-2 rounded-lg hover:bg-muted/60 transition-colors text-xs space-y-0.5 cursor-pointer">
                <p className="font-semibold text-foreground">Inyange Milk Batch #PRD-00876</p>
                <p className="text-[11px] text-muted-foreground">Production batch completed and awaiting QC clearance</p>
                <p className="text-[10px] text-muted-foreground/80 pt-0.5">10 min ago</p>
              </div>
              <div className="p-2 rounded-lg hover:bg-muted/60 transition-colors text-xs space-y-0.5 cursor-pointer">
                <p className="font-semibold text-foreground">Cimerwa Cement Low Stock</p>
                <p className="text-[11px] text-muted-foreground">Clinker inventory below 15% minimum threshold</p>
                <p className="text-[10px] text-muted-foreground/80 pt-0.5">1 hour ago</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-muted/80 transition-colors outline-none cursor-pointer"
              />
            }
          >
            <Avatar className="size-8 rounded-lg border border-primary/30">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-foreground">{userDisplayName}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{userRole}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-xl bg-white border border-border/80 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-2.5 font-normal bg-[#f0f7ff] rounded-lg mb-1">
                <div className="flex items-center gap-2.5 text-left text-xs">
                  <Avatar className="size-9 rounded-lg border-2 border-[#067eda]/30">
                    <AvatarFallback className="rounded-lg bg-[#067eda] text-white text-sm font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-bold text-foreground text-xs">{userDisplayName}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
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
              <DropdownMenuItem render={<Link href="/dashboard/regulator" />} className="gap-2 text-xs">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                Regulator Portal
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="gap-2 text-xs text-danger focus:text-danger focus:bg-danger/10"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
