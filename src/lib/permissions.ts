import type { Capability, UserResponse } from "./api";

/**
 * How the UI asks whether the current user may do something.
 *
 * Every answer traces back to the capability list the server sent with
 * `/api/auth/me`. Nothing here recomputes it from a role, because that is
 * exactly the mistake this replaces: a second copy of the rules that quietly
 * fell behind the first.
 */
export interface PermissionSet {
  /** The raw list, for the rare caller that needs to render it. */
  capabilities: Capability[];
  /** Holds this capability. */
  can: (capability: Capability) => boolean;
  /** Holds at least one of them. Use for "or" requirements. */
  canAny: (capabilities: readonly Capability[]) => boolean;
  /** Holds all of them. This is the default for navigation entries. */
  canAll: (capabilities: readonly Capability[]) => boolean;
  /** Still waiting on /me, so gating decisions are not yet meaningful. */
  loading: boolean;
}

export function permissionsOf(
  user: UserResponse | undefined,
  loading = false,
): PermissionSet {
  const capabilities = user?.capabilities ?? [];
  const held = new Set(capabilities);

  return {
    capabilities,
    can: (capability) => held.has(capability),
    canAny: (required) =>
      required.length === 0 || required.some((c) => held.has(c)),
    canAll: (required) => required.every((c) => held.has(c)),
    loading,
  };
}

// ---------------------------------------------------------------------------
// Route protection
// ---------------------------------------------------------------------------

/**
 * What each dashboard route needs, in one table.
 *
 * Hiding a link is a courtesy, not a control: the page behind it is still one
 * typed URL away, and before this table existed every one of them rendered
 * happily for anyone who guessed the path — the API refused the data, so the
 * screen came up empty and looked broken rather than forbidden.
 *
 * Matching is longest-prefix, so a specific child route can be stricter than
 * its parent. Anything not listed needs only VIEW_OPERATIONS, which every role
 * holds; that is deliberate, so a new page is readable rather than accidentally
 * locked, and anything sensitive gets an entry here the day it is written.
 */
export const ROUTE_CAPABILITIES: { prefix: string; requires: Capability[] }[] = [
  // Supervisory — the register of businesses on the platform.
  { prefix: "/dashboard/industries", requires: ["OVERSEE_INDUSTRIES"] },
  // Registering a business in the registry is operator-only by default but
  // can be granted to a specific officer (MANAGE_INDUSTRIES is the one
  // dynamically grantable capability).
  { prefix: "/dashboard/industries/new", requires: ["MANAGE_INDUSTRIES"] },
  { prefix: "/dashboard/regulators", requires: ["ADMINISTER_PLATFORM"] },
  { prefix: "/dashboard/regulator", requires: ["DECIDE_LICENCES"] },
  // The platform-wide audit log: the operator and licensing authorities read
  // Platform telemetry (HTTP paths, IPs, status codes) — operator only.
  // Regulators supervise through the accountability ledger, not raw logs.
  { prefix: "/dashboard/audit", requires: ["READ_AUDIT"] },
  // Industry-wide findings (not org Sites overview). Overseers only.
  { prefix: "/dashboard/compliance/findings", requires: ["OVERSEE_INDUSTRIES"] },

  // Manufacturing.
  { prefix: "/dashboard/products/new", requires: ["MANAGE_CATALOG"] },
  // Label Studio mints identity codes onto labels. Reading a label for an
  // item already in hand is the scan screen's per-item dialog, which stays
  // open to VIEW_OPERATIONS; minting whole pools is a producer's job.
  { prefix: "/dashboard/labels", requires: ["REGISTER_IDENTITY"] },
  { prefix: "/dashboard/manufacturing/register-units", requires: ["REGISTER_IDENTITY"] },
  { prefix: "/dashboard/manufacturing/register-package", requires: ["REGISTER_IDENTITY"] },
  { prefix: "/dashboard/manufacturing/pack", requires: ["HANDLE_PACKAGING"] },
  { prefix: "/dashboard/manufacturing/production", requires: ["RUN_PRODUCTION"] },
  // Raising a run is production work. The eligibility preview behind this
  // screen is gated on the same capability by the API.
  { prefix: "/dashboard/manufacturing/start-production", requires: ["RUN_PRODUCTION"] },
  { prefix: "/dashboard/manufacturing/raw-materials", requires: ["RUN_PRODUCTION"] },
  { prefix: "/dashboard/manufacturing/boms", requires: ["RUN_PRODUCTION"] },
  { prefix: "/dashboard/manufacturing/machines", requires: ["RUN_PRODUCTION"] },
  { prefix: "/dashboard/manufacturing/quality", requires: ["PERFORM_QC"] },

  // Stock movement.
  { prefix: "/dashboard/manufacturing/stock-transfer", requires: ["MOVE_STOCK"] },
  { prefix: "/dashboard/manufacturing/stock-relocate", requires: ["MOVE_STOCK"] },
  { prefix: "/dashboard/inventory/new", requires: ["MANAGE_CATALOG"] },
  { prefix: "/dashboard/inventory/locations", requires: ["MANAGE_CATALOG"] },
  { prefix: "/dashboard/inventory/opening-stock", requires: ["REGISTER_IDENTITY"] },
  { prefix: "/dashboard/inventory/stock-in", requires: ["MOVE_STOCK"] },

  // Commerce.
  { prefix: "/dashboard/sales", requires: ["SELL"] },
  { prefix: "/dashboard/sales/customers", requires: ["MANAGE_CLIENTS"] },
  { prefix: "/dashboard/sales/quotations", requires: ["MANAGE_CLIENTS"] },
  { prefix: "/dashboard/sales/orders", requires: ["MANAGE_CLIENTS"] },
  { prefix: "/dashboard/sales/invoices", requires: ["MANAGE_CLIENTS"] },
  { prefix: "/dashboard/sales/returns", requires: ["MANAGE_CLIENTS"] },
  { prefix: "/dashboard/purchasing", requires: ["MANAGE_CLIENTS"] },

  // Back office.
  { prefix: "/dashboard/finance", requires: ["MANAGE_FINANCE"] },
  { prefix: "/dashboard/employees", requires: ["MANAGE_PAYROLL"] },
  { prefix: "/dashboard/logistics", requires: ["MANAGE_LOGISTICS"] },
  { prefix: "/dashboard/users", requires: ["ADMINISTER_PLATFORM"] },
  { prefix: "/dashboard/roles", requires: ["MANAGE_USERS"] },
  { prefix: "/dashboard/settings", requires: ["MANAGE_USERS"] },

  // Compliance. Reading where the business stands is an operations question,
  // which is what the API asks for on both the overview and the site list.
  // Opening or closing a site is a catalogue decision and is gated on the page
  // and again by the API, not by this table — the list itself stays readable.
  // Industry-wide findings are listed above; this prefix is the trading
  // business's own standing (see TRADING_ORG_ROUTE_PREFIXES).
  { prefix: "/dashboard/compliance", requires: ["VIEW_OPERATIONS"] },

  // Operations.
  { prefix: "/dashboard/recall", requires: ["VIEW_OPERATIONS"] },
];

/**
 * Screens that belong to a trading business applying for / operating under
 * licences — not to a licensing authority reviewing others.
 *
 * Capability alone cannot express this: authorities hold VIEW_OPERATIONS and
 * have an organization, which is exactly what these pages used to ask for.
 * Matching is longest-prefix; `/dashboard/compliance/findings` is excluded
 * because overseers need it.
 */
export const TRADING_ORG_ROUTE_PREFIXES: string[] = [
  "/dashboard/licenses",
  "/dashboard/reports",
  "/dashboard/compliance",
];

/**
 * True when this path is a trading-business screen and must stay hidden from
 * REGULATOR organizations (and from platform operators with no org).
 */
export function routeRequiresTradingOrg(pathname: string): boolean {
  let best: string | undefined;
  for (const prefix of TRADING_ORG_ROUTE_PREFIXES) {
    const matches =
      pathname === prefix || pathname.startsWith(prefix + "/");
    if (matches && (!best || prefix.length > best.length)) {
      best = prefix;
    }
  }
  // Industry compliance findings sit under /compliance but are supervisory.
  if (
    best === "/dashboard/compliance" &&
    (pathname === "/dashboard/compliance/findings" ||
      pathname.startsWith("/dashboard/compliance/findings/"))
  ) {
    return false;
  }
  return best !== undefined;
}

/**
 * What the given path requires. Longest matching prefix wins, so
 * `/dashboard/industries/new` is operator-only even though
 * `/dashboard/industries` is open to regulators.
 */
export function capabilitiesForRoute(pathname: string): Capability[] {
  let best: { prefix: string; requires: Capability[] } | undefined;

  for (const entry of ROUTE_CAPABILITIES) {
    const matches =
      pathname === entry.prefix || pathname.startsWith(entry.prefix + "/");
    if (matches && (!best || entry.prefix.length > best.prefix.length)) {
      best = entry;
    }
  }

  return best?.requires ?? ["VIEW_OPERATIONS"];
}
