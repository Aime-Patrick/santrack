"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SanTrackLogoMark } from "@/components/auth/san-track-logo";
import { ChevronDown, Menu, X, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(newLocale: Locale) {
    // Remove the current locale prefix from the pathname if present
    let newPath = pathname;
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
        newPath = pathname.slice(`/${loc}`.length) || "/";
        break;
      }
    }
    // Prefix with the new locale (unless it's the default)
    if (newLocale === "en") {
      router.push(newPath);
    } else {
      router.push(`/${newLocale}${newPath === "/" ? "" : newPath}`);
    }
    setLangOpen(false);
  }

  const LANGUAGES = locales.map((code) => ({
    code,
    label: localeNames[code],
  }));

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <SanTrackLogoMark className="size-9" />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-extrabold tracking-tight text-slate-900">SAN</span>
                <span className="text-[17px] font-extrabold tracking-tight text-[#067eda]">TRACK</span>
              </div>
              <span className="text-[7px] font-bold tracking-[0.18em] text-slate-400 uppercase">
                {tNav("industryManagement")}
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {/* Language dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-full hover:border-[#067eda] hover:text-[#067eda] transition-colors"
              >
                <Globe className="size-3.5" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className={cn("size-3 opacity-50 transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 py-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-[13px] hover:bg-blue-50 transition-colors",
                        locale === lang.code ? "text-[#067eda] font-semibold" : "text-slate-600"
                      )}
                    >
                      <span>{lang.label}</span>
                      {locale === lang.code && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/login">
              <Button variant="ghost" size="lg" className="text-slate-700 hover:text-rwanda-blue font-medium">
                {t("login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-rwanda-blue hover:bg-rwanda-yellow text-white font-semibold px-5 rounded-full shadow-sm">
                {t("getStarted")}
              </Button>
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "lg:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-screen" : "max-h-0"
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-2">
          {/* Mobile language selector */}
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
            <Globe className="size-4" />
            <span className="font-medium">{t("language")}:</span>
            <div className="flex gap-1 ml-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                    locale === lang.code
                      ? "bg-[#067eda] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 border-t pt-3">
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">{t("login")}</Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button size="sm" className="w-full bg-[#067eda] hover:bg-[#0569c0] text-white">{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Imigongo pattern border */}
      <div className="w-full h-3 bg-repeat-x bg-center" style={{ backgroundImage: "url('/images/imigongo2.png')", backgroundSize: "auto 100%" }} />
    </motion.nav>
  );
}
