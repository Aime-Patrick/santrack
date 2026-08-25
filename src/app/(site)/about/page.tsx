"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  QrCode,
  Layers,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ScanLine,
  Truck,
  Sparkles,
  Lock,
  Globe2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";

export default function AboutPage() {
  return (
    <div className="pb-20 overflow-hidden">
      {/* ── Hero Section ── */}
      <PageHeroHeader
        kicker="ABOUT SAN TRACK"
        title="Protecting Consumer Health & Powering Rwanda's Industrial Economy"
        description="SANTRACK is Rwanda's digital serialization and anti-counterfeiting platform. We connect manufacturers, supply chains, regulatory bodies, and everyday consumers into a single transparent ecosystem."
        actions={
          <>
            <Link href="/verify">
              <Button size="lg" className="bg-[#fad201] hover:bg-yellow-400 text-slate-950 font-bold rounded-full px-6 shadow-sm">
                <ScanLine className="mr-2 size-4" /> Verify a Product
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-6 font-semibold border-white/40 text-white hover:bg-white/10 hover:text-white">
                Contact Our Team
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
              <span className="text-xs font-bold uppercase tracking-widest text-rwanda-blue">Our Mission</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Eliminate Counterfeits, Ensure Safety, and Enable Global Trade
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                In East Africa, counterfeit goods pose a severe threat to public health, consumer trust, and economic growth. From adulterated food &amp; beverages to fake pharmaceuticals and substandard building materials, untraced goods harm everyone.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                SANTRACK equips every legitimate Rwandan manufacturer with **GS1 Digital Link barcodes** and cryptographic unique QR serials. Each bottle, carton, and pallet is digitally stamped, creating an unbroken chain of custody from the production line to the retail shelf.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-2xl font-black text-rwanda-blue font-mono">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Serialization Accuracy</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-2xl font-black text-emerald-600 font-mono">&lt; 1 Sec</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Consumer Verification</div>
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
                      <h3 className="font-bold text-slate-900 text-sm">GS1 Standard Serialization</h3>
                      <p className="text-xs text-slate-500">Universal compatibility with international supply chains and retail tills</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                      <FileCheck2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Rwanda FDA &amp; RSB Compliance</h3>
                      <p className="text-xs text-slate-500">Instant batch compliance auditing, expiry control, and targeted recall execution</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                      <Lock className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Tamper-Proof Anti-Counterfeit</h3>
                      <p className="text-xs text-slate-500">Clone detection algorithms that alert operators when duplicate barcodes are scanned</p>
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
            <span className="text-xs font-bold uppercase tracking-widest text-rwanda-blue">The Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How SANTRACK Traceability Works
            </h2>
            <p className="text-sm text-slate-600">
              An unbroken, transparent digital thread from raw materials to the consumer&apos;s hands.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs space-y-3 relative">
              <span className="flex size-8 items-center justify-center rounded-full bg-rwanda-blue text-white text-xs font-black">1</span>
              <h3 className="font-bold text-slate-900 text-base">Batch &amp; Code Minting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manufacturer creates a production batch and generates unique GS1 QR codes linked to the product SKU, plant, and expiry date.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs space-y-3 relative">
              <span className="flex size-8 items-center justify-center rounded-full bg-rwanda-blue text-white text-xs font-black">2</span>
              <h3 className="font-bold text-slate-900 text-base">Label Printing &amp; Packing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unique serial identities are printed on packaging. Cartons and pallets aggregate individual bottle codes into hierarchical containers.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs space-y-3 relative">
              <span className="flex size-8 items-center justify-center rounded-full bg-rwanda-blue text-white text-xs font-black">3</span>
              <h3 className="font-bold text-slate-900 text-base">Warehouse &amp; Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Distributors and logistics operators scan shipments at every handover point, creating an unforgeable custody trail.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs space-y-3 relative">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">4</span>
              <h3 className="font-bold text-slate-900 text-base">Consumer Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Any shopper points their phone camera at the QR code to instantly verify product genuineness, expiry date, and Rwanda standards approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to action ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-rwanda-blue to-blue-900 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to Protect Your Brand?</h2>
              <p className="text-sm text-blue-100 max-w-lg">
                Join Rwandan industry leaders in adopting national GS1 product serialization and regulatory traceability.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/register">
                <Button size="lg" className="bg-white text-rwanda-blue hover:bg-slate-100 font-bold rounded-full px-6 shadow-md">
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 font-semibold rounded-full px-5">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
