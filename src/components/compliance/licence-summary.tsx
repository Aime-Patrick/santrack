import { Clock, FileBadge, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LicenceSummary } from "@/services/compliance.service";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/**
 * The licence the server says governs, rendered as the server described it.
 *
 * Nothing here works out whether the licence is valid. `status` and `verdict`
 * arrive decided; the dates are shown because a person reading this screen
 * wants to know when the cover runs out, not so that the browser can compare
 * them to today.
 */
export function LicenceSummaryPanel({
  licence,
  emptyMessage = "No licence on record.",
  className,
}: {
  licence: LicenceSummary | null | undefined;
  emptyMessage?: string;
  className?: string;
}) {
  if (!licence) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <FileBadge className="size-4 text-primary" />
          <span className="font-mono font-medium text-foreground">
            {licence.licenseNumber || "—"}
          </span>
        </span>

        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[13px] font-medium text-muted-foreground">
          {licence.status}
        </span>

        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[13px] font-medium text-muted-foreground">
          {licence.grain === "FACILITY" ? "Site licence" : "Company licence"}
        </span>
      </div>

      {/* Provisional is onboarding grace the platform granted, "not a decision
          any regulator has taken. Shown as its own line", "in its own words",
          because a provisional record presented as a plain pass tells a
          manufacturer they are approved when nobody has looked at them. */}
      {licence.provisional && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-amber-50 px-3 py-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
            <div className="text-xs leading-relaxed text-warning-foreground">
              <span className="font-bold">Provisional is not regulator approval.</span>{" "}
              This is temporary onboarding cover, not a regulatory decision.
              You must obtain a full regulatory licence before this date.
              {licence.expiresOn && (
                <>
                  {" "}
                  Expires{" "}
                  <span className="font-semibold">{formatDate(licence.expiresOn)}</span>.
                </>
              )}
            </div>
          </div>
          <Button size="sm" render={<Link href="/dashboard/licenses?apply=1" />}>
            Apply for Full Licence
          </Button>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
        <Fact label="Verdict" value={licence.verdict} />
        <Fact label="Issued" value={formatDate(licence.issuedOn)} />
        <Fact
          label="Expires"
          value={formatDate(licence.expiresOn)}
          icon={licence.expiresOn ? Clock : undefined}
        />
      </dl>
    </div>
  );
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="text-[13px] uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1 font-medium text-foreground">
        {Icon && <Icon className="size-3 text-faint" />}
        {value}
      </dd>
    </div>
  );
}
