"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/lib/api";
import { useLogin, useRequestPasswordReset } from "@/hooks/auth";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCardBrand, GoogleIcon, MicrosoftIcon } from "@/components/auth/san-track-logo";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your username or email"),
  password: z.string().min(1, "Please enter your password"),
  rememberMe: z.boolean().optional(),
});

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotFormValues = z.infer<typeof forgotSchema>;

type View = "login" | "forgot";

/** Shared card chrome — each view is its own card so the whole card slides. */
const CARD =
  "w-full rounded-2xl bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/90";

/** Whole-card slide: forward (to forgot) exits left / enters from the right. */
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%" }),
};

const slideTransition = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<View>("login");
  // +1 = toward forgot-password, -1 = back toward login.
  const [direction, setDirection] = useState<1 | -1>(1);
  // Email a reset link was just sent to (drives the success state).
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  const login = useLogin();
  const requestReset = useRequestPasswordReset();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const errors = form.formState.errors;
  const forgotErrors = forgotForm.formState.errors;

  const goToForgot = () => {
    setResetSentTo(null);
    forgotForm.clearErrors();
    setDirection(1);
    setView("forgot");
  };

  const goToLogin = () => {
    setDirection(-1);
    setView("login");
  };

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (data) => {
          if ("mfaRequired" in data && data.mfaRequired) {
            sessionStorage.setItem("santrack_mfa_token", data.mfaToken);
            router.replace("/mfa/verify");
            return;
          }
          if (!("user" in data)) return;
          // Fresh login — allow the security nudge to show again this session.
          sessionStorage.removeItem("santrack_mfa_nudge_dismissed");
          if (data.user.mustChangePassword) {
            router.replace("/change-password");
            return;
          }
          if (data.user.role === "SYSTEM_ADMIN" || data.user.organization) {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        },
      },
    );
  });

  const onForgotSubmit = forgotForm.handleSubmit((values) => {
    setResetSentTo(null);
    requestReset.mutate(values.email, {
      onSuccess: () => setResetSentTo(values.email),
    });
  });

  return (
    <AuthShell>
      {/* The whole card slides: the login card leaves to the left while the
          forgot-password card arrives from the right. mode="wait" keeps the
          two cards from overlapping mid-turn. */}
      <motion.div
        layout
        transition={{ layout: { type: "spring", stiffness: 340, damping: 34 } }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {view === "login" ? (
            /* ────────────────────────── Login card ─────────────────────── */
            <motion.div
              key="login"
              className={CARD}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
                <AuthCardBrand />
                {/* Card Header */}
                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {t("welcomeBack")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {t("subtitle")}
                  </p>
                </div>

                {/* Login Form */}
                <form
                  onSubmit={onSubmit}
                  className="mt-4 space-y-3"
                  noValidate
                >
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      {t("username")}
                    </label>
                    <input
                      id="email"
                      type="text"
                      placeholder={t("usernamePlaceholder")}
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
                      {t("password")}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("passwordPlaceholder")}
                        autoComplete="current-password"
                        {...form.register("password")}
                        className="w-full h-11 pl-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
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
                        {t("rememberMe")}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={goToForgot}
                      className="text-xs font-semibold text-[#0077c8] hover:text-[#005ba6] transition-colors cursor-pointer"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>

                  {/* Error Banner */}
                  {login.isError ? (
                   <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                     {getApiErrorMessage(
                        login.error,
                        t("loginError"),
                      )}
                    </div>
                  ) : null}

                  {/* Rwanda Gradient Login Button */}
                  <AuthPrimaryButton
                    disabled={login.isPending}
                    loading={login.isPending}
                    loadingLabel={t("signingIn")}
                    className="mt-1"
                  >
                    {t("loginButton")}
                  </AuthPrimaryButton>
                </form>

                {/* SSO + footer link slide with the form */}
                <div className="mt-4">
                  {/* "or continue with" Divider */}
                  <div className="relative flex items-center justify-center pb-1">
                    <div className="w-full border-t border-slate-200/80" />
                    <span className="absolute bg-white px-3 text-[11px] text-slate-400 font-normal">
                      {t("orContinueWith")}
                    </span>
                  </div>

                  {/* Social SSO Buttons (Google & Microsoft) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      className="h-10 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-700 transition-all duration-150 cursor-pointer shadow-xs"
                    >
                      <GoogleIcon className="size-4" />
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      className="h-10 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-700 transition-all duration-150 cursor-pointer shadow-xs"
                    >
                      <MicrosoftIcon className="size-3.5" />
                      <span>Microsoft</span>
                    </button>
                  </div>
                </div>

                {/* Link to Register */}
                <p className="mt-3.5 text-center text-xs text-slate-500">
                  {t("newToSanTrack")}{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#067eda] hover:text-[#005ba6] hover:underline transition-colors"
                  >
                    {t("createAccount")}
                  </Link>
                </p>
              </motion.div>
            ) : (
            /* ──────────────────────── Forgot card ──────────────────────── */
            <motion.div
              key="forgot"
              className={CARD}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
                <AuthCardBrand />
                {resetSentTo ? (
                  /* Sent confirmation */
                  <div className="flex flex-col items-center text-center pt-1 pb-2">
                    <div className="flex size-14 items-center justify-center rounded-full bg-success text-white">
                      <MailCheck className="size-7" />
                    </div>
                    <h1 className="mt-4 text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
                      {t("checkEmail")}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-[300px]">
                      {t("checkEmailDesc", { email: resetSentTo ?? "" })}
                    </p>

                    <AuthPrimaryButton
                      type="button"
                      onClick={() => setResetSentTo(null)}
                      className="mt-5"
                    >
                      {t("sendAnotherLink")}
                    </AuthPrimaryButton>
                    <button
                      type="button"
                      onClick={goToLogin}
                      className="mt-2 h-11 w-full rounded-lg font-semibold text-slate-600 text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      {t("backToLogin")}
                    </button>
                  </div>
                ) : (
                  /* Request form */
                  <>
                    {/* Card Header */}
                    <div className="space-y-0.5">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        {t("forgotTitle")}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        {t("forgotSubtitle")}
                      </p>
                    </div>

                    <form
                      onSubmit={onForgotSubmit}
                      className="mt-4 space-y-3"
                      noValidate
                    >
                      {/* Email Field */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="forgot-email"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          {t("emailLabel")}
                        </label>
                        <input
                          id="forgot-email"
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          autoComplete="email"
                          autoFocus
                          {...forgotForm.register("email")}
                          className="w-full h-11 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-150 focus:border-[#067eda] focus:ring-3 focus:ring-[#067eda]/15 hover:border-slate-300"
                        />
                        {forgotErrors.email ? (
                          <p className="text-xs font-medium text-red-500 mt-1">
                            {forgotErrors.email.message}
                          </p>
                        ) : null}
                      </div>

                      {/* Error Banner */}
                      {requestReset.isError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                          {getApiErrorMessage(
                            requestReset.error,
                            t("resetError"),
                          )}
                        </div>
                      ) : null}

                      {/* Send Reset Link Button */}
                      <AuthPrimaryButton
                        disabled={requestReset.isPending}
                        loading={requestReset.isPending}
                        loadingLabel={t("sending")}
                        className="mt-2"
                      >
                        {t("sendResetLink")}
                      </AuthPrimaryButton>

                      {/* Back to Login */}
                      <button
                        type="button"
                        onClick={goToLogin}
                        className="w-full h-11 rounded-lg font-semibold text-slate-600 text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="size-4" />
                        {t("backToLogin")}
                      </button>
                    </form>
                  </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Copyright */}
      <footer className="mt-4 text-center">
        <p className="text-xs text-slate-400 font-normal">
          {t("copyright")}
        </p>
      </footer>
    </AuthShell>
  );
}
