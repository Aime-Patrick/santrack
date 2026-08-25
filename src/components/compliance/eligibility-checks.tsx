import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EligibilityCheck } from "@/services/eligibility.service";
import { StatusBadge } from "./status-badge";

/**
 * Readable titles for the eight check codes.
 *
 * A naming table, nothing more. The status beside each one is the server's and
 * is never derived here — including for the two checks that ship inert
 * (`PRODUCT_AUTHORIZATION`, `PER_PRODUCTION_APPROVAL`), which return
 * NOT_APPLICABLE from the API today and will start returning real verdicts
 * post-MVP without this screen changing.
 */
const CHECK_TITLES: Record<string, string> = {
  ORGANIZATION_LICENCE: "Company licence",
  FACILITY_AUTHORIZATION: "Site authorisation",
  PRODUCT_CATEGORY_COVERAGE: "Product category coverage",
  PRODUCT_AUTHORIZATION: "Product authorisation",
  LICENCE_VALIDITY_AT_REQUESTED_DATE: "Licence valid on the requested date",
  PRODUCT_TRACEABILITY: "Product traceability",
  BATCH_AND_RECALL_RESTRICTIONS: "Batch and recall restrictions",
  PER_PRODUCTION_APPROVAL: "Per-production approval",
};

function titleFor(code: string): string {
  return (
    CHECK_TITLES[code] ??
    code.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  );
}

/**
 * A remedy link the server supplied.
 *
 * The href comes from the API; internal paths go through the router, anything
 * else opens as an ordinary link. The label is the server's words.
 */
export function RemedyLink({
  remedy,
  className,
}: {
  remedy: { label: string; href: string };
  className?: string;
}) {
  const classes = cn(
    "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline",
    className,
  );

  if (remedy.href?.startsWith("/")) {
    return (
      <Link href={remedy.href} className={classes}>
        {remedy.label}
        <ArrowRight className="size-3" />
      </Link>
    );
  }

  return (
    <a href={remedy.href} className={classes} rel="noreferrer">
      {remedy.label}
      <ArrowRight className="size-3" />
    </a>
  );
}

/** One row: the check, its status, the server's message, and what to do next. */
export function EligibilityCheckRow({
  check,
  emphasised,
}: {
  check: EligibilityCheck;
  emphasised?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        emphasised && "bg-danger/5",
        check.status === "NOT_APPLICABLE" && "opacity-70",
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {titleFor(check.code)}
        </p>
        {check.message && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {check.message}
          </p>
        )}
        {check.remedy?.href && <RemedyLink remedy={check.remedy} />}
      </div>

      <StatusBadge status={check.status} className="shrink-0" />
    </li>
  );
}

/**
 * Every check the server returned, in the order it returned them.
 *
 * All eight, always — including the ones that pass and the ones that do not
 * apply. The list is not filtered, not sorted and not summarised: DR-07 §24
 * invariant 7 says the server never short-circuits, and a screen that hides
 * the checks it considers uninteresting undoes that.
 */
export function EligibilityChecklist({
  checks,
  emphasise,
  className,
}: {
  checks: EligibilityCheck[] | undefined;
  /** A single check to highlight — normally the one that blocked the run. */
  emphasise?: string;
  className?: string;
}) {
  const rows = checks ?? [];

  if (rows.length === 0) {
    return (
      <p className={cn("px-4 py-6 text-sm text-muted-foreground", className)}>
        No checks were returned with this answer.
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {rows.map((check, index) => (
        <EligibilityCheckRow
          key={`${check.code}-${index}`}
          check={check}
          emphasised={!!emphasise && check.code === emphasise}
        />
      ))}
    </ul>
  );
}

/** The first check the server marked FAIL. Selection, not evaluation. */
export function firstFailing(
  checks: EligibilityCheck[] | undefined,
): EligibilityCheck | undefined {
  return (checks ?? []).find((check) => check.status === "FAIL");
}
