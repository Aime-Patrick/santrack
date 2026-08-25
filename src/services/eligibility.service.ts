import axios from "axios";
import { api } from "@/lib/api";
import type { EnforcementMode } from "./compliance.service";

/**
 * Production eligibility, as frozen in DR-07 §6.
 *
 * The server decides `eligible`, `blocking`, every check's status and the
 * order the checks come back in. This file transports that answer and does not
 * second-guess any part of it. In particular there is no client-side rule that
 * turns checks into a verdict: `eligible` is a field, not a computation.
 */

/** The eight checks, in the order the server always returns them. */
export type EligibilityCheckCode =
  | "ORGANIZATION_LICENCE"
  | "FACILITY_AUTHORIZATION"
  | "PRODUCT_CATEGORY_COVERAGE"
  | "PRODUCT_AUTHORIZATION"
  | "LICENCE_VALIDITY_AT_REQUESTED_DATE"
  | "PRODUCT_TRACEABILITY"
  | "BATCH_AND_RECALL_RESTRICTIONS"
  | "PER_PRODUCTION_APPROVAL";

export type CheckStatus = "PASS" | "FAIL" | "WARN" | "NOT_APPLICABLE";

export interface EligibilityCheck {
  code: EligibilityCheckCode;
  status: CheckStatus;
  /** Written for a manufacturer, not a developer. Rendered verbatim. */
  message: string;
  /** What they do next. Present only when there is something to do. */
  remedy?: { label: string; href: string };
}

export interface EligibilityResult {
  /** The regulatory verdict. Identical in OFF, ADVISORY and STRICT. */
  eligible: boolean;
  /** Whether creation is actually refused. Not the same question. */
  blocking: boolean;
  enforcementMode: EnforcementMode;
  evaluatedAt: string;
  /** Always all eight, always in this order, never short-circuited. */
  checks: EligibilityCheck[];
  reliedOn: {
    licenseIds: number[];
    licenseNumbers: string[];
    categoryCodes: string[];
  };
  rulesetVersion: string;
}

export interface EligibilityQuery {
  productId: number;
  /** Required once the organization has two or more open sites. */
  facilityId?: number;
  quantity: number;
  /** yyyy-MM-dd. The date the run is *for*, which may not be today. */
  date: string;
}

export const eligibilityService = {
  /**
   * `RUN_PRODUCTION`. A pure read — DR-07 §T1 exists because routing this
   * through the enforcement `check()` would write a compliance finding and
   * notify the licence holder on every keystroke. It is safe to call as the
   * form changes; it is still debounced, because there is no reason to ask
   * eight regulatory questions per digit typed.
   */
  preview(query: EligibilityQuery): Promise<EligibilityResult> {
    return api
      .get<EligibilityResult>("/api/production/eligibility", {
        params: {
          productId: query.productId,
          facilityId: query.facilityId,
          quantity: query.quantity,
          date: query.date,
        },
      })
      .then((r) => r.data);
  },
};

// ---------------------------------------------------------------------------
// Refusals
// ---------------------------------------------------------------------------

/**
 * Pulls the eligibility decision out of a refused request.
 *
 * `TraceabilityRuleException` maps to **409**, not 400, and DR-07 §6 requires
 * the failing checks to travel in the error payload. Exactly where in the body
 * they sit is the API's business and was still being settled when this was
 * written, so this looks in the places a Nest exception filter plausibly puts
 * them — top level, or nested under `message`, `detail`, `details`, `error`,
 * `eligibility`, `data` or `result` — rather than hard-coding one guess.
 *
 * It reads; it never invents. A body with no `checks` yields `null`, and the
 * caller falls back to the server's message. What it must never do is let the
 * screen show a bare "409" — the whole point of the payload is that the person
 * blocked can see what failed and what to do about it.
 */
export function eligibilityFromError(error: unknown): EligibilityResult | null {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== 409) return null;

  const body = error.response?.data as unknown;
  return findEligibility(body, 0);
}

const NESTED_KEYS = [
  "eligibility",
  "detail",
  "details",
  "message",
  "error",
  "data",
  "result",
  "payload",
] as const;

function findEligibility(node: unknown, depth: number): EligibilityResult | null {
  if (depth > 4 || node === null || typeof node !== "object") return null;

  const record = node as Record<string, unknown>;

  if (Array.isArray(record.checks)) {
    const checks = record.checks.filter(isCheck);
    if (checks.length > 0) return normalise(record, checks);
  }

  for (const key of NESTED_KEYS) {
    const child = record[key];
    if (!child) continue;
    const found = Array.isArray(child)
      ? child.map((entry) => findEligibility(entry, depth + 1)).find(Boolean)
      : findEligibility(child, depth + 1);
    if (found) return found;
  }

  return null;
}

function isCheck(value: unknown): value is EligibilityCheck {
  if (!value || typeof value !== "object") return false;
  const check = value as Record<string, unknown>;
  return typeof check.code === "string" && typeof check.status === "string";
}

/**
 * Fills in what a partial payload leaves out, without asserting anything the
 * server did not say. A refusal that carries checks but omits `blocking` is,
 * by the fact that it is a refusal, blocking — that is the transport telling
 * us, not the browser deciding.
 */
function normalise(
  record: Record<string, unknown>,
  checks: EligibilityCheck[],
): EligibilityResult {
  const reliedOn = (record.reliedOn ?? {}) as Record<string, unknown>;

  return {
    eligible: record.eligible === true,
    blocking: record.blocking === undefined ? true : record.blocking === true,
    enforcementMode: (record.enforcementMode as EnforcementMode) ?? "STRICT",
    evaluatedAt: (record.evaluatedAt as string) ?? new Date().toISOString(),
    checks,
    reliedOn: {
      licenseIds: asArray<number>(reliedOn.licenseIds),
      licenseNumbers: asArray<string>(reliedOn.licenseNumbers),
      categoryCodes: asArray<string>(reliedOn.categoryCodes),
    },
    rulesetVersion: (record.rulesetVersion as string) ?? "",
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
