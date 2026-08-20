"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function TrustedBySection() {
  return (
    <section className="bg-white border-y border-slate-100 py-5 sm:py-7 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-5 lg:gap-6">
          {/* Left Title */}
          <div className="shrink-0 text-center lg:text-left">
            <p className="text-[11px] sm:text-[12px] font-bold tracking-[0.13em] uppercase text-[#0057b8] max-w-[180px] leading-snug">
              TRUSTED BY INDUSTRIES ACROSS RWANDA AND BEYOND
            </p>
          </div>

          {/* Vertical divider on desktop */}
          <div className="hidden lg:block w-px h-10 bg-slate-200 shrink-0" />

          {/* Logos row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full overflow-x-auto"
          >
            <div className="flex items-center justify-between min-w-[720px] lg:min-w-0 gap-0">

              {/* 1. CIMERWA — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-24 sm:w-28 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <Image
                    src="/images/Cimerwa_logo.png"
                    alt="CIMERWA"
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 2. RDB — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-28 sm:w-32 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <Image
                    src="/images/RDB-1.png"
                    alt="Rwanda Development Board"
                    fill
                    sizes="140px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 3. NIRDA — text/SVG placeholder */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="opacity-50 hover:opacity-70 transition-opacity duration-300 flex flex-col items-center">
                  <span className="font-black text-[15px] sm:text-[17px] tracking-tight text-slate-700">
                    ni<span className="text-slate-900">RDA</span>
                  </span>
                  <span className="text-[6.5px] sm:text-[7.5px] text-slate-400 tracking-tight leading-none text-center max-w-[70px]">
                    National Industrial Research & Dev
                  </span>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 4. Bank of Kigali — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-28 sm:w-32 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <Image
                    src="/images/BK_Logo.png"
                    alt="Bank of Kigali"
                    fill
                    sizes="140px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 5. RwandAir — text/SVG placeholder */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="opacity-50 hover:opacity-70 transition-opacity duration-300 flex flex-col items-center">
                  <span className="font-extrabold text-[14px] sm:text-[16px] italic tracking-tight text-slate-700">
                    RwandAir
                  </span>
                  <span className="text-[6.5px] sm:text-[7.5px] text-slate-400 italic leading-none">
                    Fly the dream of Africa
                  </span>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 6. RCA — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-24 sm:w-28 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <Image
                    src="/images/RCA_logo.png"
                    alt="Rwanda Cooperative Agency"
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 7. MINICOM — text/SVG placeholder */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="opacity-50 hover:opacity-70 transition-opacity duration-300 flex flex-col items-center">
                  <span className="font-black text-[13px] sm:text-[14px] tracking-widest text-slate-700">
                    MINICOM
                  </span>
                  <span className="text-[6.5px] sm:text-[7.5px] text-slate-400 leading-none text-center max-w-[70px]">
                    Ministry of Trade and Industry
                  </span>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* AND MORE */}
              <div className="flex items-center justify-center pl-4 lg:pl-5">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 tracking-wider whitespace-nowrap">
                  AND MORE...
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
