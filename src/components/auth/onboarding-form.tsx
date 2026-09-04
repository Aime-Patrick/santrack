"use client";

import { useEffect, useState } from "react";
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
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { getApiErrorMessage, type OrganizationResponse } from "@/lib/api";
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

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

type OrgType =
  | "MANUFACTURER"
  | "WAREHOUSE"
  | "DISTRIBUTOR"
  | "RETAILER"
  | "SHOP";

const ORG_TYPES: { value: OrgType; label: string; hint: string }[] = [
  {
    value: "MANUFACTURER",
    label: "Manufacturer",
    hint: "Make the products and register new batches.",
  },
  {
    value: "WAREHOUSE",
    label: "Warehouse",
    hint: "Receive, hold and dispatch sealed packages.",
  },
  {
    value: "DISTRIBUTOR",
    label: "Distributor",
    hint: "Move goods between businesses.",
  },
  {
    value: "RETAILER",
    label: "Retailer",
    hint: "Buy stock and pass it down the chain.",
  },
  {
    value: "SHOP",
    label: "Shop",
    hint: "Receive, open and sell to the final customer.",
  },
];

const RWANDA_PROVINCES = [
  "Kigali City",
  "Northern Province",
  "Southern Province",
  "Eastern Province",
  "Western Province",
];

const CERTIFICATES = [
  { type: "RDB_CERTIFICATE", label: "RDB Certificate" },
  { type: "FDA_PREMISE", label: "Rwanda FDA Premise Certificate" },
  { type: "IMPORT_LICENSE", label: "Import License" },
];

/** Shared input style so every field matches the registration page. */
const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300";
const LABEL_CLASS = "block text-xs font-semibold text-slate-700";

interface CertificateDraft {
  type: string;
  label: string;
  number: string;
  expiryDate: string;
  file: File | null;
}

interface OwnerDraft {
  name: string;
  email: string;
  phone: string;
  percentage: string;
  idNumber: string;
}

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const createOrganization = useCreateOrganization();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  // Step 1 — tax & business
  const [tin, setTin] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [dateIncorporated, setDateIncorporated] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 — address & documents
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  const [certificates, setCertificates] = useState<CertificateDraft[]>(
    CERTIFICATES.map((c) => ({
      type: c.type,
      label: c.label,
      number: "",
      expiryDate: "",
      file: null,
    })),
  );
  const [owners, setOwners] = useState<OwnerDraft[]>([]);
  const [ownershipOpen, setOwnershipOpen] = useState(false);

  // Anyone who already acts for an organization has no business here - a
  // second application would fail anyway, and a pending/rejected one is shown
  // its status from the dashboard guard.
  useEffect(() => {
    if (DESIGN_MODE) return;
    if (me?.organization) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  const step1Valid =
    tin.trim().length >= 5 && name.trim().length >= 2 && type !== null;
  const step2Valid = province.trim() !== "" && district.trim() !== "";

  const updateCertificate = (
    i: number,
    patch: Partial<CertificateDraft>,
  ) => {
    setCertificates((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  };

  const submit = async () => {
    if (!type) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const organization: OrganizationResponse = DESIGN_MODE
        ? { id: 1, name, type, tin, onboardingStatus: "PENDING" }
        : await createOrganization.mutateAsync({
            name,
            type,
            tin,
            registrationNumber: registrationNumber.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            licenseType: ORG_TYPES.find((t) => t.value === type)?.label,
            dateIncorporated: dateIncorporated || undefined,
            description: description.trim() || undefined,
            province,
            district,
            sector: sector.trim() || undefined,
            cell: cell.trim() || undefined,
            village: village.trim() || undefined,
            ownership: owners.map((o) => ({
              name: o.name,
              email: o.email.trim() || undefined,
              phone: o.phone.trim() || undefined,
              percentage: Number(o.percentage),
              idNumber: o.idNumber.trim() || undefined,
            })),
          });

      if (!DESIGN_MODE) {
        // Files ride along after the application exists; a failed upload must
        // not fail the application itself, so each is best-effort.
        await Promise.allSettled(
          certificates
            .filter((c) => c.file)
            .map((c) =>
              onboardingService.uploadDocument(
                organization.id,
                c.file as File,
                c.type,
                c.number,
                c.expiryDate,
              ),
            ),
        );
      }
      setDone(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 animate-in fade-in duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-200 animate-in zoom-in duration-300">
            <MailCheck className="size-8 text-[#067eda]" strokeWidth={2.2} />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Application submitted for review
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-700">{name}</span> is
            registered and waiting for the regulator to review it. You&apos;ll
            receive an email as soon as a decision is made.
          </p>

          <div className="mt-6 w-full space-y-2 rounded-xl border border-slate-200 bg-slate-100 p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  What happens next
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  A regulator reviews your application and documents. Once
                  approved, your operating licence is activated and you can
                  sign in and start working.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Track your status
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Sign in any time — until a decision is made you&apos;ll see
                  your application status here.
                </p>
              </div>
            </div>
          </div>

          {DESIGN_MODE ? (
            <p className="mt-3 font-mono text-xs text-amber-600">
              DESIGN MODE — REGISTRATION SIMULATED
            </p>
          ) : null}

          <button
            type="button"
            className="mt-6 w-full h-11 sm:h-12 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 transition-all duration-300">
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-3">
        {[0, 1].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                s < step
                  ? "bg-emerald-500 text-white"
                  : s === step
                    ? "bg-[#067eda] text-white ring-4 ring-[#067eda]/15"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {s < step ? <Check className="size-3.5" /> : s + 1}
            </div>
            <div
              className={cn(
                "hidden h-1 flex-1 rounded-full sm:block",
                s < step ? "bg-emerald-400" : "bg-slate-100",
              )}
            />
          </div>
        ))}
      </div>

      <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
        {step === 0 ? "Tell us about your business" : "Address & certificates"}
      </h1>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
        {step === 0
          ? "Your details are validated against the registry before approval."
          : "Location, ownership and supporting documents for the regulator."}
      </p>

      {step === 0 ? (
        <div className="mt-6 space-y-5">
          {/* Tax & identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="tin" className={LABEL_CLASS}>
                Tax Identification Number (TIN){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="tin"
                placeholder="e.g. 102345678"
                autoComplete="off"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                className={cn(INPUT_CLASS, "font-mono")}
              />
              <p className="text-[11px] text-slate-400">
                Enter your TIN so the regulator can validate your business.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="organizationName" className={LABEL_CLASS}>
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                id="organizationName"
                placeholder="e.g. Sunrise Dairy Ltd"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="registrationNumber" className={LABEL_CLASS}>
                Registration number
              </label>
              <input
                id="registrationNumber"
                placeholder="Company / RDB number"
                autoComplete="off"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dateIncorporated" className={LABEL_CLASS}>
                Date of incorporation
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

          {/* Business type */}
          <div className="space-y-2">
            <label className={LABEL_CLASS}>
              Business type <span className="text-red-500">*</span>
            </label>
            <div
              role="radiogroup"
              aria-label="Business type"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
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
                      "relative rounded-lg border p-3 text-left transition-all cursor-pointer",
                      selected
                        ? "border-[#067eda] bg-primary-light ring-1 ring-[#067eda] shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {t.label}
                      </span>
                      {selected ? (
                        <Check
                          className="size-4 shrink-0 text-[#067eda]"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </div>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                      {t.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="email" className={LABEL_CLASS}>
                Company email
              </label>
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
                Phone number
              </label>
              <div className="flex">
                <span className="flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                  +250
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="7XX XXX XXX"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(INPUT_CLASS, "rounded-l-none")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className={LABEL_CLASS}>
              Business description
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="What does your business do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300 resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-[#067eda]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Business address
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="province" className={LABEL_CLASS}>
                Province <span className="text-red-500">*</span>
              </label>
              <select
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
              >
                <option value="">Select province</option>
                {RWANDA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="district" className={LABEL_CLASS}>
                District <span className="text-red-500">*</span>
              </label>
              <input
                id="district"
                placeholder="e.g. Gasabo"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sector" className={LABEL_CLASS}>
                Sector
              </label>
              <input
                id="sector"
                placeholder="Sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cell" className={LABEL_CLASS}>
                Cell
              </label>
              <input
                id="cell"
                placeholder="Cell"
                value={cell}
                onChange={(e) => setCell(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="village" className={LABEL_CLASS}>
                Village
              </label>
              <input
                id="village"
                placeholder="Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Certificates */}
          <div className="flex items-center gap-2 pt-1">
            <Landmark className="size-4 text-[#067eda]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Certificates &amp; licences
            </h2>
          </div>
          <div className="space-y-3">
            {certificates.map((cert, i) => (
              <div
                key={cert.type}
                className="rounded-xl border border-slate-200 bg-slate-100 p-4"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {cert.label}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Certificate / licence number"
                    value={cert.number}
                    onChange={(e) =>
                      updateCertificate(i, { number: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="date"
                    value={cert.expiryDate}
                    onChange={(e) =>
                      updateCertificate(i, { expiryDate: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-500 transition-colors hover:border-[#067eda]/50 hover:bg-sky-50/40">
                  <Upload className="size-3.5" />
                  <span className="truncate">
                    {cert.file
                      ? cert.file.name
                      : "Upload certificate copy (jpg, png, pdf — max 5MB)"}
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.doc,.pdf"
                    onChange={(e) =>
                      updateCertificate(i, {
                        file: e.target.files?.[0] ?? null,
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Ownership */}
          <button
            type="button"
            onClick={() => setOwnershipOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3.5 text-left transition-colors hover:border-[#067eda]/50 hover:bg-sky-50/40 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Ownership information
                </p>
                <p className="text-[11px] text-slate-400">
                  {owners.length > 0
                    ? `${owners.length} owner${owners.length !== 1 ? "s" : ""} added`
                    : "Record who owns this business (required for compliance)"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOwnershipOpen(true)}
            >
              {owners.length > 0 ? "Manage" : "Add"}
            </Button>
          </button>
        </div>
      )}

      {formError ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {formError}
        </div>
      ) : null}

      {/* Navigation */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(0)}
          disabled={step === 0 || submitting}
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-500 transition-colors",
            step === 0 || submitting
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-slate-100 cursor-pointer",
          )}
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Step {step + 1} of 2
        </span>

        {step === 0 ? (
          <button
            type="button"
            disabled={!step1Valid || submitting}
            onClick={() => setStep(1)}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-[#067eda] px-5 text-sm font-semibold text-white transition-all hover:bg-[#005ba6] hover:shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!step2Valid || submitting}
            onClick={() => void submit()}
            className="flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] px-5 text-sm font-semibold text-white transition-all hover:opacity-95 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                Submit for approval
              </>
            )}
          </button>
        )}
      </div>

      <OwnershipDialog
        open={ownershipOpen}
        onOpenChange={setOwnershipOpen}
        owners={owners}
        onChange={setOwners}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ownership dialog — matches the Digital Tax Stamp ownership table
// ---------------------------------------------------------------------------

function OwnershipDialog({
  open,
  onOpenChange,
  owners,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  owners: OwnerDraft[];
  onChange: (v: OwnerDraft[]) => void;
}) {
  const [form, setForm] = useState<OwnerDraft>({
    name: "",
    email: "",
    phone: "",
    percentage: "",
    idNumber: "",
  });

  const totalPct = owners.reduce((s, o) => s + (Number(o.percentage) || 0), 0);

  const addOwner = () => {
    if (!form.name.trim() || !form.percentage) return;
    onChange([...owners, form]);
    setForm({ name: "", email: "", phone: "", percentage: "", idNumber: "" });
  };

  const removeOwner = (i: number) => {
    onChange(owners.filter((_, idx) => idx !== i));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add ownership information</DialogTitle>
          <DialogDescription>
            Record the owners of this business. This information is required for
            regulatory compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <Field label="Ownership name">
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Phone number">
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                +250
              </span>
              <input
                placeholder="7XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={cn(INPUT_CLASS, "rounded-l-none")}
              />
            </div>
          </Field>
          <Field label="Percentage of ownership">
            <div className="flex">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={form.percentage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, percentage: e.target.value }))
                }
                className={INPUT_CLASS}
              />
              <span className="flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                %
              </span>
            </div>
          </Field>
          <Field label="Passport / National ID" className="sm:col-span-2">
            <input
              placeholder="ID number"
              value={form.idNumber}
              onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <span className="text-xs text-slate-500">
            {owners.length} owner{owners.length !== 1 ? "s" : ""} added · total{" "}
            <span
              className={cn(
                "font-mono font-semibold",
                totalPct === 100 ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {totalPct}%
            </span>{" "}
            {totalPct === 100 ? "✓" : "(aim for 100%)"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
            <Button
              onClick={addOwner}
              disabled={!form.name.trim() || !form.percentage}
            >
              Add owner
            </Button>
          </div>
        </DialogFooter>

        {owners.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2 text-center">ID</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((o, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {o.name}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{o.email || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">
                      {o.percentage}%
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-slate-500">
                      {o.idNumber || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeOwner(i)}
                        aria-label={`Remove ${o.name}`}
                        className="text-slate-400 transition-colors hover:text-red-500 cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}
