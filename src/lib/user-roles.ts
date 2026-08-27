import type { UserRole } from "@/lib/api";

export const ROLE_LABELS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "System Admin",
  ORG_ADMIN: "Org Admin",
  PRODUCTION_MANAGER: "Production Manager",
  PRODUCTION_OFFICER: "Production Officer",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  WAREHOUSE_OFFICER: "Warehouse Officer",
  QUALITY_OFFICER: "Quality Officer",
  LOGISTICS_OFFICER: "Logistics Officer",
  SALES_OFFICER: "Sales Officer",
  MANAGEMENT: "Management",
  AUDITOR: "Auditor",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "bg-danger/10 text-danger border-danger/20",
  ORG_ADMIN: "bg-primary/10 text-primary border-primary/20",
  PRODUCTION_MANAGER: "bg-success/10 text-success border-success/20",
  PRODUCTION_OFFICER: "bg-success/10 text-success border-success/20",
  WAREHOUSE_MANAGER: "bg-warning/10 text-warning-foreground border-warning/20",
  WAREHOUSE_OFFICER: "bg-warning/10 text-warning-foreground border-warning/20",
  QUALITY_OFFICER: "bg-info/10 text-info border-info/20",
  LOGISTICS_OFFICER: "bg-primary/10 text-primary border-primary/20",
  SALES_OFFICER: "bg-success/10 text-success border-success/20",
  MANAGEMENT: "bg-muted text-muted-foreground border-border",
  AUDITOR: "bg-muted text-muted-foreground border-border",
};

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

/** Roles the actor may assign. Org admins cannot mint SYSTEM_ADMIN. */
export function assignableRoles(actorRole: UserRole | undefined): UserRole[] {
  if (actorRole === "SYSTEM_ADMIN") return ALL_ROLES;
  return ALL_ROLES.filter((role) => role !== "SYSTEM_ADMIN");
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const raw = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(", ") || fallback;
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}
