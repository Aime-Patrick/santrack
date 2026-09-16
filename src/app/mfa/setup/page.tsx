"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import { useBeginMfaSetup, useConfirmMfaSetup, useMe } from "@/hooks/auth";
import { getAuthToken, hasSessionMarker } from "@/lib/auth";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MfaSetupResult } from "@/services/auth.service";

const schema = z.object({
  code: z.string().trim().min(6, "Enter the 6-digit code").max(8),
});

type FormValues = z.infer<typeof schema>;

export default function MfaSetupPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const begin = useBeginMfaSetup();
  const confirm = useConfirmMfaSetup();
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);

  useEffect(() => {
    if (!getAuthToken() && !hasSessionMarker()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && me && !me.mustEnableMfa && me.mfaEnabled) {
      router.replace("/dashboard");
    }
  }, [isLoading, me, router]);

  useEffect(() => {
    begin.mutate(undefined, {
      onSuccess: setSetup,
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Could not start MFA setup")),
    });
    // Start enrollment once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    confirm.mutate(values.code, {
      onSuccess: () => {
        toast.success("Authenticator enabled");
        router.replace("/dashboard");
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Invalid code — try again")),
    });
  });

  return (
    <AuthShell>
      <div className="w-full rounded-2xl border border-slate-100/90 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-9">
        <h1 className="text-xl font-bold text-foreground">Enable authenticator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System admins and regulator staff must protect their account with a
          one-time code app (Google Authenticator, Microsoft Authenticator, etc.).
        </p>

        {setup ? (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrDataUrl} alt="MFA QR code" className="size-48" />
            </div>
            <p className="text-center font-mono text-xs text-muted-foreground break-all">
              {setup.secret}
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Confirm with a code from the app</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="font-mono tracking-widest"
                  {...form.register("code")}
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-danger">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>
              <AuthPrimaryButton type="submit" disabled={confirm.isPending}>
                {confirm.isPending ? "Enabling…" : "Enable MFA"}
              </AuthPrimaryButton>
            </form>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Preparing QR code…</p>
        )}
      </div>
    </AuthShell>
  );
}
