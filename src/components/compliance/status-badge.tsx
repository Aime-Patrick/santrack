import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The four statuses the server sends, and how each one looks.
 *
 * This table maps a decided status onto a colour and a word. It does not
 * decide a status, and there is no path through this file that could: the
 * only input is a string the API already chose.
 *
 * WARN is deliberately not red and not styled like a failure. Under DR-07 D2
 * an in-date provisional licence returns WARN, which means a warning will
 * appear on nearly every production run on the platform — 180 of 182 licences
 * are provisional. A warning that looks like a refusal on 98.9% of runs
 * teaches people to ignore both.
 */
export type AnyStatus = "PASS" | "WARN" | "FAIL" | "NOT_APPLICABLE";

const PRESENTATION: Record<
  AnyStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PASS: {
    label: "Pass",
    className: "border-transparent bg-success text-white",
    icon: CheckCircle2,
  },
  WARN: {
    label: "Warning",
    className: "border-transparent bg-warning-foreground text-white",
    icon: AlertTriangle,
  },
  FAIL: {
    label: "Fail",
    className: "border-transparent bg-danger text-white",
    icon: XCircle,
  },
  NOT_APPLICABLE: {
    label: "Not applicable",
    className: "border-transparent bg-muted-foreground text-white",
    icon: MinusCircle,
  },
};

function presentationFor(status: string | undefined) {
  return PRESENTATION[(status ?? "") as AnyStatus] ?? {
    label: status ?? "Unknown",
    className: "border-transparent bg-muted-foreground text-white",
    icon: MinusCircle,
  };
}

export function StatusBadge({
  status,
  className,
  size = "default",
}: {
  status: string | undefined;
  className?: string;
  size?: "default" | "lg";
}) {
  const { label, className: tone, icon: Icon } = presentationFor(status);

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-semibold",
        size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
        tone,
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-3.5" : "size-3"} />
      {label}
    </span>
  );
}

/** The same four tones, for the border or background of a surrounding panel. */
export function statusSurface(status: string | undefined): string {
  switch (status) {
    case "PASS":
      return "border-success/30 bg-emerald-50";
    case "WARN":
      return "border-warning/50 bg-amber-50";
    case "FAIL":
      return "border-danger/30 bg-red-50";
    default:
      return "border-border bg-muted/30";
  }
}

/** The icon alone, for dense rows. */
export function StatusIcon({
  status,
  className,
}: {
  status: string | undefined;
  className?: string;
}) {
  const { icon: Icon, className: tone, label } = presentationFor(status);
  const colour = tone.split(" ").find((c) => c.startsWith("text-")) ?? "text-muted-foreground";

  return <Icon className={cn("size-4", colour, className)} aria-label={label} />;
}
