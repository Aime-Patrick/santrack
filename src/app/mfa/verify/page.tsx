"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { useVerifyMfaLogin } from "@/hooks/auth";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  code: z.string().trim().min(6, "Enter the 6-digit code").max(8),
});

type FormValues = z.infer<typeof schema>;

export default function MfaVerifyPage() {
  const router = useRouter();
  const verify = useVerifyMfaLogin();
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("santrack_mfa_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setMfaToken(token);
  }, [router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!mfaToken) return;
    verify.mutate(
      { mfaToken, code: values.code },
      {
        onSuccess: (data) => {
          sessionStorage.removeItem("santrack_mfa_token");
          sessionStorage.removeItem("santrack_mfa_nudge_dismissed");
          if (data.user.mustChangePassword) {
            router.replace("/change-password");
            return;
          }
          router.replace("/dashboard");
        },
      },
    );
  });

  return (
    <AuthShell>
      <div className="w-full rounded-2xl border border-slate-100/90 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-9">
        <h1 className="text-xl font-bold text-foreground">Authenticator code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="font-mono tracking-widest"
              {...form.register("code")}
            />
            {form.formState.errors.code && (
              <p className="text-xs text-danger">{form.formState.errors.code.message}</p>
            )}
          </div>
          {verify.isError && (
            <p className="text-xs text-danger">
              {getApiErrorMessage(verify.error, "Invalid code")}
            </p>
          )}
          <AuthPrimaryButton type="submit" disabled={verify.isPending || !mfaToken}>
            {verify.isPending ? "Verifying…" : "Verify and continue"}
          </AuthPrimaryButton>
        </form>
      </div>
    </AuthShell>
  );
}
