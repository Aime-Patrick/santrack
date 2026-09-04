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
                <div className="relative h-10 sm:h-12 w-24 sm:w-28 transition-all duration-300">
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
                <div className="relative h-12 sm:h-14 w-32 sm:w-36 transition-all duration-300">
                  <Image
                    src="/images/rdb.jpg"
                    alt="Rwanda Development Board"
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 3. NIRDA — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-12 sm:h-18 w-15 sm:w-18 transition-all duration-300">
                  <Image
                    src="/images/nirda.png"
                    alt="NIRDA"
                    fill
                    sizes="200px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 4. Bank of Kigali — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300">
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

              {/* 5. Rwanda — wb-large-default */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-28 sm:w-32 transition-all duration-300">
                  <Image
                    src="/images/wb-large-default.webp"
                    alt="Rwanda"
                    fill
                    sizes="140px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 shrink-0" />

              {/* 6. RCA — real image */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="relative h-10 sm:h-12 w-24 sm:w-28 transition-all duration-300">
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

              {/* 7. MINCOM — Coat of Arms + wb-large-default for Rwanda */}
              <div className="flex items-center justify-center px-4 lg:px-5">
                <div className="flex flex-col items-center gap-1 transition-opacity duration-300">
                  <Image
                    src="/images/Coat_of_arms_of_Rwanda.svg"
                    alt="Coat of Arms of Rwanda"
                    width={28}
                    height={28}
                    style={{ width: "auto", height: "auto" }}
                    className="object-contain"
                  />
                  <span className="font-black text-[12px] sm:text-[13px] tracking-widest text-slate-700">
                    MINCOM
                  </span>
                  <span className="text-[6px] sm:text-[7px] text-slate-400 leading-none text-center max-w-[70px]">
                    Ministry of Trade & Industry
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
