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
  SYSTEM_ADMIN: "bg-danger text-white border-transparent",
  ORG_ADMIN: "bg-primary text-white border-transparent",
  PRODUCTION_MANAGER: "bg-success text-white border-transparent",
  PRODUCTION_OFFICER: "bg-success text-white border-transparent",
  WAREHOUSE_MANAGER: "bg-warning-foreground text-white border-transparent",
  WAREHOUSE_OFFICER: "bg-warning-foreground text-white border-transparent",
  QUALITY_OFFICER: "bg-info text-white border-transparent",
  LOGISTICS_OFFICER: "bg-primary text-white border-transparent",
  SALES_OFFICER: "bg-success text-white border-transparent",
  MANAGEMENT: "bg-muted-foreground text-white border-transparent",
  AUDITOR: "bg-muted-foreground text-white border-transparent",
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
