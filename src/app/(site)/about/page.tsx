"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  QrCode,
  ScanLine,
  Lock,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="pb-20 overflow-hidden">
      {/* ── Hero Section ── */}
      <PageHeroHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link href="/verify">
              <Button size="lg" className="bg-[#fad201] hover:bg-yellow-400 text-slate-950 font-bold rounded-full px-6 shadow-sm">
                <ScanLine className="mr-2 size-4" /> {t("verifyProduct")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-6 font-semibold border-white/40 text-white hover:bg-white/10 hover:text-white">
                {t("contactTeam")}
              </Button>
            </Link>
          </>
        }
      />

      {/* ── Mission & Vision ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-rwanda-blue">{t("missionKicker")}</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {t("missionTitle")}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {t("missionP1")}
              </p>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {t("missionP2")}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-2xl font-black text-rwanda-blue font-mono">{t("stat1Value")}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">{t("stat1Label")}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{t("stat2Value")}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">{t("stat2Label")}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-rwanda-blue font-bold">
                      <QrCode className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t("feature1Title")}</h3>
                      <p className="text-xs text-slate-500">{t("feature1Desc")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                      <FileCheck2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t("feature2Title")}</h3>
                      <p className="text-xs text-slate-500">{t("feature2Desc")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                      <Lock className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t("feature3Title")}</h3>
                      <p className="text-xs text-slate-500">{t("feature3Desc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works: The 4 Steps ── */}
      <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-rwanda-blue">{t("processKicker")}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("processTitle")}
            </h2>
            <p className="text-sm text-slate-600">{t("processSubtitle")}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {([1, 2, 3, 4] as const).map((step) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: step * 0.08 }}
                className="rounded-2xl border border-white bg-white p-6 shadow-xs space-y-3 relative"
              >
                <span className={`flex size-8 items-center justify-center rounded-full text-white text-xs font-black ${step === 4 ? "bg-emerald-600" : "bg-rwanda-blue"}`}>
                  {step}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{t(`step${step}Title`)}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t(`step${step}Desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to action ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-rwanda-blue to-blue-900 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("ctaTitle")}</h2>
              <p className="text-sm text-blue-100 max-w-lg">{t("ctaSubtitle")}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/register">
                <Button size="lg" className="bg-white text-rwanda-blue hover:bg-slate-100 font-bold rounded-full px-6 shadow-md">
                  {t("ctaGetStarted")}
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 font-semibold rounded-full px-5">
                  {t("ctaBookDemo")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
