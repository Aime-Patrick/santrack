import type { Capability, UserRole } from "./api";

/**
 * PREVIEW ONLY. Not an authorization table.
 *
 * `NEXT_PUBLIC_DESIGN_MODE=true` runs the dashboard with no backend so screens
 * can be designed without a database. The role switcher needs *some* capability
 * list to show what each role's dashboard looks like, and with the API absent
 * there is nowhere to get one.
 *
 * Nothing in the running product reads this. With design mode off — which is
 * every real deployment — capabilities come from `/api/auth/me` and this file
 * is dead weight in the bundle. If it falls out of step with the backend, the
 * consequence is a slightly wrong mockup, never a wrongly granted screen.
 *
 * If you find yourself importing this outside design mode, that is the bug.
 */
export const PREVIEW_ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  SYSTEM_ADMIN: [
    "VIEW_OPERATIONS",
    "MANAGE_USERS",
    "OVERSEE_INDUSTRIES",
    "ADMINISTER_PLATFORM",
  ],
  ORG_ADMIN: [
    "REGISTER_IDENTITY", "HANDLE_PACKAGING", "MOVE_STOCK", "SELL",
    "APPLY_LIFECYCLE", "MANAGE_RECALL", "MANAGE_CATALOG", "RUN_PRODUCTION",
    "PERFORM_QC", "MANAGE_LOGISTICS", "MANAGE_CLIENTS", "MANAGE_FINANCE",
    "MANAGE_PAYROLL", "VIEW_OPERATIONS", "MANAGE_USERS",
  ],
  PRODUCTION_MANAGER: [
    "REGISTER_IDENTITY", "HANDLE_PACKAGING", "MANAGE_CATALOG",
    "RUN_PRODUCTION", "PERFORM_QC", "VIEW_OPERATIONS",
  ],
  PRODUCTION_OFFICER: [
    "REGISTER_IDENTITY", "HANDLE_PACKAGING", "RUN_PRODUCTION", "VIEW_OPERATIONS",
  ],
  WAREHOUSE_MANAGER: [
    "HANDLE_PACKAGING", "MOVE_STOCK", "APPLY_LIFECYCLE", "MANAGE_LOGISTICS",
    "VIEW_OPERATIONS",
  ],
  WAREHOUSE_OFFICER: ["HANDLE_PACKAGING", "MOVE_STOCK", "VIEW_OPERATIONS"],
  QUALITY_OFFICER: [
    "APPLY_LIFECYCLE", "MANAGE_RECALL", "PERFORM_QC", "VIEW_OPERATIONS",
  ],
  LOGISTICS_OFFICER: ["MOVE_STOCK", "MANAGE_LOGISTICS", "VIEW_OPERATIONS"],
  SALES_OFFICER: ["SELL", "MANAGE_CLIENTS", "MOVE_STOCK", "VIEW_OPERATIONS"],
  MANAGEMENT: ["VIEW_OPERATIONS"],
  AUDITOR: ["VIEW_OPERATIONS"],
};

/**
 * A regulator's staff hold capabilities their job title alone does not carry.
 * The preview switcher offers this as a toggle so the supervisory screens can
 * be designed without standing up an authority in the database.
 */
export const PREVIEW_STANDING_CAPABILITIES: Capability[] = ["OVERSEE_INDUSTRIES"];
