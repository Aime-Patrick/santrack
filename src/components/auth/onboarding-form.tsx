"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileText,
  Landmark,
  LoaderCircle,
  Mail,
  MailCheck,
  MapPin,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Provinces, Districts, Sectors, Cells, Villages } from "rwanda";
import { getApiErrorMessage, type OrganizationResponse, type IndustrySector } from "@/lib/api";
import { useCreateOrganization, useMe } from "@/hooks/auth";
import { onboardingService } from "@/services/onboarding.service";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RegistrationGate } from "@/components/onboarding/registration-gate";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

type OrgType =
  | "MANUFACTURER"
  | "WAREHOUSE"
  | "DISTRIBUTOR"
  | "RETAILER"
  | "SHOP";

const ORG_TYPES: { value: OrgType; label: string; hint: string; icon: string }[] = [
  { value: "MANUFACTURER", label: "Manufacturer",  hint: "Make products and register new batches.",     icon: "🏭" },
  { value: "WAREHOUSE",    label: "Warehouse",     hint: "Receive, hold and dispatch sealed packages.", icon: "🏪" },
  { value: "DISTRIBUTOR",  label: "Distributor",   hint: "Move goods between businesses.",              icon: "🚚" },
  { value: "RETAILER",     label: "Retailer",      hint: "Buy stock and pass it down the chain.",       icon: "🛒" },
  { value: "SHOP",         label: "Shop",          hint: "Receive, open and sell to final customers.",  icon: "🏬" },
];

const INDUSTRY_SECTORS: { value: IndustrySector; label: string; hint: string }[] = [
  { value: "FOOD_AND_BEVERAGE",       label: "Food & Beverage",       hint: "Food processing, drinks, dairy, water." },
  { value: "PHARMACEUTICALS",         label: "Pharmaceuticals",       hint: "Medicines, vaccines, medical devices." },
  { value: "COSMETICS",               label: "Cosmetics",             hint: "Beauty, personal care, medicated cosmetics." },
  { value: "MINING_AND_MINERALS",     label: "Mining & Minerals",     hint: "3Ts, gold, petroleum, gas." },
  { value: "AGRICULTURE_AND_EXPORTS", label: "Agriculture & Exports", hint: "Coffee, tea, horticulture, pyrethrum." },
  { value: "GENERAL_MANUFACTURING",   label: "General Manufacturing", hint: "Construction materials, textiles, electronics." },
  { value: "DISTRIBUTION",            label: "Distribution",          hint: "Logistics, wholesale, import/export." },
  { value: "RETAIL",                  label: "Retail",                hint: "Shops, supermarkets, pharmacies." },
  { value: "OTHER",                   label: "Other",                 hint: "Any sector not listed above." },
];

// ── Document entry (runtime state per active upload field) ────────────────────

interface DocEntry {
  type: string;
  label: string;
  required: boolean;
  file: File | null;
}

const DESC_MAX_WORDS = 160;

const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300";
const LABEL_CLASS = "block text-xs font-semibold text-slate-700";
const SELECT_CLASS =
  "w-full h-11 px-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

/** Count whitespace-separated words, treating empty/whitespace-only as 0. */
function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

/**
 * Truncate `text` so it contains at most `maxWords` words.
 * Preserves the original whitespace up to the cut point.
 */
function truncateToWords(text: string, maxWords: number): string {
  if (countWords(text) <= maxWords) return text;
  // Walk character-by-character, counting word boundaries
  let words = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]);
    if (!isSpace && !inWord) { inWord = true; words++; }
    else if (isSpace && inWord) { inWord = false; }
    if (words > maxWords) return text.slice(0, i);
  }
  return text;
}

interface OwnerDraft {
  name: string;
  email: string;
  phone: string;
  percentage: string;
  idNumber: string;
}

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Identity",     shortLabel: "Identity"  },
  { label: "Business type",shortLabel: "Type"      },
  { label: "Location",     shortLabel: "Location"  },
  { label: "Documents",    shortLabel: "Documents" },
] as const;

const TOTAL_STEPS = STEPS.length;

// ── Slide transition variants ──────────────────────────────────────────────────

function slideVariants(direction: 1 | -1) {
  return {
    initial: { opacity: 0, x: direction * 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: direction * -20 },
  };
}

// ── Main component ─────────────────────────────────────────────────────────────

export function OnboardingForm({ onStart }: { onStart?: () => void } = {}) {
  const router = useRouter();
  const [gateOpen, setGateOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  /** Set after org create so document upload can be retried without recreating. */
  const [createdOrgId, setCreatedOrgId] = useState<number | null>(null);

  const createOrganization = useCreateOrganization();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  // Step 0 — identity
  const [tin, setTin] = useState("");
  const [name, setName] = useState("");
  const [dateIncorporated, setDateIncorporated] = useState("");

  // Step 1 — business type
  const [type, setType] = useState<OrgType | null>(null);
  const [industrySector, setIndustrySector] = useState<IndustrySector | null>(null);
  const [industrySectorOther, setIndustrySectorOther] = useState("");

  // Step 2 — contact & location
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  // Cascading location lists from the rwanda package
  const rwandaProvinces = useMemo(() => Provinces() ?? [], []);
  const rwandaDistricts = useMemo(
    () => (province ? (Districts(province) ?? []) : []),
    [province],
  );
  const rwandaSectors = useMemo(
    () => (province && district ? (Sectors(province, district) ?? []) : []),
    [province, district],
  );
  const rwandaCells = useMemo(
    () => (province && district && sector ? (Cells(province, district, sector) ?? []) : []),
    [province, district, sector],
  );
  const rwandaVillages = useMemo(
    () => (province && district && sector && cell ? (Villages(province, district, sector, cell) ?? []) : []),
    [province, district, sector, cell],
  );

  // Description word count + focus state
  const [descFocused, setDescFocused] = useState(false);
  const descWordCount = useMemo(() => countWords(description), [description]);
  const descFraction = Math.min(descWordCount / DESC_MAX_WORDS, 1);
  // Accent color that drives both border and ring — shifts slate→amber→red as word count rises,
  // and falls back to the standard blue (#067eda) only when there are no words yet.
  const descAccent =
    descFraction >= 1
      ? "#ef4444"
      : descFraction > 0.7
        ? `color-mix(in srgb, #ef4444 ${Math.round(((descFraction - 0.7) / 0.3) * 100)}%, #f59e0b)`
        : descFraction > 0
          ? "#f59e0b"
          : "#067eda";
  // Border uses the accent at all times; ring only activates while focused.
  const descBorderColor = descFraction === 0 && !descFocused ? "#e2e8f0" : descAccent;
  const descRingShadow = descFocused
    ? `0 0 0 3px ${descAccent}26`  // 26 hex ≈ 15% opacity, matching focus:ring-3 / ring/15
    : "none";

  // Step 3 — documents & ownership
  // RDB starts optional; it becomes required when the applicant enters a TIN.
  const [docs, setDocs] = useState<DocEntry[]>([
    { type: "RDB_CERTIFICATE", label: "RDB Registration Certificate", required: false, file: null },
  ]);
  const [owners, setOwners] = useState<OwnerDraft[]>([]);
  const [ownershipOpen, setOwnershipOpen] = useState(false);

  // Inline "add document" UI state
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDocLabel, setNewDocLabel] = useState("");

  // Labels already in use (case-insensitive) for duplicate guard
  const activeDocLabels = useMemo(
    () => new Set(docs.map((d) => d.label.trim().toLowerCase())),
    [docs],
  );

  function commitAddDoc() {
    const label = newDocLabel.trim();
    if (!label) return;
    // Use the label itself as the documentType string — the backend stores it verbatim
    const type = label;
    if (activeDocLabels.has(label.toLowerCase())) return; // duplicate
    setDocs((prev) => [...prev, { type, label, required: false, file: null }]);
    setNewDocLabel("");
    setAddingDoc(false);
  }

  function removeDoc(type: string) {
    setDocs((prev) => prev.filter((d) => d.type !== type));
  }

  function setDocFile(type: string, file: File | null) {
    setDocs((prev) => prev.map((d) => (d.type === type ? { ...d, file } : d)));
  }

  useEffect(() => {
    if (DESIGN_MODE) return;
    if (me?.organization) router.replace("/dashboard");
  }, [me, router]);

  // Step 3: RDB is required only when a TIN was provided (formal businesses).
  // Informal / home businesses without TIN can continue and add documents later.
  const rdbHasFile = docs.find((d) => d.type === "RDB_CERTIFICATE")?.file != null;
  const phoneDigits = phone.replace(/\D/g, "");
  const hasPhone = phoneDigits.length >= 9;
  const hasTin = tin.trim().length >= 5;
  const stepValid = [
    name.trim().length >= 2 && hasPhone, // 0 — phone required; TIN optional for informal / home businesses
    type !== null && industrySector !== null && (industrySector !== "OTHER" || industrySectorOther.trim().length >= 2), // 1
    province.trim() !== "" && district.trim() !== "",     // 2
    hasTin ? rdbHasFile : true, // 3 — RDB required only when TIN was entered
  ];

  function navigate(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function handleProceed() {
    setGateOpen(false);
    onStart?.();
  }

  const submit = async () => {
    if (!type) return;
    setFormError(null);
    setSubmitting(true);
    let organizationId = createdOrgId;
    try {
      if (organizationId == null) {
        const organization: OrganizationResponse = DESIGN_MODE
          ? { id: 1, name, type, tin, onboardingStatus: "PENDING" }
          : await createOrganization.mutateAsync({
              name,
              type,
              tin: hasTin ? tin.trim() : undefined,
              email: email.trim() || undefined,
              phone: phoneDigits ? `+250${phoneDigits.replace(/^250/, "")}` : undefined,
              licenseType: ORG_TYPES.find((t) => t.value === type)?.label,
              dateIncorporated: dateIncorporated || undefined,
              description: [
                industrySector === "OTHER" && industrySectorOther.trim()
                  ? `Industry sector (other): ${industrySectorOther.trim()}`
                  : null,
                description.trim() || null,
              ]
                .filter(Boolean)
                .join("\n\n") || undefined,
              province,
              district,
              sector: sector.trim() || undefined,
              cell: cell.trim() || undefined,
              village: village.trim() || undefined,
              industrySector: industrySector ?? undefined,
              ownership: owners.map((o) => ({
                name: o.name,
                email: o.email.trim() || undefined,
                phone: o.phone.trim() || undefined,
                percentage: Number(o.percentage),
                idNumber: o.idNumber.trim() || undefined,
              })),
            });
        organizationId = organization.id;
        setCreatedOrgId(organizationId);
      }

      if (!DESIGN_MODE) {
        // Uploads must succeed or the regulator review screen stays empty while
        // the applicant still sees "Application Submitted". Do not swallow failures.
        const toUpload = docs.filter((d) => d.file);
        if (toUpload.length > 0) {
          const results = await Promise.allSettled(
            toUpload.map((d) =>
              onboardingService.uploadDocument(
                organizationId!,
                d.file as File,
                d.type,
                "",
                "",
              ),
            ),
          );
          const failed = results.filter((r) => r.status === "rejected");
          if (failed.length > 0) {
            const first = failed[0] as PromiseRejectedResult;
            throw (
              first.reason ??
              new Error(
                "Your application was saved, but one or more documents failed to upload. Fix the files and submit again.",
              )
            );
          }
        }
      }
      setDone(true);
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          organizationId != null
            ? "Documents failed to upload. Your application is saved — try submitting again with the files."
            : undefined,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-200">
            <MailCheck className="size-8 text-[#067eda]" strokeWidth={2.2} />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Application Submitted for Review
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-700">{name}</span> is registered
            and awaiting screening by the regulatory authorities. A confirmation email has been sent to your inbox.
          </p>
          <div className="mt-6 w-full space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
              <div>
                <p className="text-xs font-semibold text-slate-900">What happens next</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
                  Regulatory officers (RSB / Rwanda FDA) will inspect your business documents.
                  You will be notified by email as soon as a decision is made.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Approval-gated Access</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
                  Full supply chain operations and business dashboard tools will unlock immediately once regulatory approval is issued.
                </p>
              </div>
            </div>
          </div>
          {DESIGN_MODE && (
            <p className="mt-3 font-mono text-xs text-amber-600">DESIGN MODE — REGISTRATION SIMULATED</p>
          )}
          <div className="mt-6 w-full flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              className="flex-1 h-11 rounded-lg font-semibold text-white text-sm bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
              onClick={() => router.replace("/dashboard")}
            >
              View Review Status
            </button>
            <button
              type="button"
              className="h-11 px-5 rounded-lg font-semibold text-slate-700 text-sm border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => router.replace("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step content ──────────────────────────────────────────────────────────────

  const vars = slideVariants(direction);

  return (
    <>
      <RegistrationGate open={gateOpen} onOpenChange={setGateOpen} onProceed={handleProceed} />

      <div className="w-full rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 overflow-hidden">

        {/* ── Progress bar ── */}
        <div className="h-1 bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#067eda] to-[#10b981]"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.32, 0, 0.18, 1] }}
          />
        </div>

        {/* ── Step indicator ── */}
        <div className="px-7 sm:px-9 pt-6 pb-0">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Dot */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300",
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                        ? "bg-[#067eda] text-white shadow-[0_0_0_4px_rgba(6,126,218,0.15)]"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                {/* Label — hidden on mobile */}
                <span className={cn(
                  "ml-2 text-[13px] font-semibold hidden sm:block whitespace-nowrap transition-colors",
                  i === step ? "text-slate-800" : i < step ? "text-emerald-600" : "text-slate-400",
                )}>
                  {s.label}
                </span>
                {/* Connector */}
                {i < TOTAL_STEPS - 1 && (
                  <div className="flex-1 mx-2 sm:mx-3 h-px bg-slate-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-400"
                      animate={{ width: i < step ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: [0.32, 0, 0.18, 1] }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step headline */}
          <div className="mt-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`title-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {step === 0 && "Your business identity"}
                  {step === 1 && "What kind of business are you?"}
                  {step === 2 && "Contact & location"}
                  {step === 3 && "Documents & ownership"}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {step === 0 && "Start with your name and phone. TIN can wait if you do not have one yet."}
                  {step === 1 && "Choose your business type and industry sector."}
                  {step === 2 && "How the regulator reaches you and where you operate."}
                  {step === 3 && "Supporting certificates and ownership structure for compliance."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Form body ── */}
        <div className="px-7 sm:px-9 pt-5 pb-7 sm:pb-8">
          <AnimatePresence mode="wait" initial={false}>

            {/* ─ Step 0: Identity ─ */}
            {step === 0 && (
              <motion.div key="s0" {...vars} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="organizationName" className={LABEL_CLASS}>
                    Business / company name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="organizationName"
                    placeholder="e.g. Uwase Home Yoghurt"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="phone-identity" className={LABEL_CLASS}>
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                        +250
                      </span>
                      <input
                        id="phone-identity"
                        type="tel"
                        inputMode="numeric"
                        placeholder="7XX XXX XXX"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                        className={cn(INPUT_CLASS, "rounded-l-none font-mono")}
                      />
                    </div>
                    <p className="text-[13px] text-slate-400">
                      Used to reach you while registration is reviewed — required if you have no TIN yet.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tin" className={LABEL_CLASS}>
                      TIN / RDB number{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="tin"
                      placeholder="e.g. 102345678"
                      autoComplete="off"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      className={cn(INPUT_CLASS, "font-mono")}
                    />
                    <p className="text-[13px] text-slate-400">
                      Leave blank if you do not have one yet. You can add it later.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="dateIncorporated" className={LABEL_CLASS}>
                      Date of incorporation{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="dateIncorporated"
                      type="date"
                      value={dateIncorporated}
                      onChange={(e) => setDateIncorporated(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─ Step 1: Business type ─ */}
            {step === 1 && (
              <motion.div key="s1" {...vars} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-5">
                <div className="space-y-2">
                  <label className={LABEL_CLASS}>
                    Business type <span className="text-red-500">*</span>
                  </label>
                  <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ORG_TYPES.map((t) => {
                      const selected = type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setType(t.value)}
                          className={cn(
                            "relative rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                            selected
                              ? "border-[#067eda] bg-[#f0f8ff] ring-1 ring-[#067eda] shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-lg leading-none">{t.icon}</span>
                            {selected && <Check className="size-3.5 shrink-0 text-[#067eda] mt-0.5" strokeWidth={2.5} />}
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-900">{t.label}</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{t.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={LABEL_CLASS}>
                    Industry sector
                    <span className="ml-1 text-[13px] font-normal text-slate-400">— routes your application to the right regulator</span>
                  </label>
                  <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {INDUSTRY_SECTORS.map((s) => {
                      const selected = industrySector === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setIndustrySector(s.value);
                            if (s.value !== "OTHER") setIndustrySectorOther("");
                          }}
                          className={cn(
                            "relative rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                            selected
                              ? "border-[#067eda] bg-[#f0f8ff] ring-1 ring-[#067eda] shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 leading-snug">{s.label}</span>
                            {selected && <Check className="size-3 shrink-0 text-[#067eda] mt-0.5" strokeWidth={2.5} />}
                          </div>
                          <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{s.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  {industrySector === "OTHER" ? (
                    <div className="mt-2 space-y-1.5">
                      <label htmlFor="industry-sector-other" className={LABEL_CLASS}>
                        Please specify your industry
                      </label>
                      <input
                        id="industry-sector-other"
                        type="text"
                        value={industrySectorOther}
                        onChange={(event) => setIndustrySectorOther(event.target.value)}
                        placeholder="e.g. Packaging materials, industrial chemicals…"
                        className={INPUT_CLASS}
                      />
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {/* ─ Step 2: Contact & location ─ */}
            {step === 2 && (
              <motion.div key="s2" {...vars} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-5">
                {/* Contact */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className={LABEL_CLASS}>Company email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        placeholder="info@company.rw"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(INPUT_CLASS, "pl-10")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className={LABEL_CLASS}>
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">+250</span>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="7XX XXX XXX"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                        className={cn(INPUT_CLASS, "rounded-l-none font-mono")}
                      />
                    </div>
                    <p className="text-[13px] text-slate-400">Same number from step 1 — update it if needed.</p>
                  </div>
                </div>

                {/* Description with live word count and animated border */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="description" className={LABEL_CLASS}>Business description</label>
                    <span className={cn(
                      "text-[13px] font-mono tabular-nums transition-colors duration-300",
                      descWordCount >= DESC_MAX_WORDS
                        ? "text-red-500 font-semibold"
                        : descWordCount >= Math.round(DESC_MAX_WORDS * 0.7)
                          ? "text-amber-500"
                          : "text-slate-400",
                    )}>
                      {descWordCount} / {DESC_MAX_WORDS} words
                    </span>
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="What does your business do? Describe your products, services, and operations."
                    value={description}
                    onChange={(e) => {
                      const next = e.target.value;
                      // For regular keystroke input: block additions that exceed the limit
                      if (countWords(next) > DESC_MAX_WORDS && next.length > description.length) return;
                      setDescription(next);
                    }}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text");
                      // Merge current value with pasted text at the cursor position
                      const el = e.currentTarget;
                      const merged =
                        description.slice(0, el.selectionStart ?? description.length) +
                        pasted +
                        description.slice(el.selectionEnd ?? description.length);
                      setDescription(truncateToWords(merged, DESC_MAX_WORDS));
                    }}
                    style={{ borderColor: descBorderColor, boxShadow: descRingShadow }}
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border rounded-lg outline-none transition-[border-color,box-shadow] duration-300 hover:border-slate-300 resize-y"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 pt-1">
                  <MapPin className="size-4 text-[#067eda] shrink-0" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Business address</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Province → District (cascading) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="province" className={LABEL_CLASS}>Province <span className="text-red-500">*</span></label>
                    <select
                      id="province"
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value);
                        setDistrict("");
                        setSector("");
                        setCell("");
                        setVillage("");
                      }}
                      className={SELECT_CLASS}
                    >
                      <option value="">Select province</option>
                      {rwandaProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="district" className={LABEL_CLASS}>District <span className="text-red-500">*</span></label>
                    <select
                      id="district"
                      value={district}
                      disabled={!province}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setSector("");
                        setCell("");
                        setVillage("");
                      }}
                      className={SELECT_CLASS}
                    >
                      <option value="">{province ? "Select district" : "Select province first"}</option>
                      {rwandaDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Sector → Cell → Village (cascading) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label htmlFor="sector" className={LABEL_CLASS}>Sector</label>
                    <select
                      id="sector"
                      value={sector}
                      disabled={!district}
                      onChange={(e) => {
                        setSector(e.target.value);
                        setCell("");
                        setVillage("");
                      }}
                      className={SELECT_CLASS}
                    >
                      <option value="">{district ? "Select sector" : "Select district first"}</option>
                      {rwandaSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cell" className={LABEL_CLASS}>Cell</label>
                    <select
                      id="cell"
                      value={cell}
                      disabled={!sector}
                      onChange={(e) => {
                        setCell(e.target.value);
                        setVillage("");
                      }}
                      className={SELECT_CLASS}
                    >
                      <option value="">{sector ? "Select cell" : "Select sector first"}</option>
                      {rwandaCells.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="village" className={LABEL_CLASS}>Village</label>
                    <select
                      id="village"
                      value={village}
                      disabled={!cell}
                      onChange={(e) => setVillage(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">{cell ? "Select village" : "Select cell first"}</option>
                      {rwandaVillages.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─ Step 3: Documents & ownership ─ */}
            {step === 3 && (
              <motion.div key="s3" {...vars} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-5">

                {/* ── Certificates section header ── */}
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-[#067eda] shrink-0" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Certificates &amp; licences</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/*
                  Animated layout container — expands to a 2-column grid when 2+ docs are active.
                  motion.div with layout="position" lets each card animate its own position
                  while the grid reflows. The maxWidth animation widens the card shell (inherited
                  from the outer motion.div in page.tsx) via the parent; here we just let the grid
                  grow naturally and let Framer handle reflows.
                */}
                <motion.div
                  layout
                  className={cn(
                    "gap-3",
                    docs.length >= 2
                      ? "grid sm:grid-cols-2"
                      : "flex flex-col",
                  )}
                  transition={{ duration: 0.35, ease: [0.32, 0, 0.18, 1] }}
                >
                  <AnimatePresence initial={false}>
                    {docs.map((doc) => {
                      const isRdb = doc.type === "RDB_CERTIFICATE";
                      const docRequired = isRdb ? hasTin : doc.required;
                      return (
                      <motion.div
                        key={doc.type}
                        layout="position"
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className={cn(
                          "rounded-xl border bg-slate-50 p-4",
                          docRequired
                            ? "border-[#067eda]/30 ring-1 ring-[#067eda]/10"
                            : "border-slate-200",
                        )}
                      >
                        {/* Card header */}
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="size-4 shrink-0 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700 leading-tight">{doc.label}</span>
                          {docRequired ? (
                            <span className="ml-auto rounded-full bg-[#067eda]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#067eda]">
                              required
                            </span>
                          ) : (
                            <>
                              <span className="ml-auto text-[10px] text-slate-400">optional</span>
                              {!isRdb ? (
                              <button
                                type="button"
                                aria-label={`Remove ${doc.label}`}
                                onClick={() => removeDoc(doc.type)}
                                className="ml-1 flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                              >
                                <X className="size-3" />
                              </button>
                              ) : null}
                            </>
                          )}
                        </div>

                        {/* File upload row */}
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-500 transition-colors hover:border-[#067eda]/50 hover:bg-sky-50/40">
                          <Upload className="size-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {doc.file ? doc.file.name : "Upload copy (jpg, png, pdf — max 5 MB)"}
                          </span>
                          {doc.file && (
                            <button
                              type="button"
                              aria-label="Clear file"
                              onClick={(e) => { e.preventDefault(); setDocFile(doc.type, null); }}
                              className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                          <input
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png,.doc,.pdf"
                            onChange={(e) => setDocFile(doc.type, e.target.files?.[0] ?? null)}
                          />
                        </label>

                        {/* Required hint when file is missing */}
                        {docRequired && !doc.file && (
                          <p className="mt-1.5 text-[13px] text-slate-400">
                            Upload required to submit your application.
                          </p>
                        )}
                        {isRdb && !hasTin && (
                          <p className="mt-1.5 text-[13px] text-slate-400">
                            Optional until you have a TIN / RDB number.
                          </p>
                        )}
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {/* Add Document — inline free-text input, animates open/closed */}
                <AnimatePresence initial={false}>
                  {addingDoc ? (
                    <motion.div
                      key="add-doc-input"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex items-center gap-2"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={newDocLabel}
                        onChange={(e) => setNewDocLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitAddDoc(); }
                          if (e.key === "Escape") { setAddingDoc(false); setNewDocLabel(""); }
                        }}
                        placeholder="Certificate or document name…"
                        className={cn(
                          INPUT_CLASS,
                          "flex-1 text-xs h-9",
                          activeDocLabels.has(newDocLabel.trim().toLowerCase()) && newDocLabel.trim()
                            ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400/15"
                            : "",
                        )}
                      />
                      <button
                        type="button"
                        disabled={
                          !newDocLabel.trim() ||
                          activeDocLabels.has(newDocLabel.trim().toLowerCase())
                        }
                        onClick={commitAddDoc}
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#067eda] px-3 text-xs font-semibold text-white transition-all hover:bg-[#005ba6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Check className="size-3" /> Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingDoc(false); setNewDocLabel(""); }}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        aria-label="Cancel"
                      >
                        <X className="size-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add-doc-button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <button
                        type="button"
                        onClick={() => setAddingDoc(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#067eda]/60 hover:bg-sky-50/50 hover:text-[#067eda] cursor-pointer"
                      >
                        <Plus className="size-3 shrink-0" />
                        Add document
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 pt-1">
                  <ShieldCheck className="size-4 text-[#067eda] shrink-0" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Ownership</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <button
                  type="button"
                  onClick={() => setOwnershipOpen(true)}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3.5 text-left transition-colors hover:border-[#067eda]/50 hover:bg-sky-50/40 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Ownership information</p>
                    <p className="text-[13px] text-slate-400 mt-0.5">
                      {owners.length > 0
                        ? `${owners.length} owner${owners.length !== 1 ? "s" : ""} added`
                        : "Record who owns this business (required for compliance)"}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOwnershipOpen(true)}>
                    {owners.length > 0 ? "Manage" : "Add owners"}
                  </Button>
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Error ── */}
          {formError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {formError}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => navigate(step - 1)}
              disabled={step === 0 || submitting}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-500 transition-colors",
                step === 0 || submitting ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer",
              )}
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <span className="text-[13px] font-mono uppercase tracking-wider text-slate-400">
              {step + 1} / {TOTAL_STEPS}
            </span>

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                disabled={!stepValid[step] || submitting}
                onClick={() => navigate(step + 1)}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-[#067eda] px-5 text-sm font-semibold text-white transition-all hover:bg-[#005ba6] hover:shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!stepValid[3] || submitting}
                onClick={() => void submit()}
                className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] px-5 text-sm font-semibold text-white hover:opacity-95 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><LoaderCircle className="size-4 animate-spin" /> Submitting…</>
                ) : (
                  <><ShieldCheck className="size-4" /> Submit for approval</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <OwnershipDialog
        open={ownershipOpen}
        onOpenChange={setOwnershipOpen}
        owners={owners}
        onChange={setOwners}
      />
    </>
  );
}

// ── Ownership dialog ──────────────────────────────────────────────────────────

function OwnershipDialog({
  open,
  onOpenChange,
  owners,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: OwnerDraft[];
  onChange: (owners: OwnerDraft[]) => void;
}) {
  const [form, setForm] = useState<OwnerDraft>({
    name: "", email: "", phone: "", percentage: "", idNumber: "",
  });

  const add = () => {
    if (!form.name.trim() || !form.percentage) return;
    onChange([...owners, { ...form }]);
    setForm({ name: "", email: "", phone: "", percentage: "", idNumber: "" });
  };

  const remove = (i: number) => onChange(owners.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ownership information</DialogTitle>
          <DialogDescription>
            Add the owners or shareholders of this business. This is required for compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Owner list */}
          {owners.length > 0 && (
            <ul className="space-y-2">
              {owners.map((o, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{o.name}</p>
                    <p className="text-slate-500">{o.percentage}% ownership{o.email ? ` · ${o.email}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => remove(i)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">✕</button>
                </li>
              ))}
            </ul>
          )}

          {/* Add form */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-700">Add owner</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Full name <span className="text-red-500">*</span></label>
                <input
                  placeholder="Owner full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Ownership % <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 51"
                  value={form.percentage}
                  onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Email</label>
                <input
                  type="email"
                  placeholder="owner@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Phone</label>
                <input
                  type="tel"
                  placeholder="07X XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={LABEL_CLASS}>National ID / Passport</label>
                <input
                  placeholder="ID or passport number"
                  value={form.idNumber}
                  onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!form.name.trim() || !form.percentage}
              onClick={add}
            >
              Add owner
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ── Field helper (kept for potential future use) ──────────────────────────────

function Field({
  id,
  label,
  required,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
