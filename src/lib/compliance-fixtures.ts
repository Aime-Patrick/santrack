import type { ComplianceOverview } from "@/services/compliance.service";
import type {
  EligibilityCheck,
  EligibilityQuery,
  EligibilityResult,
} from "@/services/eligibility.service";

/**
 * PREVIEW ONLY. Not an assessment, and never a verdict about anything real.
 *
 * `NEXT_PUBLIC_DESIGN_MODE=true` runs the dashboard with no backend so screens
 * can be designed without a database. The compliance screens have nothing to
 * render in that state, and a blank page is not a design. These fixtures are
 * shaped exactly like DR-07 §6 so the layouts can be checked against the real
 * contract — every field present, all eight checks in the frozen order.
 *
 * Nothing in the running product reads this file. With design mode off — which
 * is every real deployment — the screens show what `GET /api/compliance/overview`
 * and `GET /api/production/eligibility` returned, or they show that the server
 * did not answer. They never show this.
 *
 * The same warning as `design-fixtures.ts`, one degree louder: a wrong mockup
 * of a sidebar is a cosmetic mistake. A fabricated PASS on a licensing screen
 * is a manufacturer told they are covered when they are not. If you find
 * yourself importing this outside design mode, that is the bug.
 */

const NOW = () => new Date().toISOString();

export function previewOverview(): ComplianceOverview {
  return {
    organization: {
      id: 1,
      name: "Inyange Industries",
      status: "WARN",
      message:
        "Operating on a provisional licence issued at onboarding. Apply for a full manufacturing licence before it runs out.",
      licence: {
        id: 101,
        licenseNumber: "LIC-PROV-000101",
        status: "ACTIVE",
        verdict: "LICENSED",
        grain: "ORGANIZATION",
        provisional: true,
        issuedOn: "2026-06-12",
        expiresOn: "2026-12-12",
      },
    },
    facilities: [
      {
        id: 11,
        name: "Kigali Plant",
        code: "FAC-000011",
        active: true,
        status: "WARN",
        message:
          "Covered by the company's provisional licence. No site licence has been applied for.",
        inherited: true,
        licence: {
          id: 101,
          licenseNumber: "LIC-PROV-000101",
          status: "ACTIVE",
          verdict: "LICENSED",
          grain: "ORGANIZATION",
          provisional: true,
          issuedOn: "2026-06-12",
          expiresOn: "2026-12-12",
        },
      },
      {
        id: 12,
        name: "Huye Plant",
        code: "FAC-000012",
        active: true,
        status: "FAIL",
        message:
          "This site's own licence is suspended. It replaces the company licence here, so production at Huye is not authorised.",
        inherited: false,
        licence: {
          id: 204,
          licenseNumber: "LIC-MFG-000204",
          status: "SUSPENDED",
          verdict: "SUSPENDED",
          grain: "FACILITY",
          provisional: false,
          issuedOn: "2025-03-01",
          expiresOn: "2027-03-01",
        },
      },
    ],
    products: [
      {
        id: 501,
        name: "Inyange Milk 1L",
        sku: "INY-MILK-1L",
        status: "PASS",
        message: "Covered by the governing licence's permitted categories.",
        categoryCode: "DAIRY",
      },
      {
        id: 502,
        name: "Inyange Juice 500ml",
        sku: "INY-JUICE-500",
        status: "WARN",
        message:
          "This product has no category on record, so category coverage cannot be confirmed. Classify it in the catalogue.",
        categoryCode: null,
      },
    ],
    enforcementMode: "ADVISORY",
    evaluatedAt: NOW(),
  };
}

/** The eight codes in the order the server always returns them. */
function checks(variant: 0 | 1 | 2): EligibilityCheck[] {
  const organization: EligibilityCheck =
    variant === 2
      ? {
          code: "ORGANIZATION_LICENCE",
          status: "FAIL",
          message:
            "The company's manufacturing licence has been revoked. No production may be recorded against it.",
          remedy: { label: "Open licences", href: "/dashboard/licenses" },
        }
      : {
          code: "ORGANIZATION_LICENCE",
          status: "WARN",
          message:
            "The company holds a provisional licence, expiring 12 Dec 2026. Provisional cover is onboarding grace, not regulator approval.",
          remedy: { label: "Apply for a full licence", href: "/dashboard/licenses" },
        };

  const facility: EligibilityCheck =
    variant === 1
      ? {
          code: "FACILITY_AUTHORIZATION",
          status: "FAIL",
          message:
            "Huye Plant's own licence is suspended, and a site licence replaces the company licence at that site.",
          remedy: { label: "Review this site", href: "/dashboard/compliance/facilities" },
        }
      : {
          code: "FACILITY_AUTHORIZATION",
          status: "PASS",
          message: "Kigali Plant is covered by the company licence.",
        };

  return [
    organization,
    facility,
    {
      code: "PRODUCT_CATEGORY_COVERAGE",
      status: "WARN",
      message:
        "This product has no category on record, so the licence's permitted categories cannot be checked against it.",
      remedy: { label: "Classify the product", href: "/dashboard/products" },
    },
    {
      code: "PRODUCT_AUTHORIZATION",
      status: "NOT_APPLICABLE",
      message: "Product-level authorization is not part of this release.",
    },
    {
      code: "LICENCE_VALIDITY_AT_REQUESTED_DATE",
      status: "PASS",
      message: "The governing licence covers the requested date.",
    },
    {
      code: "PRODUCT_TRACEABILITY",
      status: "PASS",
      message: "The product's traceability level is set and identities can be minted.",
    },
    {
      code: "BATCH_AND_RECALL_RESTRICTIONS",
      status: "PASS",
      message: "No recall or batch restriction applies to this product.",
    },
    {
      code: "PER_PRODUCTION_APPROVAL",
      status: "NOT_APPLICABLE",
      message: "Per-production approval is not part of this release.",
    },
  ];
}

/**
 * A preview decision.
 *
 * The variant rotates on the requested quantity purely so all three outcomes —
 * ready, allowed-with-a-failure, and refused — can be looked at while designing.
 * It is an arbitrary rotation, it is not a rule, and it means nothing.
 */
export function previewEligibility(query: EligibilityQuery): EligibilityResult {
  const variant = (Math.abs(query.quantity ?? 0) % 3) as 0 | 1 | 2;

  return {
    eligible: variant === 0,
    blocking: variant === 2,
    enforcementMode: variant === 2 ? "STRICT" : "ADVISORY",
    evaluatedAt: NOW(),
    checks: checks(variant),
    reliedOn: {
      licenseIds: [101],
      licenseNumbers: ["LIC-PROV-000101"],
      categoryCodes: ["MFG"],
    },
    rulesetVersion: "DR07-MVP-1",
  };
}
