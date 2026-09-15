import type { ComponentType } from "react";
import { Box, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanTarget = "unit" | "package" | "either";

/**
 * One-glance reminder: bottle QR vs box/pallet QR.
 * Use above every scan box so operators always know which mark to aim at.
 */
export function ScanTargetHint({
  expect,
  className,
}: {
  expect: ScanTarget;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs sm:grid-cols-2",
        className,
      )}
    >
      <HintCard
        active={expect === "unit" || expect === "either"}
        preferred={expect === "unit"}
        icon={Box}
        title="Unit QR"
        body="On the bottle / pack itself. One product, forever."
      />
      <HintCard
        active={expect === "package" || expect === "either"}
        preferred={expect === "package"}
        icon={Package}
        title="Package QR"
        body="On the box, carton, or pallet. Moves many units at once."
      />
    </div>
  );
}

function HintCard({
  active,
  preferred,
  icon: Icon,
  title,
  body,
}: {
  active: boolean;
  preferred: boolean;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-2.5 py-2",
        preferred
          ? "border-primary/40 bg-primary/5 text-foreground"
          : active
            ? "border-border bg-card text-foreground"
            : "border-transparent bg-transparent text-faint opacity-60",
      )}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <Icon className={cn("size-3.5", preferred ? "text-primary" : "text-muted-foreground")} />
        {title}
        {preferred && (
          <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Scan this
          </span>
        )}
      </div>
      <p className="mt-1 leading-snug text-muted-foreground">{body}</p>
    </div>
  );
}
