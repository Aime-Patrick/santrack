"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();

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
    // Locale is stored in a cookie and read server-side in i18n/request.ts.
    // No URL prefix is used — a full reload picks up the new cookie value.
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.href = pathname;
    setLangOpen(false);
  }

  const NAV_LINKS = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/updates", label: t("updates") },
    { href: "/verify", label: t("verify") },
    { href: "/contact", label: t("contact") },
  ];

  const LANGUAGES = locales.map((code) => ({
    code,
    label: localeNames[code],
  }));

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === `/${locale}`;
    return pathname.startsWith(href) || pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
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

          {/* Desktop Navigation Links — UPPERCASE, font-weight 600 */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[13px] font-[600] uppercase tracking-wider transition-colors relative py-1",
                    active
                      ? "text-rwanda-blue font-bold"
                      : "text-slate-700 hover:text-rwanda-blue"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-rwanda-blue rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-[600] text-slate-600 border border-slate-200 rounded-full hover:border-rwanda-blue hover:text-rwanda-blue transition-colors uppercase tracking-wider"
              >
                <Globe className="size-3.5" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className={cn("size-3 opacity-50 transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-[13px] hover:bg-blue-50 transition-colors text-left",
                        locale === lang.code ? "text-rwanda-blue font-semibold" : "text-slate-600"
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
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-rwanda-blue font-[600] uppercase tracking-wider text-[12px]">
                {t("signIn")}
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="bg-rwanda-blue hover:bg-blue-700 text-white font-[600] uppercase tracking-wider text-[12px] px-4 rounded-full shadow-xs">
                {t("getStarted")}
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-screen pb-4" : "max-h-0"
        )}
      >
        <div className="px-4 pt-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2.5 text-sm font-[600] uppercase tracking-wider rounded-lg transition-colors",
                  active
                    ? "bg-blue-50 text-rwanda-blue font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 px-3">
            <span className="text-xs font-[600] uppercase tracking-wider text-slate-500">{t("language")}:</span>
            <div className="flex gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                    locale === lang.code
                      ? "bg-rwanda-blue text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full font-[600] uppercase tracking-wider text-xs">
                {t("signIn")}
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full bg-rwanda-blue hover:bg-blue-700 text-white font-[600] uppercase tracking-wider text-xs">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Imigongo pattern border */}
      <div className="w-full h-1.5 bg-repeat-x bg-center" style={{ backgroundImage: "url('/images/imigongo2.png')", backgroundSize: "auto 100%" }} />
    </motion.nav>
  );
}
