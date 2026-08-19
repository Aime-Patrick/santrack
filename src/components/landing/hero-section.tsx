"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DashboardMockup } from "./dashboard-mockup";
import { FeaturesStrip } from "./features-strip";

export function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#0057b8] pt-20 sm:pt-24 pb-16 lg:pb-20">
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#0057b8]/95 via-[#0068d6]/75 via-50% to-transparent" />

          {/* Rwanda FLAG GREEN — bottom tint from hills */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a7a35]/60 via-[#1a7a35]/15 via-25% to-transparent" />
        </div>

        {/* Rwanda FLAG YELLOW — bold diagonal wedge, bottom-right */}
        <svg
          viewBox="0 -100 500 500"
          preserveAspectRatio="xMaxYMax meet"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 z-1 w-[80%] h-[40%]"
        >
          <defs>
            <linearGradient id="yellowWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#fac600" stopOpacity="0" />
              <stop offset="35%"  stopColor="#fac600" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fac600" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M0 450 C180 340 360 210 510 105 C620 30 740 5 900 0 L900 450 Z"
            fill="url(#yellowWave)"
          />
        </svg>

        {/* ── Rwandan Sun — Top Right, large & clear ── */}
        <div className="pointer-events-none absolute top-[60px] right-3 sm:top-[55px] sm:right-8 lg:top-[52px] lg:right-12 xl:right-16 z-10">
          <div className="relative size-32 sm:size-40 lg:size-48 xl:size-52 drop-shadow-[0_6px_32px_rgba(250,198,0,0.5)]">
            <Image
              src="/images/rwanda_detail.png"
              alt="Rwanda Sun"
              fill
              priority
              sizes="(max-width: 768px) 150px, 210px"
              aria-hidden="true"
              className="object-contain"
            />
          </div>
        </div>

        {/* ── Hero Content ── */}
        <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-4 items-center">

            {/* Left — Copy */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-3 sm:gap-4">
              {/* Kicker */}
              <div className="inline-flex items-center gap-2.5 w-fit">
                <span className="w-7 sm:w-8 h-[3px] bg-[#fac600] rounded-full" />
                <span className="text-[#fac600] text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase">
                  WELCOME TO SAN TRACK
                </span>
              </div>

              {/* Headline — 2 lines at desktop */}
              <h1 className="text-[26px] sm:text-[32px] lg:text-[34px] xl:text-[40px] font-extrabold text-white leading-[1.14] tracking-tight drop-shadow-lg">
                The All-in-One Management
                <br />Platform for Modern Businesses
              </h1>

              {/* Subtitle */}
              <p className="text-[12.5px] sm:text-[13.5px] text-white/90 leading-snug max-w-[400px] font-normal">
                From industry to final consumption, SAN TRACK empowers your operations
                with traceability, inventory, manufacturing, logistics, finance, HR and more.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-10 sm:h-11 bg-[#fac600] hover:bg-[#e0aa00] text-[#0a2540] font-bold text-[13.5px] sm:text-[14px] px-5 sm:px-7 rounded-lg shadow-lg gap-2 cursor-pointer transition-all"
                  >
                    Request a Demo <ArrowRight className="size-4 stroke-[2.5]" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-10 sm:h-11 border border-white/75 text-white hover:bg-white/15 hover:border-white font-bold text-[13.5px] sm:text-[14px] px-5 sm:px-7 rounded-lg gap-2 bg-white/10 backdrop-blur-sm cursor-pointer transition-all"
                  >
                    Explore Features <ArrowRight className="size-4 stroke-[2.5]" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — Dashboard Devices Mockup */}
            <div className="lg:col-span-6 xl:col-span-7 flex items-center justify-center lg:justify-end">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip — overlaps hero bottom edge ── */}
      <div
        id="features"
        className="relative z-30 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 lg:-mt-12 pb-6"
      >
        <FeaturesStrip />
      </div>
    </>
  );
}
