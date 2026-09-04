"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useRegister } from "@/hooks/auth";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    if (DESIGN_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDone(true);
      return;
    }
    setFormError(null);
    register.mutate(values, {
      onSuccess: () => setDone(true),
      onError: (error) => setFormError(getApiErrorMessage(error)),
    });
  });

  if (done) {
    return (
      <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 animate-in zoom-in duration-300">
            <Check className="size-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Your account is ready
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            One more step — submit your business details for regulator review.
          </p>
          {DESIGN_MODE ? (
            <p className="mt-3 font-mono text-xs text-amber-600">
              DESIGN MODE — REGISTRATION SIMULATED
            </p>
          ) : null}
          <button
            type="button"
            className="mt-6 w-full h-11 sm:h-12 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => router.push("/onboarding")}
          >
            Start business registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 transition-all duration-300">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-1 w-8 rounded-full bg-[#067eda]" />
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Step 1 of 2
        </span>
      </div>

      <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
        Create your account
      </h1>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
        Takes about a minute. You&apos;ll set up your business right after.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700">
            Your full name
          </label>
          <input
            id="fullName"
            placeholder="e.g. Maria Santos"
            autoComplete="name"
            autoFocus
            {...form.register("fullName")}
            className="w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
          />
          {errors.fullName ? (
            <p className="text-xs font-medium text-red-500 mt-1">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
            Work email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...form.register("email")}
            className="w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
          />
          {errors.email ? (
            <p className="text-xs font-medium text-red-500 mt-1">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...form.register("password")}
              className="w-full h-11 pl-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">At least 8 characters</p>
          {errors.password ? (
            <p className="text-xs font-medium text-red-500 mt-1">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full h-11 sm:h-12 mt-2 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {register.isPending ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin text-white" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#067eda] hover:text-[#005ba6] hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
