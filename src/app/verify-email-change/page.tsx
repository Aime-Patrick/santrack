"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useVerifyEmailChange } from "@/hooks/auth";
import { AuthShell } from "@/components/auth/auth-shell";

function VerifyEmailChangeBody() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verify = useVerifyEmailChange();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!token || started) return;
    setStarted(true);
    verify.mutate(token, {
      onSuccess: (result) => setEmail(result.email),
      onError: (err) =>
        setError(
          getApiErrorMessage(
            err,
            "This verification link is invalid or has expired.",
          ),
        ),
    });
    // Intentionally once per token — mutate identity is unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, started]);

  if (!token) {
    return (
      <StatusCard
        tone="error"
        title="Invalid verification link"
        message="This link is missing its token. Request a new email change from Settings."
      />
    );
  }

  if (error) {
    return (
      <StatusCard
        tone="error"
        title="Could not verify email"
        message={error}
      />
    );
  }

  if (email) {
    return (
      <StatusCard
        tone="success"
        title="Email updated"
        message={`Your sign-in email is now ${email}. Use it the next time you log in.`}
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center rounded-2xl border border-slate-100/90 bg-white p-9 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <Loader2 className="size-8 animate-spin text-slate-400" />
      <p className="mt-4 text-sm font-medium text-slate-600">
        Confirming your new email…
      </p>
    </div>
  );
}

function StatusCard({
  tone,
  title,
  message,
}: {
  tone: "success" | "error";
  title: string;
  message: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-100/90 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-9">
      <div className="flex flex-col items-center text-center">
        <div
          className={
            tone === "success"
              ? "flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white"
              : "flex size-14 items-center justify-center rounded-full bg-danger text-white"
          }
        >
          {tone === "success" ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <XCircle className="size-7" />
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
          {title}
        </h1>
        <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">
          {message}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex justify-center p-10">
            <Loader2 className="size-6 animate-spin text-slate-400" />
          </div>
        }
      >
        <VerifyEmailChangeBody />
      </Suspense>
    </AuthShell>
  );
}
