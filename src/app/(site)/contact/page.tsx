"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building,
  HelpCircle,
  ShieldCheck,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeroHeader } from "@/components/landing/page-hero-header";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "How do I onboard my factory to SANTRACK?",
    answer:
      "You can register an organization account, submit your business registration and RSB license, and start generating GS1 digital serialization codes in minutes.",
  },
  {
    question: "Can consumers scan with any phone?",
    answer:
      "Yes. Any standard iPhone or Android camera app instantly reads the GS1 QR code and opens the verification certificate in the browser without installing any special app.",
  },
  {
    question: "Does it integrate with Rwanda FDA / RSB?",
    answer:
      "Yes. SANTRACK provides direct audit trail interfaces for regulators to verify product certificates, batch inspection status, and targeted recalls in real time.",
  },
  {
    question: "What hardware is required at the factory?",
    answer:
      "SANTRACK works with any standard thermal label or inkjet/laser printer, as well as USB/Bluetooth barcode scanner guns or mobile tablet cameras.",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [industry, setIndustry] = useState("Food & Beverage");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Thank you for reaching out!", {
        description: "Our compliance and supply chain team will contact you within 24 hours.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setOrganization("");
      setMessage("");
    }, 800);
  };

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <PageHeroHeader
        kicker="CONTACT SAN TRACK"
        title="Contact Our National Traceability Team"
        description="Have questions about GS1 serialization, manufacturer onboarding, or regulatory auditing? We are here to help."
      />

      {/* ── Main Content: Form & Direct Info ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Send an Inquiry or Request a Demo</h2>
                  <p className="text-xs text-slate-500 pb-2">
                    Fill out the form below and an integration specialist will follow up promptly.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium">Your Full Name *</Label>
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
                      <Label htmlFor="email" className="text-xs font-medium">Work Email Address *</Label>
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
                      <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
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
                      <Label htmlFor="org" className="text-xs font-medium">Company / Organization</Label>
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
                    <Label htmlFor="industry" className="text-xs font-medium">Industry Sector</Label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Food & Beverage">Food &amp; Beverage Processing</option>
                      <option value="Pharmaceuticals">Pharmaceuticals &amp; Health</option>
                      <option value="Agriculture">Agriculture &amp; Export Commodities</option>
                      <option value="Cosmetics & Personal Care">Cosmetics &amp; Personal Care</option>
                      <option value="Manufacturing & Hardware">Industrial &amp; Building Materials</option>
                      <option value="Government & Regulatory">Government &amp; Regulatory Inspection</option>
                      <option value="Other">Other Supply Chain</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-medium">Your Message / Requirements *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your production volumes, products, or traceability requirements..."
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
                        <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" /> Send Message
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
              <h3 className="font-bold text-slate-900 text-base">Office &amp; Headquarters</h3>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Kigali Innovation Hub</span>
                    <span>KG 548 St, Kigali, Rwanda</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Email Support</span>
                    <a href="mailto:support@santrack.rw" className="text-rwanda-blue underline">support@santrack.rw</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Direct Line</span>
                    <span>+250 788 123 456 / +250 252 500 000</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-4 shrink-0 text-rwanda-blue mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Operating Hours</span>
                    <span>Monday – Friday: 8:00 AM – 5:00 PM (CAT)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Interactive FAQ List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="size-4 text-rwanda-blue" />
                <span>Frequently Asked Questions</span>
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
