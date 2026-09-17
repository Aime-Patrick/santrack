"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  MapPin,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface LicenseVerifyData {
  valid: boolean;
  licenseNumber: string;
  organizationName: string;
  categoryName: string;
  activity: string;
  facilityName: string | null;
  status: string;
  issuedOn: string | null;
  expiresOn: string | null;
  issuedByName: string | null;
  premiseMetadata?: Record<string, any> | null;
}

export default function LicensePublicVerificationPage({
  params,
}: {
  params: Promise<{ licenseNumber: string }>;
}) {
  const { licenseNumber } = use(params);

  const { data, isLoading, error } = useQuery<LicenseVerifyData>({
    queryKey: ["public-license-verify", licenseNumber],
    queryFn: () =>
      api
        .get<LicenseVerifyData>(`/api/licenses/public/verify/${encodeURIComponent(licenseNumber)}`)
        .then((r) => r.data),
    enabled: Boolean(licenseNumber),
    retry: false,
  });

  const meta = data?.premiseMetadata || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/30 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SANTRACK</span>
        </Link>

        {/* Verification Card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 text-center border-b border-border bg-muted/20 space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm mb-1">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Republic of Rwanda · Industry Registry
            </p>
            <h1 className="text-lg font-bold text-foreground">
              Official License Verification
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {decodeURIComponent(licenseNumber)}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">
                  Validating license against national registry...
                </p>
              </div>
            ) : error || !data ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <ShieldX className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    License Not Found or Unregistered
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    The license reference number could not be authenticated in the official registry.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Verdict Box */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    data.valid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {data.valid ? (
                      <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {data.valid ? "Verified & Authenticated" : "License Lapsed / Inactive"}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {data.valid
                          ? "This operating license is officially active and authorized."
                          : `Status: ${data.status}. Not authorized for current operations.`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-1 uppercase font-semibold ${
                      data.valid
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-destructive text-white border-destructive"
                    }`}
                  >
                    {data.status}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      Licensee / Organization
                    </span>
                    <p className="font-bold text-foreground text-sm">{data.organizationName}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      License Category
                    </span>
                    <p className="font-medium text-foreground">{data.categoryName}</p>
                    <p className="text-[13px] text-muted-foreground">Activity: {data.activity}</p>
                  </div>

                  {data.facilityName && (
                    <div className="sm:col-span-2 p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Premise / Registered Facility</span>
                      </div>
                      <p className="font-medium text-foreground">{data.facilityName}</p>
                      {meta.cadastralUpi && (
                        <p className="text-[13px] text-muted-foreground">
                          Cadastral UPI: <span className="font-mono text-foreground">{meta.cadastralUpi}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {meta.productsProduced && (
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                        Authorized Product Scope
                      </span>
                      <p className="font-medium text-foreground bg-muted/20 p-2 rounded border border-border">
                        {meta.productsProduced}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      Issued Date
                    </span>
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {data.issuedOn ? new Date(data.issuedOn).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      Expiration Date
                    </span>
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {data.expiresOn ? new Date(data.expiresOn).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  {data.issuedByName && (
                    <div className="sm:col-span-2 pt-2 border-t border-border">
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                        Issuing Authority
                      </span>
                      <p className="font-medium text-foreground">{data.issuedByName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/20 border-t border-border text-center">
            <p className="text-[13px] text-muted-foreground">
              Official verification service powered by SANTRACK Industry Traceability Engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
