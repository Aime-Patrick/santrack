"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  HelpCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const t = useTranslations("contact");

  const FAQS = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [industry, setIndustry] = useState("Food & Beverage");
  const [industryOther, setIndustryOther] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(t("requiredFields"));
      return;
    }
    if (industry === "Other" && !industryOther.trim()) {
      toast.error(t("requiredFields"));
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(t("successTitle"), {
        description: t("successDesc"),
      });
      setName("");
      setEmail("");
      setPhone("");
      setOrganization("");
      setIndustry("Food & Beverage");
      setIndustryOther("");
      setMessage("");
    }, 800);
  };

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <PageHeroHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
      />

      {/* ── Main Content: Form & Direct Info ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">{t("formTitle")}</h2>
                  <p className="text-xs text-slate-500 pb-2">{t("formSubtitle")}</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium">{t("fieldName")} *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Jean Paul Habimana"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">{t("fieldEmail")} *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jean@company.rw"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium">{t("fieldPhone")}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+250 788 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="org" className="text-xs font-medium">{t("fieldOrg")}</Label>
                      <Input
                        id="org"
                        placeholder="e.g. Inyange Industries"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="industry" className="text-xs font-medium">{t("fieldIndustry")}</Label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value);
                        if (e.target.value !== "Other") setIndustryOther("");
                      }}
                      className="w-full h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Food & Beverage">{t("industryFood")}</option>
                      <option value="Pharmaceuticals">{t("industryPharma")}</option>
                      <option value="Agriculture">{t("industryAgriculture")}</option>
                      <option value="Cosmetics & Personal Care">{t("industryCosmetics")}</option>
                      <option value="Manufacturing & Hardware">{t("industryManufacturing")}</option>
                      <option value="Government & Regulatory">{t("industryGov")}</option>
                      <option value="Other">{t("industryOther")}</option>
                    </select>
                  </div>

                  {industry === "Other" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="industryOther" className="text-xs font-medium">
                        {t("industryOther")} *
                      </Label>
                      <Input
                        id="industryOther"
                        value={industryOther}
                        onChange={(e) => setIndustryOther(e.target.value)}
                        placeholder="e.g. Packaging, industrial chemicals…"
                        className="h-10 text-xs"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-medium">{t("fieldMessage")} *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder={t("msgPlaceholder")}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full h-11 bg-rwanda-blue hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> {t("submitting")}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" /> {t("sendMessage")}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right: Contact Details & Quick FAQs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <h3 className="font-bold text-slate-900 text-base">{t("officeTitle")}</h3>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{t("officeAddress")}</span>
                    <span>KG 548 St, Kigali, Rwanda</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{t("emailSupportLabel")}</span>
                    <a href="mailto:support@santrack.rw" className="text-rwanda-blue underline">support@santrack.rw</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{t("directLineLabel")}</span>
                    <span>+250 788 123 456 / +250 252 500 000</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{t("hoursLabel")}</span>
                    <span>{t("hoursValue")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Interactive FAQ List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="size-4 text-rwanda-blue" />
                <span>{t("faqTitle")}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="py-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between text-left font-semibold text-slate-800 hover:text-rwanda-blue transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={cn("size-3.5 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-slate-600 leading-relaxed text-xs">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
