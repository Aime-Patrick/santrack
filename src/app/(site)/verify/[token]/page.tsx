"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { VerifyResult } from "@/services/trace.service";
import { ReportProductIssue } from "@/components/verify/report-product-issue";
import { TrustSeal, type TrustSealTone } from "@/components/verify/trust-seal";

function useVerify(token: string) {
  return useQuery<VerifyResult>({
    queryKey: ["verify", token],
    queryFn: () =>
      api.get(`/api/verify/${encodeURIComponent(token)}`).then((response) => response.data),
    enabled: Boolean(token),
    retry: false,
  });
}

function normalizeClientToken(raw: string): string {
  let token = raw.trim().replace(/^["']|["']$/g, "");
  try {
    token = decodeURIComponent(token);
  } catch {
    // Keep the raw value when it is not encoded.
  }
  token = token.trim();
  if (token.includes("/verify/")) {
    token = token.split("/verify/").pop()?.split("?")[0].split("#")[0].trim() ?? token;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return token.toLowerCase();
  }
  return token;
}

export default function VerifyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = normalizeClientToken(use(params).token);
  const { data, isLoading, error } = useVerify(token);

  return (
    /*
     * Child of `(site)` layout — LandingNav + FooterSection wrap this page.
     * Brand chrome lives in the nav/footer; this page owns only the certificate.
     */
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--color-rwanda-yellow) 8%, transparent), transparent 40%)",
        }}
        aria-hidden
      />

      {/* Clear fixed nav, then a thin flag accent before page content */}
      <div className="relative pt-16" aria-hidden="true">
        <div className="flex h-1.5">
          <span className="flex-1 bg-rwanda-blue" />
          <span className="flex-1 bg-rwanda-yellow" />
          <span className="flex-1 bg-rwanda-green" />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-lg flex-1 px-4 pb-12 pt-5 sm:px-8 sm:pb-16 sm:pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              Authenticity check
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Public product verification
            </p>
          </div>
          <Link
            href="/verify"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ScanLine className="size-3.5" />
            Scan another
          </Link>
        </header>

        <main className="mt-6 min-w-0 sm:mt-8">
          {isLoading ? <LoadingState /> : null}
          {error ? (
            <NotFoundState
              token={token}
              message="This code could not be matched to a registered product."
            />
          ) : null}
          {data ? <VerifyCertificate token={token} result={data} /> : null}
        </main>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="flex min-h-[16rem] flex-col items-center justify-center px-2 text-center sm:min-h-[22rem]">
      <TrustSeal size="lg" tone="neutral" animate />
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
        Checking this seal…
      </div>
    </section>
  );
}

function NotFoundState({
  token,
  message,
  scanCount,
  firstScan,
}: {
  token: string;
  message: string;
  scanCount?: number;
  firstScan?: boolean;
}) {
  return (
    <section className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6 sm:px-7 sm:py-8">
      <TrustSeal size="lg" tone="danger" animate label="Not in the registry" />
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-danger">
        <ShieldAlert className="size-3.5 shrink-0" />
        <span>Code not recognised</span>
      </div>
      <h1 className="mt-3 text-balance text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        We could not verify this product
      </h1>
      <p className="mx-auto mt-3 max-w-md text-pretty text-center text-sm leading-6 text-muted-foreground">
        {message}
      </p>

      {typeof scanCount === "number" && scanCount > 0 ? (
        <p className="mx-auto mt-4 max-w-sm text-pretty text-center text-xs text-muted-foreground">
          {firstScan
            ? "This is the first time this unknown code was checked."
            : `This unknown code has been checked ${scanCount} times.`}
        </p>
      ) : null}

      <div className="mx-auto mt-6 max-w-full break-all rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
        {token}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Do not buy or use the product until its seal is confirmed.
      </p>

      <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <Link
          href="/verify"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Scan another product
        </Link>
        <ReportProductIssue token={token} compact />
      </div>
    </section>
  );
}

function VerifyCertificate({ token, result }: { token: string; result: VerifyResult }) {
  if (!result.known) {
    return (
      <NotFoundState
        token={token}
        message={result.verdict || "This code has no matching record in the product registry."}
        scanCount={result.scanCount}
        firstScan={result.firstScan}
      />
    );
  }

  const isSold =
    result.itemStatus === "SOLD" ||
    result.verdict?.toLowerCase().includes("sold") ||
    result.verdict?.toLowerCase().includes("consumer");
  const isInTransit = result.itemStatus === "IN_TRANSIT";
  const isVerified = !result.recalled && !result.expired && (!result.blocked || isSold);
  const tone: TrustSealTone = result.recalled
    ? "danger"
    : result.expired || !isVerified
      ? "warning"
      : isInTransit
        ? "info"
        : "success";

  const statusLabel = result.recalled
    ? "Recalled"
    : result.expired
      ? "Expired"
      : isSold
        ? "Verified · sold"
        : isInTransit
          ? "Verified · in transit"
          : result.itemStatus === "GENERATED"
            ? "Not activated"
            : result.itemStatus === "ASSIGNED"
              ? "Production pending"
              : isVerified
                ? "Genuine seal"
                : "Needs review";

  const summary = result.recalled
    ? "This batch has an active recall. Do not buy, use, or consume it."
    : result.expired
      ? `This product passed its expiry date on ${formatDate(result.expiresOn)}.`
      : isSold
        ? "This seal matches a registered unit that has already been marked sold."
        : isInTransit
          ? "This seal matches a registered unit currently in transit."
          : result.itemStatus === "GENERATED"
            ? "This seal is real, but it has not been assigned to a production lot yet. It does not verify a finished product."
            : result.itemStatus === "ASSIGNED"
              ? "This seal is assigned to a production run, but the product has not been cleared yet."
              : isVerified
                ? "This seal matches one registered unit in the SanTrack registry."
                : "This record needs review before the product can be cleared.";

  const batchLabel =
    result.batchCode ||
    (result.itemStatus === "GENERATED"
      ? "Not assigned yet"
      : result.itemStatus === "ASSIGNED"
        ? "Pending production"
        : "Unavailable");

  const scanCount = result.scanCount ?? 0;
  const scanSignal =
    result.firstScan || scanCount === 1
      ? {
          title: "First check of this seal",
          detail: "No earlier public scan is on record for this exact code.",
          caution: false,
        }
      : scanCount >= 8
        ? {
            title: `Checked ${scanCount} times`,
            detail:
              "A sealed unit in a shop is usually checked rarely. A high count can mean a display bottle — or a copied label. Ask the seller to open a fresh sealed unit.",
            caution: true,
          }
        : scanCount >= 2
          ? {
              title: `Checked ${scanCount} times`,
              detail: "Earlier public checks of this exact seal are already on record.",
              caution: false,
            }
          : null;

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card/90 px-4 py-6 shadow-xs backdrop-blur-sm sm:px-8 sm:py-8">
        <TrustSeal
          size="xl"
          tone={tone}
          animate
          label={result.code ? `Seal · ${result.code}` : "Registered seal"}
        />

        <div
          className={cn(
            "mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] sm:mt-6",
            tone === "success" && "text-success",
            tone === "info" && "text-primary",
            tone === "warning" && "text-warning-foreground",
            tone === "danger" && "text-danger",
          )}
        >
          {tone === "danger" || tone === "warning" ? (
            <ShieldAlert className="size-3.5 shrink-0" />
          ) : (
            <ShieldCheck className="size-3.5 shrink-0" />
          )}
          <span className="text-center">{statusLabel}</span>
        </div>

        <h1 className="mt-3 text-balance break-words text-center text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {result.productName || "Registered product"}
        </h1>
        {result.productSku ? (
          <p className="mt-2 break-all text-center font-mono text-xs text-muted-foreground">
            {result.productSku}
          </p>
        ) : null}
        <p
          className={cn(
            "mx-auto mt-4 max-w-md text-pretty text-center text-sm leading-6",
            tone === "danger" ? "font-medium text-danger" : "text-muted-foreground",
          )}
        >
          {summary}
        </p>

        {scanSignal ? (
          <div
            className={cn(
              "mx-auto mt-6 max-w-md rounded-lg border px-4 py-3 text-center",
              scanSignal.caution
                ? "border-warning/40 bg-warning/10"
                : "border-border bg-muted/50",
            )}
          >
            <p className="text-xs font-semibold text-foreground">{scanSignal.title}</p>
            <p className="mt-1 text-pretty text-[11px] leading-5 text-muted-foreground">
              {scanSignal.detail}
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <RecordField label="Serial code" value={result.code || "Not provided"} mono />
          <RecordField label="Batch" value={batchLabel} mono />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {result.manufacturer ? <RecordRow label="Manufacturer" value={result.manufacturer} /> : null}
        {result.facilityName ? (
          <RecordRow label="Production location" value={result.facilityName} />
        ) : null}
        {result.manufacturedOn ? (
          <RecordRow label="Production date" value={formatDate(result.manufacturedOn)} />
        ) : null}
        {result.expiresOn ? (
          <RecordRow label="Expiry date" value={formatDate(result.expiresOn)} emphasis={result.expired} />
        ) : null}
        <RecordRow label="Record status" value={statusLabel} />
      </section>

      <details className="group rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          Seal checks
          <span
            className="text-lg font-normal leading-none text-faint transition-transform group-open:rotate-45"
            aria-hidden
          >
            +
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <CheckRow
            label="Authenticity signature"
            ok
            detail="Serial registered in the SanTrack unit identity registry"
          />
          <CheckRow
            label="Recall clearance"
            ok={!result.recalled}
            detail={
              result.recalled
                ? "Batch flagged for an active recall"
                : "No recall notice on this batch"
            }
          />
          <CheckRow
            label="Shelf life"
            ok={!result.expired}
            detail={
              result.expired
                ? `Expired on ${formatDate(result.expiresOn)}`
                : result.expiresOn
                  ? `Valid through ${formatDate(result.expiresOn)}`
                  : "No expiry date recorded"
            }
          />
        </div>
      </details>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <Link
          href="/verify"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Scan another product
        </Link>
        <ReportProductIssue token={token} compact />
      </div>

      <p className="break-all px-1 text-center text-[11px] text-faint">
        Public verification · each unit seal is unique · {token.slice(0, 18)}
        {token.length > 18 ? "…" : ""}
      </p>
    </div>
  );
}

function RecordField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{label}</p>
      <p
        className={cn(
          "mt-1 break-words text-sm font-semibold text-foreground",
          mono && "break-all font-mono text-xs font-medium",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RecordRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 py-3.5 text-sm last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-0 break-words font-medium text-foreground sm:text-right",
          emphasis && "text-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CheckRow({ label, detail, ok }: { label: string; detail: string; ok: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn("mt-1 size-2 shrink-0 rounded-full", ok ? "bg-success" : "bg-danger")}
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
