"use client";

import { cn } from "@/lib/utils";

export type TrustSealTone = "success" | "info" | "warning" | "danger" | "neutral";

const TONE_RING: Record<TrustSealTone, string> = {
  success: "text-success",
  info: "text-primary",
  warning: "text-warning-foreground",
  danger: "text-danger",
  neutral: "text-primary",
};

/**
 * SanTrack Trust Seal — the scannable identity’s visual signature.
 *
 * Not a generic QR icon: Rwanda flag arcs + finder corners + sun core.
 * Used on the public verify certificate and as brand chrome where a
 * permanent unit identity is the subject.
 */
export function TrustSeal({
  tone = "neutral",
  size = "lg",
  animate = false,
  label,
  className,
}: {
  tone?: TrustSealTone;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  /** Optional micro-caption under the seal (e.g. serial). */
  label?: string;
  className?: string;
}) {
  const dim =
    size === "sm" ? "size-14" : size === "md" ? "size-20" : size === "xl" ? "size-36" : "size-28";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative",
          dim,
          animate && "motion-safe:animate-[trust-seal-in_0.7s_cubic-bezier(0.22,1,0.36,1)_both]",
        )}
        aria-hidden={!label}
        role={label ? undefined : "img"}
        aria-label={label ? undefined : "SanTrack trust seal"}
      >
        <svg viewBox="0 0 120 120" className={cn("size-full", TONE_RING[tone])}>
          {/* Outer registry ring */}
          <circle
            cx="60"
            cy="60"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            opacity="0.9"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="2.5 2.2"
            opacity="0.45"
          />

          {/* Rwanda flag arcs */}
          <path
            d="M 18 60 A 42 42 0 0 1 60 18"
            fill="none"
            stroke="#067eda"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 60 18 A 42 42 0 0 1 102 60"
            fill="none"
            stroke="#facb2d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 102 60 A 42 42 0 0 1 60 102"
            fill="none"
            stroke="#00953C"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 60 102 A 42 42 0 0 1 18 60"
            fill="none"
            stroke="#067eda"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* QR finder corners — brand signature */}
          <Finder x={28} y={28} />
          <Finder x={76} y={28} />
          <Finder x={28} y={76} />

          {/* Rwanda sun core */}
          <circle cx="68" cy="72" r="11" fill="#facb2d" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
            const x1 = 68 + Math.cos(a) * 13;
            const y1 = 72 + Math.sin(a) * 13;
            const x2 = 68 + Math.cos(a) * 17.5;
            const y2 = 72 + Math.sin(a) * 17.5;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#facb2d"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="68" cy="72" r="5.5" fill="#fff8e0" />

          {/* Micro identity dots */}
          {[
            [48, 48],
            [54, 52],
            [50, 58],
            [58, 48],
            [44, 54],
            [86, 86],
            [80, 90],
            [90, 80],
          ].map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="3.2"
              height="3.2"
              rx="0.4"
              fill="currentColor"
              opacity="0.7"
            />
          ))}
        </svg>

        {animate ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full border-2 opacity-0",
              tone === "danger"
                ? "border-danger"
                : tone === "warning"
                  ? "border-warning"
                  : tone === "success"
                    ? "border-success"
                    : "border-primary",
              "motion-safe:animate-[trust-seal-ring_1.2s_ease-out_0.2s_both]",
            )}
          />
        ) : null}
      </div>

      {label ? (
        <p className="max-w-[14rem] text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="16"
        height="16"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x={x + 4.5} y={y + 4.5} width="7" height="7" rx="0.8" fill="currentColor" />
    </g>
  );
}
