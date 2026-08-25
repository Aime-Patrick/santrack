"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroHeaderProps {
  kicker?: string;
  kickerIcon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  centered?: boolean;
}

export function PageHeroHeader({
  kicker,
  kickerIcon,
  title,
  description,
  actions,
  children,
  className,
  centered = false,
}: PageHeroHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[#0057b8] pt-24 sm:pt-28 pb-14 sm:pb-18 lg:pb-20",
        className,
      )}
    >
      {/* ── Background: Kigali Landscape Photo ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/rwanda-landscape.jpg"
            alt="Rwanda Landscape"
            fill
            priority
            sizes="100vw"
            aria-hidden="true"
            className="object-cover object-[60%_55%] opacity-60"
          />
        </div>

        {/* Rwanda FLAG BLUE — left wash for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0057b8]/95 via-[#0068d6]/80 via-50% to-[#0057b8]/60" />

        {/* Rwanda FLAG GREEN — bottom tint from hills */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a7a35]/65 via-[#1a7a35]/20 via-25% to-transparent" />
      </div>

      {/* Rwanda FLAG YELLOW — bold diagonal wedge, bottom-right */}
      <svg
        viewBox="0 -100 500 500"
        preserveAspectRatio="xMaxYMax meet"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 z-1 w-[80%] h-[40%]"
      >
        <defs>
          <linearGradient
            id="pageHeroYellowWave"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#fac600" stopOpacity="0" />
            <stop offset="35%" stopColor="#fac600" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fac600" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M0 450 C180 340 360 210 510 105 C620 30 740 5 900 0 L900 450 Z"
          fill="url(#pageHeroYellowWave)"
        />
      </svg>

      {/* ── Rwandan Sun — Top Right ── */}
      <div className="pointer-events-none absolute top-[60px] right-3 sm:top-[55px] sm:right-8 lg:top-[52px] lg:right-12 xl:right-16 z-10">
        <div className="relative size-28 sm:size-36 lg:size-44 xl:size-48 drop-shadow-[0_6px_32px_rgba(250,198,0,0.5)] opacity-90">
          <Image
            src="/images/rwanda_detail.png"
            alt="Rwanda Sun"
            fill
            priority
            sizes="(max-width: 768px) 120px, 190px"
            aria-hidden="true"
            className="object-contain"
          />
        </div>
      </div>

      {/* ── Foreground Content ── */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
          {kicker && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "inline-flex items-center gap-2.5 w-fit mb-3",
                centered && "mx-auto",
              )}
            >
              <span className="w-6 sm:w-7 h-[3px] bg-rwanda-yellow rounded-full" />
              {kickerIcon}
              <span className="text-rwanda-yellow text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase">
                {kicker}
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.18] tracking-tight drop-shadow-md">
              {title}
            </h1>
          </motion.div>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                "mt-4 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-2xl font-normal drop-shadow-xs",
                centered && "mx-auto",
              )}
            >
              {description}
            </motion.p>
          )}

          {actions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                "mt-6 flex flex-wrap items-center gap-3",
                centered && "justify-center",
              )}
            >
              {actions}
            </motion.div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
}
