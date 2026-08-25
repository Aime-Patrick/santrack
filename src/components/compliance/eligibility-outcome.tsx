import { AlertTriangle, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { enforcementLabel } from "@/services/compliance.service";
import type { EligibilityResult } from "@/services/eligibility.service";
import { EligibilityChecklist, RemedyLink, firstFailing } from "./eligibility-checks";

/**
 * What the server decided about a proposed run, and what the operator may do
 * about it.
 *
 * There are **three** outcomes, not two, and the third is the one that gets
 * lost. `eligible` is the regulatory verdict and `blocking` is whether creation
 * is refused; they are separate fields because they answer separate questions.
 * Under ADVISORY an ineligible run is *permitted* — the order is created and a
 * compliance finding is written against it. Collapsing that into "blocked"
 * stops work the platform allows; collapsing it into "fine" hides a regulatory
 * failure the manufacturer is accountable for.
 *
 * Both fields come from the API. Nothing here recomputes either, and the branch
 * below reads them rather than the enforcement mode, because the mode's effect
 * on blocking is the server's rule to apply.
 */
export function EligibilityOutcome({
  result,
  onCreate,
  pending,
  disabledReason,
  className,
}: {
  result: EligibilityResult;
  /**
   * Omitted while the decision is only being read — the wizard shows the same
   * verdict on its eligibility step and again on its confirm step, and only the
   * second one acts.
   */
  onCreate?: () => void;
  pending?: boolean;
  /** Set when the caller may not create orders at all — a capability answer. */
  disabledReason?: string;
  className?: string;
}) {
  const failing = firstFailing(result.checks);

  // `blocking` is read first. Under the contract's own derivation a blocking
  // decision is always ineligible, so this changes nothing the server can
  // actually send — but if the two ever disagreed, offering a button the API
  // will refuse is the worse of the two mistakes.
  if (result.blocking) {
    return (
      <div
        className={cn(
          "rounded-xl border border-danger/30 bg-danger/5 p-5",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <ShieldOff className="size-5 text-danger" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight text-danger">
              CANNOT PRODUCE
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This run is refused. It cannot be created until the failure below
              is resolved.
            </p>

            {failing && (
              <div className="mt-4 rounded-lg border border-danger/30 bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-danger">
                  What failed
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {failing.message}
                </p>
                {failing.remedy?.href ? (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-wide text-faint">
                      Next step
                    </p>
                    <RemedyLink remedy={failing.remedy} className="mt-1 text-sm" />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No remedy link was supplied with this check.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DecisionFootnote result={result} className="mt-4" />
      </div>
    );
  }

  if (result.eligible) {
    return (
      <div
        className={cn(
          "rounded-xl border border-success/30 bg-success/5 p-5",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-5 text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight text-success">
              READY TO PRODUCE
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every check the server ran either passed or does not apply. Any
              warnings above are recorded, not blocking.
            </p>
          </div>
        </div>

        {onCreate && (
          <CreateAction
            label="Create Production Order"
            onCreate={onCreate}
            pending={pending}
            disabledReason={disabledReason}
            className="mt-4"
          />
        )}
        <DecisionFootnote result={result} className="mt-4" />
      </div>
    );
  }

  // Third state: ineligible, but not blocking. The run is allowed.
  return (
    <div
      className={cn(
        "rounded-xl border border-warning/50 bg-warning/10 p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
          <AlertTriangle className="size-5 text-warning-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-warning-foreground">
            ALLOWED — WITH A COMPLIANCE FAILURE
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-warning-foreground/90">
            You may create this production order. Enforcement is{" "}
            <span className="font-semibold">
              {enforcementLabel(result.enforcementMode)}
            </span>
            , so the platform does not stop the run — but it did not pass, and
            the failure will be recorded as a compliance finding against the
            order.
          </p>

          {failing && (
            <div className="mt-4 rounded-lg border border-warning/50 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-warning-foreground">
                What did not pass
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {failing.message}
              </p>
              {failing.remedy?.href && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-faint">
                    How to put it right
                  </p>
                  <RemedyLink remedy={failing.remedy} className="mt-1 text-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {onCreate && (
        <CreateAction
          label="Create Production Order"
          note="The order will be created and the failure above recorded against it."
          onCreate={onCreate}
          pending={pending}
          disabledReason={disabledReason}
          className="mt-4"
        />
      )}
      <DecisionFootnote result={result} className="mt-4" />
    </div>
  );
}

function CreateAction({
  label,
  note,
  onCreate,
  pending,
  disabledReason,
  className,
}: {
  label: string;
  note?: string;
  onCreate: () => void;
  pending?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <Button size="lg" onClick={onCreate} disabled={pending || !!disabledReason}>
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {label}
      </Button>
      {disabledReason ? (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      ) : (
        note && <p className="text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

/**
 * What the decision was made from.
 *
 * The licence numbers and category codes the server says it relied on, its
 * ruleset version and the moment it evaluated. This is the audit trail the
 * decision is stored with; showing it means the answer on screen can be matched
 * to the record kept behind it.
 */
export function DecisionFootnote({
  result,
  className,
}: {
  result: EligibilityResult;
  className?: string;
}) {
  const numbers = result.reliedOn?.licenseNumbers ?? [];
  const categories = result.reliedOn?.categoryCodes ?? [];
  const evaluatedAt = result.evaluatedAt ? new Date(result.evaluatedAt) : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-[11px] text-faint",
        className,
      )}
    >
      <span>
        Enforcement{" "}
        <span className="font-mono">{enforcementLabel(result.enforcementMode)}</span>
      </span>
      {result.rulesetVersion && (
        <span>
          Ruleset <span className="font-mono">{result.rulesetVersion}</span>
        </span>
      )}
      {numbers.length > 0 && (
        <span>
          Relied on <span className="font-mono">{numbers.join(", ")}</span>
        </span>
      )}
      {categories.length > 0 && (
        <span>
          Categories <span className="font-mono">{categories.join(", ")}</span>
        </span>
      )}
      {evaluatedAt && !Number.isNaN(evaluatedAt.getTime()) && (
        <span>Evaluated {evaluatedAt.toLocaleString()}</span>
      )}
    </div>
  );
}

/**
 * A refused creation, rendered from the payload the refusal carried.
 *
 * DR-07 WU-9 is not done while a blocked run shows a bare 403 or 409. When the
 * API sends the checks with its refusal this shows them; when it does not, the
 * server's own sentence is shown instead — never the status code alone.
 */
export function RefusalPanel({
  result,
  message,
  className,
}: {
  result: EligibilityResult | null;
  message: string;
  className?: string;
}) {
  const failing = firstFailing(result?.checks);

  return (
    <div
      className={cn("rounded-xl border border-danger/30 bg-danger/5", className)}
    >
      <div className="flex items-start gap-3 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
          <ShieldOff className="size-5 text-danger" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-danger">
            The order was refused
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{message}</p>

          {failing?.remedy?.href && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-faint">
                Next step
              </p>
              <RemedyLink remedy={failing.remedy} className="mt-1 text-sm" />
            </div>
          )}
        </div>
      </div>

      {result && result.checks.length > 0 && (
        <div className="border-t border-danger/20 bg-card">
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            The checks behind the refusal
          </p>
          <EligibilityChecklist
            checks={result.checks}
            emphasise={failing?.code}
            className="pb-1"
          />
          <DecisionFootnote result={result} className="mx-4 mb-4" />
        </div>
      )}
    </div>
  );
}
