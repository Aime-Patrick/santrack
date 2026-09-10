"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type License } from "@/lib/api";
import { Printer, X } from "lucide-react";

interface LicenseCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LicenseCertificateModal({
  open,
  onOpenChange,
  license,
}: LicenseCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!license) return null;

  const meta = license.premiseMetadata ?? {};
  const isPremise = !!(license.facilityId || license.categoryCode?.includes("PREMISE"));

  const locationParts = meta.location
    ? [
        meta.location.village,
        meta.location.cell,
        meta.location.sector,
        meta.location.district,
        meta.location.province,
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-3xl max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white border border-border shadow-2xl rounded-xl">
        <DialogTitle className="sr-only">License Certificate</DialogTitle>
        <DialogDescription className="sr-only">
          Official license certificate for {license.licenseNumber}
        </DialogDescription>

        {/* ── Toolbar (hidden on print) ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white print:hidden shrink-0">
          <span className="text-sm font-semibold text-foreground">Official License Certificate</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Certificate scroll area ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex justify-center print:p-0 print:bg-white">
          <div
            ref={printRef}
            className="w-full max-w-2xl bg-white print:max-w-none print:shadow-none"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {/* ══ OUTER BORDER ══ */}
            <div className="border-4 border-[#003580]">
              {/* ── INNER RULE ── */}
              <div className="border border-[#003580]/40 m-1.5">

                {/* ══ HEADER BAND ══ */}
                <div className="bg-[#003580] px-6 py-4 flex items-center justify-between gap-4">
                  {/* Left — SANTRACK wordmark */}
                  <div className="flex flex-col">
                    <span className="text-white font-extrabold text-xl tracking-tight leading-none" style={{ fontFamily: "system-ui, sans-serif" }}>
                      SAN<span className="text-[#F9D71C]">TRACK</span>
                    </span>
                    <span className="text-white/70 text-[9px] uppercase tracking-widest mt-0.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                      Industry Traceability Platform
                    </span>
                  </div>

                  {/* Centre — authority name */}
                  <div className="text-center flex-1">
                    <p className="text-white font-bold text-[11px] uppercase tracking-[0.18em]" style={{ fontFamily: "system-ui, sans-serif" }}>
                      Republic of Rwanda
                    </p>
                    <p className="text-white/80 text-[10px] uppercase tracking-widest" style={{ fontFamily: "system-ui, sans-serif" }}>
                      National Licensing &amp; Traceability Authority
                    </p>
                  </div>

                  {/* Right — Rwanda flag block */}
                  <div className="flex flex-col items-end gap-0.5">
                    {/* simplified flag stripe */}
                    <div className="w-14 h-9 rounded-sm overflow-hidden border border-white/30 flex flex-col shrink-0">
                      <div className="flex-1 bg-[#20603D]" />
                      <div className="flex-1 bg-[#FAD201]" />
                      <div className="flex-1 bg-[#20603D]" />
                      <div className="flex-1 bg-[#1B61AD]" />
                    </div>
                    <span className="text-white/70 text-[8px] uppercase tracking-wider" style={{ fontFamily: "system-ui, sans-serif" }}>Rwanda</span>
                  </div>
                </div>

                {/* ══ TITLE BLOCK ══ */}
                <div className="text-center py-5 border-b border-[#003580]/20 px-6">
                  <h1 className="text-2xl font-extrabold uppercase tracking-wide text-[#003580]">
                    License Certificate
                  </h1>
                  <p className="text-sm font-semibold text-[#003580]/70 mt-1 tracking-wide">
                    {license.categoryName}
                  </p>
                </div>

                {/* ══ BODY ══ */}
                <div className="px-7 py-5 space-y-4" style={{ fontFamily: "system-ui, sans-serif" }}>

                  {/* ── Licence Number Banner ── */}
                  <div className="flex items-center justify-between bg-[#003580]/5 border border-[#003580]/20 rounded px-4 py-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/50 font-bold mb-0.5">
                        Official Licence Number
                      </p>
                      <p className="font-mono text-lg font-bold text-[#003580] tracking-widest">
                        {license.licenseNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: license.status === "ACTIVE" ? "#dcfce7" : "#fef9c3",
                          borderColor: license.status === "ACTIVE" ? "#16a34a" : "#ca8a04",
                          color: license.status === "ACTIVE" ? "#15803d" : "#a16207",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ background: license.status === "ACTIVE" ? "#16a34a" : "#ca8a04" }} />
                        {license.status}
                        {license.provisional && " · Provisional"}
                      </span>
                    </div>
                  </div>

                  {/* ── Three-column info grid ── */}
                  <div className="grid grid-cols-3 gap-0 border border-[#003580]/20 rounded overflow-hidden text-xs">
                    {/* Licensee */}
                    <div className="p-3.5 border-r border-[#003580]/20">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/50 font-bold mb-1.5">
                        Licence Holder
                      </p>
                      <p className="font-bold text-[#1a1a2e] leading-snug text-[13px]">
                        {license.organizationName}
                      </p>
                      <p className="text-[#003580]/60 mt-1">
                        Activity: <span className="font-semibold text-[#1a1a2e]">{license.activity}</span>
                      </p>
                    </div>

                    {/* Facility / Premise */}
                    <div className="p-3.5 border-r border-[#003580]/20">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/50 font-bold mb-1.5">
                        {isPremise ? "Registered Facility" : "Licence Category"}
                      </p>
                      {isPremise ? (
                        <>
                          <p className="font-bold text-[#1a1a2e] leading-snug text-[13px]">
                            {license.facilityName || meta.facilityName || "Main Facility"}
                          </p>
                          {locationParts.length > 0 && (
                            <p className="text-[#003580]/60 mt-1 leading-snug">
                              {locationParts.join(", ")}
                            </p>
                          )}
                          {meta.cadastralUpi && (
                            <p className="text-[#003580]/50 mt-0.5 font-mono text-[10px]">
                              UPI: {meta.cadastralUpi}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-[#1a1a2e] leading-snug text-[13px]">
                            {license.categoryName}
                          </p>
                          <p className="font-mono text-[#003580]/50 text-[10px] mt-1">
                            {license.categoryCode}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="p-3.5">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/50 font-bold mb-1.5">
                        Validity Period
                      </p>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[9px] text-[#003580]/50 uppercase tracking-wider">Issued</p>
                          <p className="font-semibold text-[#1a1a2e] text-[12px]">{fmtDate(license.issuedOn)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#003580]/50 uppercase tracking-wider">Expires</p>
                          <p className="font-semibold text-[#1a1a2e] text-[12px]">{fmtDate(license.expiresOn)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Products Produced ── */}
                  {meta.productsProduced && (
                    <div className="border border-[#003580]/20 rounded overflow-hidden text-xs">
                      <div className="bg-[#003580]/5 px-3.5 py-2 border-b border-[#003580]/20">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/60 font-bold">
                          Authorised Scope of Products / Activities
                        </p>
                      </div>
                      <p className="px-3.5 py-3 text-[#1a1a2e] leading-relaxed">
                        {meta.productsProduced}
                      </p>
                    </div>
                  )}

                  {/* ── Issued-by block ── */}
                  {license.issuedByName && (
                    <div className="border border-[#003580]/20 rounded overflow-hidden text-xs">
                      <div className="bg-[#003580]/5 px-3.5 py-2 border-b border-[#003580]/20">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#003580]/60 font-bold">
                          Issuing Authority
                        </p>
                      </div>
                      <p className="px-3.5 py-3 font-semibold text-[#1a1a2e]">
                        {license.issuedByName}
                      </p>
                    </div>
                  )}

                  {/* ══ FOOTER — verify note + signature ══ */}
                  <div className="flex items-end justify-between pt-4 border-t border-[#003580]/20 mt-2">
                    {/* Verification note — no external image, no raw URL */}
                    <div className="text-[10px] text-[#003580]/60 leading-relaxed">
                      <p className="font-bold text-[#003580]/80 mb-0.5">Verify this certificate</p>
                      <p>Visit <span className="font-semibold text-[#003580]">santrack.gov.rw/verify</span></p>
                      <p className="mt-0.5">and enter licence number <span className="font-mono font-semibold text-[#003580]">{license.licenseNumber}</span></p>
                    </div>

                    {/* Signature block */}
                    <div className="text-right text-[10px] text-[#1a1a2e]">
                      <div className="w-40 border-b border-[#1a1a2e]/40 mb-1.5 ml-auto" />
                      <p className="font-bold text-[11px]">
                        {license.issuedByName || "Director General, Rwanda FDA"}
                      </p>
                      <p className="text-[#003580]/50 mt-0.5">Digitally Authenticated</p>
                      <p className="text-[#003580]/50">SANTRACK National Registry</p>
                    </div>
                  </div>

                </div>

                {/* ══ FOOTER BAND ══ */}
                <div className="bg-[#003580] px-6 py-2.5 flex items-center justify-between">
                  <p className="text-white/60 text-[9px] uppercase tracking-widest" style={{ fontFamily: "system-ui, sans-serif" }}>
                    Issued via SANTRACK — Rwanda&apos;s Trusted Traceability Platform
                  </p>
                  <p className="text-white/60 text-[9px] font-mono" style={{ fontFamily: "monospace" }}>
                    {license.licenseNumber}
                  </p>
                </div>

              </div>{/* inner rule */}
            </div>{/* outer border */}
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
