"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Tag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  QrCode,
  FileCheck2,
  Boxes,
  Bell,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";

interface UpdatePost {
  id: string;
  title: string;
  excerpt: string;
  category: "Release" | "Regulatory" | "Industry News" | "Standard";
  date: string;
  readTime: string;
  author: string;
  badgeColor: string;
}

const POSTS: UpdatePost[] = [
  {
    id: "gs1-digital-link-rollout",
    title: "GS1 Digital Link 2D Barcode Serialization Standards Live in Rwanda",
    excerpt:
      "SANTRACK rolls out official GS1 Digital Link compliant QR serialization, enabling products to be read by both standard retail POS supermarket tills and consumer smartphones.",
    category: "Standard",
    date: "August 20, 2026",
    readTime: "3 min read",
    author: "SANTRACK Engineering",
    badgeColor: "bg-blue-100 text-rwanda-blue border-blue-200",
  },
  {
    id: "fda-audit-integration",
    title: "Rwanda FDA & RSB Real-Time Compliance Audit Integration",
    excerpt:
      "Regulators can now conduct instant digital audits of manufacturing batches, expiration timelines, and raw material provenance without requesting paper records.",
    category: "Regulatory",
    date: "August 14, 2026",
    readTime: "4 min read",
    author: "Compliance Directorate",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "mobile-consumer-scanner",
    title: "Anti-Counterfeiting Mobile Scanner Upgrade for Consumer Protection",
    excerpt:
      "The public verification engine now supports high-speed camera scanning with instant cryptographic token verification and duplicate scan clone detection.",
    category: "Release",
    date: "August 8, 2026",
    readTime: "2 min read",
    author: "Product Team",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "opening-stock-fast-track",
    title: "Opening Stock Adoption: Fast-Track Inventory Onboarding for Distributors",
    excerpt:
      "Wholesalers and distributors can now onboard legacy GS1 barcodes and existing physical inventory directly in bulk mode with high-throughput scanner support.",
    category: "Release",
    date: "July 28, 2026",
    readTime: "3 min read",
    author: "Supply Chain Solutions",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "cold-chain-batch-recalls",
    title: "Targeted Batch Recall Protocol Activated for Food & Beverage Plants",
    excerpt:
      "New protocol allows factories to execute single-lot quarantine across the entire retail network in under 60 seconds, preventing mass destruction of unaffected batches.",
    category: "Industry News",
    date: "July 15, 2026",
    readTime: "5 min read",
    author: "Standards Advisory",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
  },
];

const CATEGORIES = ["All", "Release", "Regulatory", "Standard", "Industry News"] as const;

export default function UpdatesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filteredPosts = POSTS.filter((post) => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <PageHeroHeader
        kicker="NEWS & ANNOUNCEMENTS"
        title="News, Releases & Standards Updates"
        description="Stay up to date with product serialization releases, GS1 regulatory milestones, and traceability insights across Rwanda."
      />

      {/* ── Filter Bar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeCategory === cat
                    ? "bg-rwanda-blue text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder="Search updates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* ── Posts Grid ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {filteredPosts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <p className="text-base font-semibold">No updates found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="border-border/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${post.badgeColor}`}>
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-rwanda-blue transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>{post.date}</span>
                    </div>
                    <span className="font-medium text-slate-700">{post.author}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
