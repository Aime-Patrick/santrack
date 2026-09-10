"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";
import {
  announcementService,
  type AnnouncementCategory,
} from "@/services/announcement.service";

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  RELEASE: "Release",
  REGULATORY: "Regulatory",
  INDUSTRY_NEWS: "Industry News",
  STANDARD: "Standard",
};

const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  STANDARD: "bg-blue-100 text-rwanda-blue border-blue-200",
  REGULATORY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  RELEASE: "bg-amber-100 text-amber-800 border-amber-200",
  INDUSTRY_NEWS: "bg-slate-100 text-slate-800 border-slate-200",
};

const FILTER_CATEGORIES = [
  { key: "ALL", label: "All" },
  { key: "RELEASE", label: "Release" },
  { key: "REGULATORY", label: "Regulatory" },
  { key: "STANDARD", label: "Standard" },
  { key: "INDUSTRY_NEWS", label: "Industry News" },
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UpdatesPage() {
  const t = useTranslations("updates");
  const [activeCategory, setActiveCategory] = useState<"ALL" | AnnouncementCategory>("ALL");
  const [search, setSearch] = useState("");

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementService.list(),
    staleTime: 1000 * 60 * 5, // 5 min — public data, no need to refetch aggressively
  });

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === "ALL" || post.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <PageHeroHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
      />

      {/* ── Filter Bar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeCategory === cat.key
                    ? "bg-rwanda-blue text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* ── Posts Grid ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {isLoading && (
            <div className="col-span-full py-16 flex justify-center text-slate-400">
              <Loader2 className="size-7 animate-spin" />
            </div>
          )}

          {isError && (
            <div className="col-span-full py-16 flex flex-col items-center gap-3 text-slate-400">
              <AlertCircle className="size-8 text-danger" />
              <p className="text-sm font-medium">{t("loadError")}</p>
            </div>
          )}

          {!isLoading && !isError && filteredPosts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <p className="text-base font-semibold">{t("noResults")}</p>
              <p className="text-xs text-slate-400 mt-1">{t("noResultsHint")}</p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="border-border/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${CATEGORY_COLORS[post.category]}`}
                      >
                        {CATEGORY_LABELS[post.category]}
                      </span>
                      {post.readTime && <span>{post.readTime}</span>}
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
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {post.organizationName ?? post.author}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
