"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { RwandaWave } from "@/components/auth/auth-shell";
import { SanTrackBrand } from "@/components/auth/san-track-logo";

// Lazy-load the heavy form so the brand panel renders instantly
const OnboardingForm = dynamic(
  () => import("@/components/auth/onboarding-form").then((m) => m.OnboardingForm),
  { ssr: false },
);

export default function OnboardingPage() {
  const [brandVisible, setBrandVisible] = useState(true);

  const handleFormStart = useCallback(() => {
    setBrandVisible(false);
  }, []);

  return (
    // The outermost container is the scroll root — overflow-hidden keeps
    // the exiting brand panel from triggering a scrollbar during the slide
    <main className="h-screen flex overflow-hidden">

      {/* ── Brand panel ── */}
      <AnimatePresence initial={false}>
        {brandVisible && (
          <motion.section
            key="brand"
            initial={false}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0, 0.18, 1] }}
            className="relative hidden lg:flex flex-col justify-between overflow-hidden select-none bg-[#004d9c]"
            style={{ width: "50%", flexShrink: 0 }}
          >
            {/* Landscape photo */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/rwanda-landscape.jpg"
                alt="Scenic Rwandan Hills Landscape"
                fill
                priority
                sizes="50vw"
                className="object-cover object-bottom"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#004d9c] via-[#0062c2]/90 via-35% via-[#0074db]/60 via-55% to-transparent to-75%" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {/* 24-Ray Golden Sun */}
            <div className="absolute top-5 right-5 xl:top-8 xl:right-8 z-10">
              <div className="relative size-20 xl:size-28 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                <Image
                  src="/images/rwanda_detail.png"
                  alt="Official Rwandan Flag 24-Ray Sun"
                  fill
                  priority
                  sizes="112px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Text content */}
            <div className="relative z-10 mt-28 pl-10 xl:pl-16 pr-8 pt-16 xl:pt-24">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <SanTrackBrand theme="dark" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 xl:mt-12 max-w-sm"
              >
                <p className="text-sm xl:text-[15px] font-normal tracking-wide text-white drop-shadow-md">
                  Smart. Accurate. Networked.
                </p>
                <p className="mt-1 text-sm xl:text-[15px] font-normal tracking-wide text-white drop-shadow-md">
                  Powering Rwanda&apos;s Industries.
                </p>
              </motion.div>
            </div>

            <RwandaWave />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Form panel ─────────────────────────────────────────────────────────
          flex-1 means it naturally fills remaining width.
          The imigongo is a true full-cover background on the section itself
          so it never scrolls and is never clipped by a child transform.
      ── */}
      <section
        className="flex-1 relative flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden min-w-0"
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage: "url('/images/imigongo2.png')",
          backgroundSize: "200px auto",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
          backgroundAttachment: "local",  // scrolls with content on mobile, fine on desktop
        }}
      >
        {/* Tint layer so the pattern sits at the right opacity */}
        <div className="absolute inset-0 bg-[#f8fafc]/94 pointer-events-none" aria-hidden="true" />

        {/* Mobile logo */}
        <div className="relative z-10 mb-5 flex flex-col items-center gap-2 lg:hidden shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo-symbol.png" alt="SANTRACK" width={36} height={36} className="size-9" />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-extrabold tracking-tight text-rwanda-blue">SAN</span>
                <span className="text-[17px] font-extrabold tracking-tight text-rwanda-yellow">TRACK</span>
              </div>
              <span className="text-[7px] font-bold tracking-[0.18em] text-slate-400 uppercase">
                Product Traceability &amp; GS1 Rwanda
              </span>
            </div>
          </Link>
        </div>

        {/* Back to home — desktop */}
        <Link
          href="/"
          className="hidden lg:flex absolute top-5 left-6 items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors z-10"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>

        {/* Form container — animates maxWidth from 520 → 720px after brand exits */}
        <motion.div
          className="relative z-10 w-full px-4 sm:px-8 py-8 lg:py-6"
          animate={{ maxWidth: brandVisible ? 520 : 760 }}
          transition={{ duration: 0.55, ease: [0.32, 0, 0.18, 1] }}
        >
          <OnboardingForm onStart={handleFormStart} />
        </motion.div>
      </section>
    </main>
  );
}
