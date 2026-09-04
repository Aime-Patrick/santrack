"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Package,
  Factory,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { VerifyResult } from "@/services/trace.service";
import { ReportProductIssue } from "@/components/verify/report-product-issue";

function useVerify(token: string) {
  return useQuery<VerifyResult>({
    queryKey: ["verify", token],
    queryFn: () =>
      api
        .get(`/api/verify/${encodeURIComponent(token)}`)
        .then((r) => r.data),
    enabled: !!token,
    retry: false,
  });
}

function normalizeClientToken(raw: string): string {
  let token = raw.trim().replace(/^["']|["']$/g, "");
  try {
    token = decodeURIComponent(token);
  } catch {
    // keep
  }
  token = token.trim();
  if (token.includes("/verify/")) {
    token =
      token.split("/verify/").pop()?.split("?")[0].split("#")[0].trim() ?? token;
  }
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  ) {
    return token.toLowerCase();
  }
  return token;
}

function RwandaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full bg-white px-2.5 shadow-xs",
        className,
      )}
    >
      <i className="h-3.5 w-1 rounded-full bg-rwanda-blue" />
      <i className="h-3.5 w-1 rounded-full bg-rwanda-yellow" />
      <i className="h-3.5 w-1 rounded-full bg-rwanda-green" />
    </span>
  );
}

export default function VerifyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = normalizeClientToken(use(params).token);
  const { data, isLoading, error } = useVerify(token);

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-5">
      {/* ── Flag edge ── */}
      <div className="flex h-1.5">
        <span className="flex-1 bg-rwanda-blue" />
        <span className="flex-1 bg-rwanda-yellow" />
        <span className="flex-1 bg-rwanda-green" />
      </div>

      <div className="mx-auto max-w-lg">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between py-4">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            <span>Scan another</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <RwandaMark />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
              Checking the registry…
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <NotFoundState
            token={token}
            message="This code could not be resolved. It may be invalid or corrupted."
          />
        )}

        {/* Success / Result Content */}
        {data && <VerifyCertificate token={token} result={data} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function NotFoundState({ token, message }: { token: string; message: string }) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="w-full rounded-[1.75rem] bg-danger text-white">
        <div className="space-y-3 p-7 text-center">
          <ShieldX className="mx-auto size-9" />
          <h2 className="text-2xl font-extrabold tracking-tight">
            Not in the registry
          </h2>
          <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-white/85">
            {message}
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-full break-all rounded-full bg-slate-900 px-4 py-2 font-mono text-[11px] text-white">
        {token}
      </p>

      <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-slate-600">
        If you purchased this product, do not use it. Report it to the Rwanda
        Standards Board and keep the label.
      </p>

      <div className="mt-5 flex w-full gap-2.5">
        <Link href="/verify" className="flex-1">
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl border-slate-200 bg-white text-xs font-bold text-slate-800"
          >
            Scan another
          </Button>
        </Link>
        <div className="flex-1">
          <ReportProductIssue token={token} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Digital Certificate (borderless)
// ---------------------------------------------------------------------------

type HeroStyle = {
  panel: string;
  chip: string;
};

const HERO_STYLES: Record<string, HeroStyle> = {
  recalled: { panel: "bg-danger text-white", chip: "bg-white text-danger" },
  expired: {
    panel: "bg-warning text-warning-foreground",
    chip: "bg-white text-warning-foreground",
  },
  verified: { panel: "bg-success text-white", chip: "bg-white text-success" },
  inTransit: { panel: "bg-primary text-white", chip: "bg-white text-primary" },
};

function VerifyCertificate({
  token,
  result,
}: {
  token: string;
  result: VerifyResult;
}) {
  if (!result.known) {
    return (
      <NotFoundState
        token={token}
        message={
          result.verdict ||
          "This code has no matching record in the national traceability registry."
        }
      />
    );
  }

  const isRecalled = result.recalled;
  const isExpired = result.expired;
  const isSold =
    result.itemStatus === "SOLD" ||
    result.verdict?.toLowerCase().includes("sold") ||
    result.verdict?.toLowerCase().includes("consumer");
  const isInTransit = result.itemStatus === "IN_TRANSIT";
  const isGood = !isRecalled && !isExpired && (!result.blocked || isSold);

  const hero: HeroStyle = isRecalled
    ? HERO_STYLES.recalled
    : isExpired
      ? HERO_STYLES.expired
      : isSold
        ? HERO_STYLES.verified
        : isInTransit
          ? HERO_STYLES.inTransit
          : isGood
            ? HERO_STYLES.verified
            : HERO_STYLES.expired;

  const verdictLabel = isRecalled
    ? "Recalled"
    : isExpired
      ? "Expired"
      : isSold
        ? "Verified · Sold"
        : isInTransit
          ? "Verified · In transit"
          : isGood
            ? "Verified"
            : "Under inspection";

  const headline = isRecalled
    ? "Do not use this product"
    : isExpired
      ? "This product has expired"
      : isSold
        ? "Genuine — already purchased"
        : isInTransit
          ? "Genuine — in transit"
          : "Genuine product";

  const blurb = isRecalled
    ? "This batch has been recalled from the market. Do not purchase or consume it, and report any stock you still hold."
    : isExpired
      ? `This product passed its expiry date on ${formatDate(result.expiresOn)}. Do not use it.`
      : isSold
        ? "Verified authentic and scanned as sold to a consumer."
        : isInTransit
          ? "Verified authentic and moving between certified facilities."
          : (result.verdict || "This product is verified authentic. Details below.");

  const HeroIcon = isRecalled
    ? ShieldX
    : isExpired
      ? ShieldAlert
      : isSold || isGood
        ? ShieldCheck
        : ShieldAlert;

  return (
    <div className="space-y-7 pb-10">
      {/* ── Verdict hero (solid, no card chrome) ── */}
      <section
        className={cn(
          "overflow-hidden rounded-[1.75rem] shadow-lg",
          hero.panel,
        )}
      >
        <div className="flex items-start gap-4 p-6">
          <span
            className={cn(
              "flex size-13 shrink-0 items-center justify-center rounded-2xl shadow-md",
              hero.chip,
            )}
          >
            <HeroIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-80">
              {verdictLabel}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed opacity-85">
              {blurb}
            </p>
          </div>
        </div>
      </section>

      {/* ── Product identity ── */}
      <section>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
          Product
        </p>
        <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
          {result.productName || "Unknown product"}
        </h3>
        {result.productSku && (
          <p className="mt-1 font-mono text-xs text-slate-500">
            {result.productSku}
          </p>
        )}
      </section>

      {/* ── Record rows ── */}
      <section className="divide-y divide-slate-200">
        {result.code && (
          <InfoRow icon={Package} label="Serial code" value={result.code} mono />
        )}
        <InfoRow
          icon={CheckCircle2}
          label="Verification status"
          value={verdictLabel}
          suffix={
            <Badge
              className={cn(
                "h-5 rounded-full px-2 text-[10px] font-extrabold uppercase",
                isRecalled
                  ? "bg-danger text-white"
                  : isExpired
                    ? "bg-warning text-warning-foreground"
                    : "bg-success text-white",
              )}
            >
              {isRecalled ? "Recalled" : isExpired ? "Expired" : "Verified"}
            </Badge>
          }
        />
        {result.manufacturer && (
          <InfoRow
            icon={Factory}
            label="Manufacturer"
            value={result.manufacturer}
          />
        )}
        {result.facilityName && (
          <InfoRow
            icon={Building2}
            label="Production location"
            value={result.facilityName}
          />
        )}
        {result.batchCode && (
          <InfoRow
            icon={Package}
            label="Batch"
            value={result.batchCode}
            suffix={
              result.batchStatus ? (
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                  {result.batchStatus}
                </span>
              ) : null
            }
          />
        )}
        {result.manufacturedOn && (
          <InfoRow
            icon={Calendar}
            label="Production date"
            value={formatDate(result.manufacturedOn)}
          />
        )}
        {result.expiresOn && (
          <InfoRow
            icon={Clock}
            label="Expiry date"
            value={formatDate(result.expiresOn)}
            highlight={isExpired}
          />
        )}
      </section>

      {/* ── Compliance checks (no box) ── */}
      <section className="space-y-3.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
          Compliance &amp; standards
        </p>
        <StatusRow
          icon={CheckCircle2}
          label="Authenticity signature"
          ok
          detail="Digital serial registered with the national traceability registry"
        />
        <StatusRow
          icon={isRecalled ? XCircle : CheckCircle2}
          label="Safety & recall clearance"
          ok={!isRecalled}
          detail={
            isRecalled
              ? "Batch flagged for an active recall"
              : "No recall notices on this batch"
          }
        />
        <StatusRow
          icon={isExpired ? XCircle : CheckCircle2}
          label="Shelf life"
          ok={!isExpired}
          detail={
            isExpired
              ? `Expired on ${formatDate(result.expiresOn)}`
              : result.expiresOn
                ? `Valid through ${formatDate(result.expiresOn)}`
                : "Standard shelf life"
          }
        />
      </section>

      {/* ── Actions ── */}
      <section className="flex items-center justify-between gap-2.5">
        <Link href="/verify" className="flex-1">
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            Scan another
          </Button>
        </Link>
        <div className="flex-1">
          <ReportProductIssue token={token} />
        </div>
      </section>

      <p className="pt-1 text-center font-mono text-[10px] text-slate-400">
        Certificate token · {token}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: React.ReactNode;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5 text-slate-500">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-light">
          <Icon className="size-3.5 text-primary" />
        </span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-right">
        <span
          className={cn(
            "truncate text-[13px] font-bold",
            mono && "font-mono text-xs",
            highlight ? "text-danger" : "text-slate-900",
          )}
        >
          {value}
        </span>
        {suffix}
      </div>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  ok,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-success" : "bg-danger",
        )}
      >
        <Icon className="size-3 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-bold text-slate-800">{label}</span>
        <p className="text-xs leading-relaxed text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
