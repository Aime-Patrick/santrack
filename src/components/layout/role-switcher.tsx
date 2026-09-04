"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Users, Eye } from "lucide-react";
import { useDesignMode } from "@/components/providers/design-mode-provider";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/api";
import { PREVIEW_ROLE_CAPABILITIES, PREVIEW_STANDING_CAPABILITIES } from "@/lib/design-fixtures";

/** Friendly labels and descriptions for each role. */
const ROLE_META: Record<
  UserRole,
  { label: string; shortLabel: string; description: string; color: string }
> = {
  SYSTEM_ADMIN: {
    label: "System Admin",
    shortLabel: "Sys Admin",
    description: "Full platform access — manages users, licenses, recalls, and all operations.",
    color: "bg-danger text-white",
  },
  ORG_ADMIN: {
    label: "Organization Admin",
    shortLabel: "Org Admin",
    description: "Manages their organization — catalog, users, packaging, sales, and recalls.",
    color: "bg-primary text-white",
  },
  PRODUCTION_MANAGER: {
    label: "Production Manager",
    shortLabel: "Prod Manager",
    description: "Registers items, handles packaging, manages the product catalog.",
    color: "bg-success text-white",
  },
  PRODUCTION_OFFICER: {
    label: "Production Officer",
    shortLabel: "Prod Officer",
    description: "Registers items and handles packaging operations.",
    color: "bg-success text-white",
  },
  WAREHOUSE_MANAGER: {
    label: "Warehouse Manager",
    shortLabel: "WH Manager",
    description: "Handles packaging, stock movement, and applies lifecycle transitions.",
    color: "bg-info text-white",
  },
  WAREHOUSE_OFFICER: {
    label: "Warehouse Officer",
    shortLabel: "WH Officer",
    description: "Handles packaging and moves stock between locations.",
    color: "bg-info text-white",
  },
  QUALITY_OFFICER: {
    label: "Quality Officer",
    shortLabel: "QC Officer",
    description: "Applies lifecycle transitions and manages product recalls.",
    color: "bg-warning-foreground text-white",
  },
  LOGISTICS_OFFICER: {
    label: "Logistics Officer",
    shortLabel: "Logistics",
    description: "Moves stock between locations — dispatch, receive, relocate.",
    color: "bg-info text-white",
  },
  SALES_OFFICER: {
    label: "Sales Officer",
    shortLabel: "Sales",
    description: "Sells products (B2B and consumer) and moves stock.",
    color: "bg-success text-white",
  },
  MANAGEMENT: {
    label: "Management",
    shortLabel: "Mgmt",
    description: "Read-only access to operations and reports.",
    color: "bg-muted text-muted-foreground",
  },
  AUDITOR: {
    label: "Auditor",
    shortLabel: "Auditor",
    description: "Read-only access to operations and reports for compliance review.",
    color: "bg-muted text-muted-foreground",
  },
};

const ALL_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "ORG_ADMIN",
  "PRODUCTION_MANAGER",
  "PRODUCTION_OFFICER",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_OFFICER",
  "QUALITY_OFFICER",
  "LOGISTICS_OFFICER",
  "SALES_OFFICER",
  "MANAGEMENT",
  "AUDITOR",
];

export function RoleSwitcher() {
  const { isDesignMode, role, setRole, standing, setStanding } = useDesignMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isDesignMode) return null;

  const current = ROLE_META[role];

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-lg transition-all hover:shadow-xl",
          open && "ring-2 ring-primary/30",
        )}
      >
        <Eye className="size-4 text-primary" />
        <span className="hidden sm:inline">Preview as:</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", current.color)}>
          {current.shortLabel}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute bottom-14 right-0 w-[380px] max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Switch Preview Role</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              See the dashboard as different user types
            </p>
          </div>

          {/* Standing toggle. Some screens — the industry register above all —
              are reached through the organization's standing rather than the
              job title, so a role picker alone cannot preview them. */}
          <label className="flex cursor-pointer items-start gap-2.5 border-b border-border px-4 py-3 hover:bg-muted/50">
            <input
              type="checkbox"
              checked={standing}
              onChange={(e) => setStanding(e.target.checked)}
              className="mt-0.5 size-3.5 accent-[var(--color-primary)]"
            />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-foreground">
                Works for a licensing authority
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                Adds{" "}
                {PREVIEW_STANDING_CAPABILITIES.map((cap) =>
                  cap.replace(/_/g, " ").toLowerCase(),
                ).join(", ")}
                {" "}on top of the role — how a regulator sees the platform.
              </span>
            </span>
          </label>

          {/* Role list */}
          <div className="p-2">
            {ALL_ROLES.map((r) => {
              const meta = ROLE_META[r];
              const isSelected = r === role;
              const capabilities = PREVIEW_ROLE_CAPABILITIES[r];

              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-all",
                    isSelected
                      ? "bg-primary-light ring-1 ring-primary/20"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", meta.color)}>
                        {meta.shortLabel}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {meta.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 pl-0 text-xs text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {cap.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
