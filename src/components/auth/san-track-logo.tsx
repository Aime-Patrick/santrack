import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SAN TRACK Emblem Logo Mark
 * Faithfully matches the ribbon swirl with white inner motif and Rwanda colors (Blue, Yellow, Green).
 */
export function SanTrackLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-14 shrink-0 drop-shadow-md", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Sky Blue Gradient */}
        <linearGradient id="stkBlue" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0080c8" />
          <stop offset="100%" stopColor="#026aa7" />
        </linearGradient>

        {/* Golden Yellow Gradient */}
        <linearGradient id="stkYellow" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facb2d" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        {/* Forest Green Gradient */}
        <linearGradient id="stkGreen" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#00953c" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="stkShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#stkShadow)">
        {/* Bottom Green Ribbon Base Swirl */}
        <path
          d="M 22,86 C 14,72 20,52 38,46 C 50,42 62,50 62,64 C 62,78 48,88 32,88 C 22,88 16,82 22,86 Z"
          fill="url(#stkGreen)"
        />

        {/* Bottom Yellow Ribbon Under-Accent */}
        <path
          d="M 18,92 C 26,98 42,96 52,90 C 44,92 30,92 22,86 C 18,88 16,90 18,92 Z"
          fill="url(#stkYellow)"
        />

        {/* Middle Yellow Ribbon Loop */}
        <path
          d="M 20,70 C 18,52 34,36 50,34 C 66,32 78,44 76,58 C 74,70 60,78 44,78 C 30,78 20,76 20,70 Z"
          fill="url(#stkYellow)"
        />

        {/* Top Blue Ribbon Crest */}
        <path
          d="M 32,16 C 52,12 74,22 76,42 C 78,58 64,72 48,74 C 36,76 26,72 26,66 C 26,60 38,58 52,52 C 64,46 68,34 58,24 C 50,16 38,16 32,16 Z"
          fill="url(#stkBlue)"
        />

        {/* Inner White Stylized Motif (Nestled in the Blue loop) */}
        <path
          d="M 42,26 C 48,22 62,28 62,38 C 62,46 54,52 46,54 C 38,56 36,48 40,40 C 44,32 40,28 42,26 Z"
          fill="#ffffff"
        />
        {/* Subtle eye / inner accent in the white shape */}
        <circle cx="50" cy="34" r="2.5" fill="#0080c8" />
      </g>
    </svg>
  );
}

/**
 * SAN TRACK Full Brand Header (Logo + San Track Title + Subtitle)
 */
export function SanTrackBrand({
  theme = "dark",
  className,
}: {
  theme?: "dark" | "light";
  className?: string;
}) {
  const isDark = theme === "dark";

  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <SanTrackLogoMark className="size-16" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={cn(
              "text-6xl font-extrabold tracking-tight",
              isDark ? "text-white" : "text-rwanda-blue",
            )}
          >
            SAN
          </span>
          <span className="text-6xl font-extrabold tracking-tight text-rwanda-yellow">
            TRACK
          </span>
        </div>
        <span
          className={cn(
            "text-[11px] font-bold tracking-[0.22em] uppercase mt-1.5",
            isDark ? "text-white" : "text-slate-600",
          )}
        >
          INDUSTRY MANAGEMENT SYSTEM
        </span>
      </div>
    </div>
  );
}

/** Compact mark inside auth cards on small screens (desktop uses the split brand panel). */
export function AuthCardBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("mb-4 flex items-center justify-center gap-2 lg:hidden", className)}
    >
      <Image src="/images/logo-symbol.png" alt="SANTRACK" width={32} height={32} className="size-8" />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-extrabold tracking-tight text-rwanda-blue">SAN</span>
          <span className="text-[15px] font-extrabold tracking-tight text-rwanda-yellow">TRACK</span>
        </div>
        <span className="text-[6px] font-bold tracking-[0.18em] text-slate-400 uppercase">
          Product Traceability &amp; GS1 Rwanda
        </span>
      </div>
    </Link>
  );
}

/**
 * Official Google 'G' Icon
 */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 shrink-0", className)} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Official Microsoft Icon (4-color square)
 */
export function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 shrink-0", className)} aria-hidden="true">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}
