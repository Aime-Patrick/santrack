import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

const CONTACT = {
  address: "KG 548 St, Kigali, Rwanda",
  email: "support@santrack.rw",
  phone: "+250 788 123 456",
};

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "#",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05a4.17 4.17 0 0 1 3.75-2.05c4 0 4.75 2.63 4.75 6.06V21h-4v-5.4c0-1.29-.03-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9V9Z",
  },
  {
    label: "X",
    href: "#",
    path: "M17.53 3H20.5l-6.49 7.42L21.75 21h-5.98l-4.68-6.12L5.72 21H2.75l6.94-7.93L2.25 3h6.13l4.23 5.59L17.53 3Zm-1.04 16.2h1.65L7.6 4.71H5.83L16.49 19.2Z",
  },
  {
    label: "Facebook",
    href: "#",
    path: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.63A22 22 0 0 0 14.28 3.5c-2.4 0-4.03 1.46-4.03 4.15V9.9H7.5V13h2.75v8h3.25Z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07Zm0 3.72a6.12 6.12 0 1 0 0 12.24 6.12 6.12 0 0 0 0-12.24Zm0 10.1a3.98 3.98 0 1 1 0-7.96 3.98 3.98 0 0 1 0 7.96Zm7.79-10.34a1.43 1.43 0 1 1-2.86 0 1.43 1.43 0 0 1 2.86 0Z",
  },
];

export async function FooterSection() {
  const t = await getTranslations("landing.footer");
  const year = new Date().getFullYear();

  const PLATFORM_LINKS = [
    { label: t("links.inventory"), href: "#features" },
    { label: t("links.manufacturing"), href: "#features" },
    { label: t("links.logistics"), href: "#features" },
    { label: t("links.finance"), href: "#features" },
    { label: t("links.payroll"), href: "#features" },
    { label: t("links.traceability"), href: "#features" },
  ];

  const COMPANY_LINKS = [
    { label: t("links.home"), href: "/" },
    { label: t("links.aboutUs"), href: "/about" },
    { label: t("links.updatesNews"), href: "/updates" },
    { label: t("links.verifyProduct"), href: "/verify" },
    { label: t("links.contactSupport"), href: "/contact" },
  ];

  const LEGAL_LINKS = [
    { label: t("privacyPolicy"), href: "#privacy" },
    { label: t("termsOfService"), href: "#terms" },
  ];

  return (
    <footer id="contact" className="relative bg-[#00397a] text-white overflow-hidden">
      {/* Rwanda accent stripe */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#067eda]" />
        <div className="flex-1 bg-[#fac600]" />
        <div className="flex-1 bg-[#00953c]" />
      </div>

      {/* Soft glow decoration */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[#067eda]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-[#00953c]/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <Image src="/images/logo-symbol.png" alt="SANTRACK" width={40} height={40} className="size-10" />
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight text-white">SAN</span>
                  <span className="text-lg font-extrabold tracking-tight text-[#fac600]">TRACK</span>
                </div>
                <span className="text-[7px] font-bold tracking-[0.18em] text-white/50 uppercase">
                  Industry Management
                </span>
              </div>
            </Link>

            <p className="text-lg text-white/70 leading-relaxed max-w-sm">
              {t("tagline")}
            </p>

            <div className="flex items-center gap-2.5">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="size-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/80 hover:bg-[#fac600] hover:border-[#fac600] hover:text-[#00397a] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="lg:col-span-2">
            <h3 className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#fac600] mb-4">
              {t("platform")}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#fac600] mb-4">
              {t("company")}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + CTA */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#fac600]">
              {t("getInTouch")}
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <MapPin className="size-4 mt-0.5 shrink-0 text-[#fac600]" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <Mail className="size-4 mt-0.5 shrink-0 text-[#fac600]" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white transition-colors">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <Phone className="size-4 mt-0.5 shrink-0 text-[#fac600]" />
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {CONTACT.phone}
                </a>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/register">
                <Button size="sm" className="bg-[#fac600] hover:bg-[#e0b200] text-[#00397a] font-semibold px-5 rounded-full gap-2">
                  {t("getStarted")} <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-white/50">
              &copy; {year} SAN TECH Ltd. {t("allRightsReserved")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-xs text-white/50 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
              <p className="text-xs text-white/60">
                {t("developedBy")}{" "}
                <span className="font-semibold text-rwanda-yellow">SAN TECH</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
