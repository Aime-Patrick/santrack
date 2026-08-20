"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useLogin } from "@/hooks/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/san-track-logo";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your username or email"),
  password: z.string().min(1, "Please enter your password"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (data) => {
          if (data.user.role === "SYSTEM_ADMIN" || data.user.organization) {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        },
      },
    );
  });

  return (
    <AuthShell>
      {/* Floating White Card */}
      <div className="w-full rounded-2xl bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90 transition-all duration-300">
        {/* Card Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
            Welcome Back!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Login to continue to SAN TRACK
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {/* Username Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700"
            >
              Username
            </label>
            <input
              id="email"
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              {...form.register("email")}
              className="w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
            />
            {errors.email ? (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
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
            {errors.password ? (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="rememberMe"
                {...form.register("rememberMe")}
                className="size-4 rounded border-slate-300 text-[#067eda] focus:ring-[#067eda]/20 cursor-pointer transition-colors"
              />
              <span className="text-xs text-slate-600 font-normal">
                Remember me
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#0077c8] hover:text-[#005ba6] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Error Banner */}
          {login.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs font-medium text-red-700">
              {getApiErrorMessage(login.error, "Invalid username or password")}
            </div>
          ) : null}

          {/* Rwanda Gradient Login Button */}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full h-11 sm:h-12 mt-2 rounded-lg font-semibold text-white text-sm sm:text-base tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 hover:shadow-lg hover:shadow-sky-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {login.isPending ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin text-white" />
                Signing in…
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* "or continue with" Divider */}
          <div className="relative flex items-center justify-center pt-3 pb-1">
            <div className="w-full border-t border-slate-200/80" />
            <span className="absolute bg-white px-3 text-[11px] text-slate-400 font-normal">
              or continue with
            </span>
          </div>

          {/* Social SSO Buttons (Google & Microsoft) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              className="h-11 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-700 transition-all duration-150 cursor-pointer shadow-xs"
            >
              <GoogleIcon className="size-4" />
              <span>Google</span>
            </button>

            <button
              type="button"
              className="h-11 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-700 transition-all duration-150 cursor-pointer shadow-xs"
            >
              <MicrosoftIcon className="size-3.5" />
              <span>Microsoft</span>
            </button>
          </div>
        </form>

        {/* Link to Register */}
        <p className="mt-5 text-center text-xs text-slate-500">
          New to San Track?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#067eda] hover:text-[#005ba6] hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer Copyright */}
      <footer className="mt-7 text-center">
        <p className="text-xs text-slate-400 font-normal">
          &copy; 2026 SAN TECH. All rights reserved.
        </p>
      </footer>
    </AuthShell>
  );
}
