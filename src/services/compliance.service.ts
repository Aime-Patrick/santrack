import { api, type LicenseStatus } from "@/lib/api";

/**
 * The compliance overview, as frozen in DR-07 §6.
 *
 * Every field below is *decided by the server*. Nothing in this file, and
 * nothing that renders it, works out whether a licence is valid, whether a
 * site is authorised, or whether anything is eligible. The browser has been
 * down that road before — see the note on `Capability` in `lib/api.ts` about
 * the role table that drifted — and a second copy of the licensing rules would
 * fail the same way, only with regulatory consequences instead of a wrong
 * sidebar.
 */

/** How the platform is currently enforcing. Decided server-side. */
export type EnforcementMode = "OFF" | "ADVISORY" | "STRICT";

/** Verdict on a licence, from the API's `LicenseVerdict`. */
export type LicenseVerdict =
  | "LICENSED"
  | "NONE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED";

/** Organization, facility and product standing. Never FAIL for a product in MVP. */
export type ComplianceStatus = "PASS" | "WARN" | "FAIL";

export interface LicenceSummary {
  id: number;
  licenseNumber: string;
  status: LicenseStatus;
  verdict: LicenseVerdict;
  /** Whether the licence was issued against the company or against one site. */
  grain: "ORGANIZATION" | "FACILITY";
  /**
   * Platform-granted onboarding grace, not regulator approval.
   *
   * 180 of 182 licences on the platform are provisional. The screen says so in
   * those words, because a provisional record shown as a plain pass is a
   * manufacturer told they are approved when no regulator has looked at them.
   */
  provisional: boolean;
  issuedOn: string | null;
  expiresOn: string | null;
}

export interface OrganizationCompliance {
  id: number;
  name: string;
  status: ComplianceStatus;
  message: string;
  /** The governing organization-grained licence, or null when there is none. */
  licence: LicenceSummary | null;
}

export interface FacilityCompliance {
  id: number;
  name: string;
  code: string | null;
  active: boolean;
  status: ComplianceStatus;
  message: string;
  /** Site licence if any, else the one it inherits. */
  licence: LicenceSummary | null;
  /** True when covered by the company licence rather than holding its own. */
  inherited: boolean;
}

export interface ProductCompliance {
  id: number;
  name: string;
  sku: string;
  status: ComplianceStatus;
  message: string;
  categoryCode: string | null;
}

export interface ComplianceOverview {
  organization: OrganizationCompliance;
  facilities: FacilityCompliance[];
  products: ProductCompliance[];
  enforcementMode: EnforcementMode;
  evaluatedAt: string;
}

export const complianceService = {
  /** `VIEW_OPERATIONS`. A pure read — it decides nothing and writes nothing. */
  overview(): Promise<ComplianceOverview> {
    return api
      .get<ComplianceOverview>("/api/compliance/overview")
      .then((r) => r.data);
  },
};

// ---------------------------------------------------------------------------
// Presentation helpers
//
// These map a status the server already decided onto a colour and a word.
// None of them decides a status.
// ---------------------------------------------------------------------------

/**
 * The API's enum serialises lowercase (`EnforcementMode.OFF = 'off'`) while the
 * contract writes it uppercase. Rather than guess which arrives, accept either
 * and show one. Nothing branches on the result — `blocking` does that, and it
 * comes from the server.
 */
export function enforcementLabel(mode: string | undefined | null): string {
  return (mode ?? "").toUpperCase() || "UNKNOWN";
}
