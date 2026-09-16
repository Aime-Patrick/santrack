"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type TrustSealTone = "success" | "info" | "warning" | "danger" | "neutral";

const TONE_RING: Record<TrustSealTone, string> = {
  success: "ring-success/70",
  info: "ring-primary/70",
  warning: "ring-warning/80",
  danger: "ring-danger/70",
  neutral: "ring-primary/40",
};

const TONE_PULSE: Record<TrustSealTone, string> = {
  success: "border-success",
  info: "border-primary",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-primary",
};

/**
 * SanTrack Trust Seal — official circular logo (QR finders + Rwanda sun).
 *
 * Uses the real brand asset with a fade-in. Status tone is a soft ring around
 * the mark. Sized so ring/pulse stay inside the layout box and nothing clips.
 */
export function TrustSeal({
  tone = "neutral",
  size = "lg",
  animate = false,
  label,
  className,
  surface = "light",
}: {
  tone?: TrustSealTone;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  /** Optional micro-caption under the seal (e.g. serial). */
  label?: string;
  className?: string;
  /** Light = default card pages; dark = blue verify entry. */
  surface?: "light" | "dark";
}) {
  const dim =
    size === "sm"
      ? "size-11 sm:size-14"
      : size === "md"
        ? "size-16 sm:size-20"
        : size === "xl"
          ? "size-28 sm:size-36"
          : "size-20 sm:size-28";
  const px = size === "sm" ? 56 : size === "md" ? 80 : size === "xl" ? 144 : 112;

  return (
    <div className={cn("flex w-full max-w-full flex-col items-center gap-2", className)}>
      {/* Outer pad keeps ring-offset + pulse inside the flow (no horizontal clip). */}
      <div
        className={cn(
          "relative shrink-0 p-2",
          animate &&
            "motion-safe:animate-[trust-seal-in_0.7s_cubic-bezier(0.22,1,0.36,1)_both]",
        )}
        aria-hidden={!label}
        role={label ? undefined : "img"}
        aria-label={label ? undefined : "SanTrack trust seal"}
      >
        <div className={cn("relative", dim)}>
          <div
            className={cn(
              "relative size-full overflow-hidden rounded-full ring-2",
              surface === "dark"
                ? "bg-white ring-offset-2 ring-offset-[#0557b0]"
                : "bg-card ring-offset-2 ring-offset-background",
              TONE_RING[tone],
            )}
          >
            <Image
              src="/images/logo-symbol.png"
              alt=""
              width={px}
              height={px}
              priority={animate || size === "xl" || size === "lg"}
              className="size-full object-contain p-1"
            />
          </div>

          {animate ? (
            <span
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full border-2 opacity-0",
                TONE_PULSE[tone],
                "motion-safe:animate-[trust-seal-ring_1.2s_ease-out_0.2s_both]",
              )}
            />
          ) : null}
        </div>
      </div>

      {label ? (
        <p className="w-full max-w-[min(100%,18rem)] break-all px-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}
