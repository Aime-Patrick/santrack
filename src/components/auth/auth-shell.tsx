import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SanTrackBrand, SanTrackLogoMark } from "@/components/auth/san-track-logo";

/**
 * Rwandan Flag Wave Ribbon — uses the processed ribbon-full.png asset.
 * The image has a solid green fill all the way to the bottom edge,
 * with the natural blue/yellow wave visible above it.
 */
export function RwandaWave() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 w-full z-20">
      <div className="relative w-full" style={{ aspectRatio: "1600/560" }}>
        <Image
          src="/images/ribbon-full.png"
          alt="Rwandan flag ribbon wave"
          fill
          priority
          sizes="50vw"
          className="object-fill object-bottom drop-shadow-[0_-8px_24px_rgba(0,0,0,0.35)]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * Shared split-screen shell for auth flows:
 * Left: Dynamic, responsive Brand Panel with landscape, 24-ray sun, typography, and official curved flag wave.
 * Right: Clean, elevated Form container with Imigongo background.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen grid lg:grid-cols-12 bg-slate-50 overflow-hidden">
      {/* Visual Brand Panel */}
      <section className="relative hidden lg:col-span-6 xl:col-span-6 lg:flex flex-col justify-between overflow-hidden select-none bg-[#004d9c]">
        {/* Scenic Rwanda Landscape Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/rwanda-landscape.jpg"
            alt="Scenic Rwandan Hills Landscape"
            fill
            priority
            sizes="50vw"
            className="object-cover object-bottom scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#004d9c] via-[#0062c2]/90 via-35% via-[#0074db]/60 via-55% to-transparent to-75%" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>

        {/* Official Rwandan 24-Ray Golden Sun (Top-Right) */}
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

        {/* Content Container */}
        <div className="relative z-10 w-full mt-28 pl-10 xl:pl-16 2xl:pl-20 pr-8 pt-16 xl:pt-24">
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
      </section>

      {/* Form Panel */}
      <section className="col-span-12 lg:col-span-6 xl:col-span-6 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-hidden min-h-0 bg-[#f8fafc]">
        {/* Imigongo background pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05]"
          style={{
            backgroundImage: "url('/images/imigongo2.png')",
            backgroundSize: "160px auto",
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
            transform: "rotate(45deg) scale(2)",
            transformOrigin: "center center",
          }}
          aria-hidden="true"
        />

        {/* Mobile Logo — matches landing nav (emblem only) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-5 flex flex-col items-center gap-2 lg:hidden shrink-0 relative z-10"
        >
          <SanTrackLogoMark className="size-12" />
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px] z-10 min-h-0 overflow-y-auto relative"
        >
          {children}
        </motion.div>
      </section>
    </main>
  );
}
