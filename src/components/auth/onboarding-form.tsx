"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, LoaderCircle, MapPin, Package, Printer } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useCreateOrganization, useMe } from "@/hooks/auth";
import { cn } from "@/lib/utils";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

const ORG_TYPE_VALUES = [
  "MANUFACTURER",
  "WAREHOUSE",
  "DISTRIBUTOR",
  "RETAILER",
  "SHOP",
  "REGULATOR",
  "CONSUMER",
] as const;

type OrgType = (typeof ORG_TYPE_VALUES)[number];

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
  {
    value: "REGULATOR",
    label: "Regulator",
    hint: "Monitor batches, recalls and compliance.",
  },
  {
    value: "CONSUMER",
    label: "Consumer",
    hint: "Verify authenticity and follow a product's history.",
  },
];

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name"),
  type: z.enum(ORG_TYPE_VALUES, { message: "Choose your business type" }),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const NEXT_STEPS = [
  {
    icon: MapPin,
    title: "Add your first location",
    hint: "A warehouse or shop — the anchor for your inventory.",
  },
  {
    icon: Package,
    title: "Create your first product",
    hint: "Give it a permanent QR identity.",
  },
  {
    icon: Printer,
    title: "Print QR labels",
    hint: "Stick them on units and packages.",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const createOrganization = useCreateOrganization();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", type: "" as OrgType },
  });

  const errors = form.formState.errors;
  const selectedType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (!DESIGN_MODE && me?.organization) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (DESIGN_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDone(true);
      return;
    }
    setFormError(null);
    createOrganization.mutate(values, {
      onSuccess: () => setDone(true),
      onError: (error) => setFormError(getApiErrorMessage(error)),
    });
  });

  if (done) {
    const type = ORG_TYPES.find(
      (t) => t.value === form.getValues("type"),
    )?.label;
    return (
      <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 animate-in zoom-in duration-300">
            <Check className="size-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Your business is on the trace
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {form.getValues("name")} is registered as a {type?.toLowerCase()} on
            the platform.
          </p>
          <p className="mt-3 font-mono text-xs text-slate-500">
            {form.getValues("name").toUpperCase()} · {type?.toUpperCase()}
          </p>
          {DESIGN_MODE ? (
            <p className="mt-2 font-mono text-xs text-amber-600">
              DESIGN MODE — ONBOARDING SIMULATED
            </p>
          ) : null}

          <div className="mt-6 w-full space-y-2 text-left">
            {NEXT_STEPS.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
              >
                <step.icon
                  className="mt-0.5 size-4 shrink-0 text-[#067eda]"
                  strokeWidth={2}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500">{step.hint}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 w-full h-11 sm:h-12 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 transition-all duration-300">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-1 w-8 rounded-full bg-[#00953C]" />
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Step 2 of 2
        </span>
      </div>

      <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
        Tell us about your business
      </h1>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
        This is who you&apos;ll operate as on the platform. You can adjust
        these details later.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="organizationName" className="block text-xs font-semibold text-slate-700">
            Business name
          </label>
          <input
            id="organizationName"
            placeholder="e.g. Sunrise Dairy"
            autoFocus
            {...form.register("name")}
            className="w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
          />
          {errors.name ? (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Business type
          </label>
          <div
            role="radiogroup"
            aria-label="Business type"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {ORG_TYPES.map((type) => {
              const selected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    form.setValue("type", type.value, { shouldValidate: true })
                  }
                  className={cn(
                    "relative rounded-lg border p-3 text-left transition-all cursor-pointer",
                    selected
                      ? "border-[#067eda] bg-sky-50/60 ring-1 ring-[#067eda] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {type.label}
                    </span>
                    {selected ? (
                      <Check
                        className="size-4 shrink-0 text-[#067eda]"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </div>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                    {type.hint}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.type ? (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.type.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs font-medium text-red-700">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={createOrganization.isPending}
          className="w-full h-11 sm:h-12 mt-2 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {createOrganization.isPending ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin text-white" />
              Setting up…
            </>
          ) : (
            "Finish setup"
          )}
        </button>
      </form>
    </div>
  );
}
