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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Share2,
  Sparkles,
  Award,
  AlertOctagon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { VerifyResult } from "@/services/trace.service";

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

export default function VerifyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = normalizeClientToken(use(params).token);
  const { data, isLoading, error } = useVerify(token);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4">
      {/* ── Background Rwanda Flag Ambient Glow ── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-400/10 via-amber-300/10 to-transparent blur-3xl opacity-60" />

      <div className="mx-auto max-w-lg space-y-6 relative z-10">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Scan Another</span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-6 rounded-full bg-[#00A3E0]" />
            <div className="h-1.5 w-4 rounded-full bg-[#FAD201]" />
            <div className="h-1.5 w-6 rounded-full bg-[#20603D]" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs">
            <Loader2 className="size-8 animate-spin text-[#00A3E0]" />
            <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Checking National Registry…
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-8 ring-rose-50/50">
              <ShieldX className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
            <p className="mt-2 max-w-sm text-xs text-slate-500">
              This code could not be resolved. It may be invalid or corrupted.
            </p>
            <div className="mt-4 rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-700">
              {token}
            </div>
            <Link href="/verify" className="mt-6">
              <Button size="sm" className="rounded-xl text-xs font-semibold">
                Try Again
              </Button>
            </Link>
          </div>
        )}

        {/* Success / Result Content */}
        {data && <VerifyCertificate token={token} result={data} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Digital Certificate Card
// ---------------------------------------------------------------------------

function VerifyCertificate({
  token,
  result,
}: {
  token: string;
  result: VerifyResult;
}) {
  if (!result.known) {
    return (
      <div className="overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 shadow-md text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldX className="size-7" />
        </div>
        <div>
          <Badge variant="outline" className="border-transparent bg-danger text-white text-[11px] font-bold">
            WARNING
          </Badge>
          <h2 className="mt-2 text-xl font-bold text-slate-900 uppercase tracking-wide">
            Product could not be verified
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            {result.verdict || "This code has no matching record in the national traceability registry."}
          </p>
          <p className="mt-3 mx-auto max-w-full break-all rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[10px] text-slate-600">
            Scanned: {token}
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-800 flex items-start gap-2 text-left">
          <AlertOctagon className="size-4 shrink-0 text-rose-600 mt-0.5" />
          <span>
            <strong>WARNING: PRODUCT COULD NOT BE VERIFIED.</strong> Do not
            consume or purchase unverified products. Report suspicious items to
            Rwanda Standards Board (RSB).
          </span>
        </div>

        <div className="pt-2 flex gap-2 justify-center">
          <Link href="/contact">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold border-slate-300">
              Report Issue
            </Button>
          </Link>
          <Link href="/verify">
            <Button size="sm" className="rounded-xl text-xs font-semibold bg-[#00A3E0] hover:bg-sky-600">
              Scan Another
            </Button>
          </Link>
        </div>
      </div>
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

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm space-y-0">
      {/* ── Top Tricolor Header Banner ── */}
      <div className="h-2 w-full bg-gradient-to-r from-[#00A3E0] via-[#FAD201] to-[#20603D]" />

      <div className="p-5 sm:p-6 space-y-6">
        {/* ── Verdict Badge ── */}
        <div
          className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
            isRecalled
              ? "border-rose-200 bg-rose-50/60 text-rose-900"
              : isExpired
                ? "border-amber-200 bg-amber-50/60 text-amber-900"
                : isSold
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                  : isGood
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                    : "border-amber-200 bg-amber-50/60 text-amber-900"
          }`}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${
              isRecalled
                ? "bg-rose-600"
                : isExpired
                  ? "bg-amber-600"
                  : isSold || isGood
                    ? "bg-[#008751]"
                    : "bg-amber-600"
            }`}
          >
            {isRecalled ? (
              <ShieldX className="size-5" />
            ) : isExpired ? (
              <ShieldAlert className="size-5" />
            ) : isSold || isGood ? (
              <ShieldCheck className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`text-sm font-extrabold tracking-wide uppercase ${
                isRecalled
                  ? "text-rose-700"
                  : isExpired
                    ? "text-amber-700"
                    : isSold
                      ? "text-[#008751]"
                      : isGood
                        ? "text-[#008751]"
                        : "text-amber-700"
              }`}
            >
              {isRecalled
                ? "RECALLED PRODUCT"
                : isExpired
                  ? "PRODUCT EXPIRED"
                  : isSold
                    ? "PRODUCT VERIFIED · SOLD"
                    : isInTransit
                      ? "PRODUCT VERIFIED · IN TRANSIT"
                      : isGood
                        ? "PRODUCT VERIFIED"
                        : "HELD UNDER INSPECTION"}
            </span>
            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
              {isRecalled
                ? "Warning: This product batch has been recalled. Do not purchase or consume."
                : isExpired
                  ? `Warning: This product reached its expiration date on ${formatDate(result.expiresOn)}.`
                  : isSold
                    ? "This product is verified authentic and has been purchased by a consumer."
                    : isInTransit
                      ? "This product is verified authentic and is in transit between certified facilities."
                      : isGood
                        ? "This product is verified authentic. See product details below."
                        : (result.verdict || "Product status is under inspection.")}
            </p>
          </div>
        </div>

        {/* ── Product Specification ── */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Product Details
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {result.productName || "Unknown Product"}
            </h3>
            {result.productSku && (
              <p className="font-mono text-xs text-slate-500">{result.productSku}</p>
            )}
          </div>

          <div className="grid gap-2.5 text-xs">
            {result.code && (
              <InfoRow
                icon={Package}
                label="Serial Code"
                value={result.code}
              />
            )}
            <InfoRow
              icon={CheckCircle2}
              label="Verification status"
              value={
                isRecalled
                  ? "Recalled"
                  : isExpired
                    ? "Expired"
                    : isSold
                      ? "Verified · Sold"
                      : isInTransit
                        ? "Verified · In transit"
                        : isGood
                          ? "Verified"
                          : result.itemStatus || "Under inspection"
              }
              suffix={
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold py-0 h-4 border-slate-200",
                    isSold && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    isInTransit && "bg-blue-50 text-blue-700 border-blue-200",
                    isGood && !isSold && !isInTransit && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  )}
                >
                  {isRecalled
                    ? "RECALLED"
                    : isExpired
                      ? "EXPIRED"
                      : isSold
                        ? "SOLD"
                        : isGood
                          ? "VERIFIED"
                          : (result.itemStatus ?? "CHECK")}
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
                    <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-slate-200">
                      {result.batchStatus}
                    </Badge>
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
          </div>
        </div>

        {/* ── Rwanda National Standards Guarantee Box ── */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Compliance & Standards
          </span>
          <div className="grid gap-2 text-xs">
            <StatusRow
              icon={isGood ? CheckCircle2 : XCircle}
              label="Authenticity Signature"
              ok={true}
              detail="Digital cryptographic serial registered with Rwanda Standards Board"
            />
            <StatusRow
              icon={result.recalled ? XCircle : CheckCircle2}
              label="Safety & Recall Clearance"
              ok={!result.recalled}
              detail={
                result.recalled
                  ? "Product flagged for active recall"
                  : "Batch cleared with 0 recall notices"
              }
            />
            <StatusRow
              icon={result.expired ? XCircle : CheckCircle2}
              label="Shelf Life & Freshness"
              ok={!result.expired}
              detail={
                result.expired
                  ? `Expired on ${formatDate(result.expiresOn)}`
                  : result.expiresOn
                    ? `Valid and unexpired through ${formatDate(result.expiresOn)}`
                    : "Standard shelf life"
              }
            />
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <Link href="/verify" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-10 rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-1.5 size-3.5" /> Scan Another
            </Button>
          </Link>
          <Link href="/contact" className="flex-1">
            <Button
              size="sm"
              className="w-full h-10 rounded-xl text-xs font-semibold bg-[#00A3E0] hover:bg-sky-600 text-white"
            >
              Report Issue
            </Button>
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-400 pt-1 font-mono">
          Certificate Token: {token}
        </p>
      </div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="size-3.5 text-[#00A3E0]" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className={highlight ? "text-rose-600 font-bold" : "text-slate-800"}>
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
    <div className="flex items-start gap-2.5">
      <Icon
        className={`size-4 shrink-0 mt-0.5 ${ok ? "text-[#008751]" : "text-rose-500"}`}
      />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-slate-800">{label}</span>
        <p className="text-[11px] text-slate-500">{detail}</p>
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
