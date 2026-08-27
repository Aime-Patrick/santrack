"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useChangePassword, useMe } from "@/hooks/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthToken } from "@/lib/auth";
import { useEffect } from "react";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your temporary password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getAuthToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && me && !me.mustChangePassword) {
      if (me.role === "SYSTEM_ADMIN" || me.organization) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isLoading, me, router]);

  const onSubmit = form.handleSubmit((values) => {
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
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

  const errors = form.formState.errors;

  return (
    <AuthShell>
      <div className="w-full rounded-2xl border border-slate-100/90 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-9">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Set a new password
          </h1>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Your account was created with a temporary password. Choose one only
            you know before continuing.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-700">
              Temporary password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...form.register("currentPassword")}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.currentPassword ? (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700">
              New password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...form.register("newPassword")}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword ? (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...form.register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          {changePassword.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(changePassword.error, "Could not update password")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {changePassword.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              "Save and continue"
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
