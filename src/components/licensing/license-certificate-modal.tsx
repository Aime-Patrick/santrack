"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type License } from "@/lib/api";
import {
  Printer,
  X,
  Download,
  ShieldCheck,
} from "lucide-react";
import { QrCodeImage } from "./qr-code";

interface LicenseCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtActivity(raw: string | null | undefined): string {
  if (!raw) return "Traceability & Production";
  return raw.charAt(0) + raw.slice(1).toLowerCase().replace(/_/g, " ");
}

function buildAddress(location: Record<string, string | undefined> | null | undefined): string {
  if (!location) return "";
  return [
    location.businessCenter,
    location.village,
    location.cell,
    location.sector,
    location.district,
    location.province,
  ]
    .filter(Boolean)
    .join(", ");
}

const SITE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SITE_URL) ||
  "https://santrack.vercel.app";

// ─── Imigongo Background Pattern ────────────────────────────────────────────

function ImigongoPattern() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/images/imigongo2.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "280px auto",
        opacity: 0.045,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ─── Stylized Digital Signature SVG ─────────────────────────────────────────

function DigitalSignatureSvg() {
  return (
    <svg width="120" height="40" viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 15 38 C 25 15, 30 5, 36 2 C 38 1, 40 4, 38 18 C 36 30, 42 42, 54 34 C 62 28, 68 18, 76 22 C 84 26, 88 38, 98 32 C 108 26, 115 15, 128 18 M 12 36 L 132 28"
        stroke="#0f284e"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Certificate Document ───────────────────────────────────────────────────

interface CertificateDocumentProps {
  license: License;
}

function CertificateDocument({ license }: CertificateDocumentProps) {
  const meta = license.premiseMetadata ?? {};
  const verificationUrl = `${SITE_URL}/verify/license/${encodeURIComponent(license.licenseNumber)}`;

  const locationStr = buildAddress(meta.location as Record<string, string | undefined> | null);
  const signatoryName = license.issuedByName || "Director General";
  const issuingAuthority = license.issuedByName || "Rwanda FDA / SANTRACK";
  const productScope = meta.productsProduced ?? null;
  const facilityName = license.facilityName || (meta.facilityName as string | undefined) || "Registered Production Facility";
  const tinNumber =
    (license as License & { tin?: string }).tin ??
    (license.premiseMetadata?.tin as string | undefined) ??
    "TIN-PENDING";

  return (
    <div
      id="santrack-certificate-document"
      style={{
        width: "100%",
        maxWidth: "920px",
        background: "#ffffff",
        fontFamily: "var(--font-exo), 'Exo', system-ui, -apple-system, sans-serif",
        position: "relative",
        boxSizing: "border-box",
        borderRadius: "0px",
        border: "2.5px solid #209E48",
        boxShadow: "0 10px 30px -5px rgba(32,158,72,0.12), 0 2px 10px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Imigongo Background Pattern */}
      <ImigongoPattern />

      {/* ── Main Content Container ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "26px 30px 22px 30px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxSizing: "border-box",
        }}
      >
        {/* ══ 1. TOP HEADER BAR ════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "8px",
          }}
        >
          {/* Left: SANTRACK Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image
                src="/images/logo-symbol.png"
                alt="SANTRACK Logo"
                width={38}
                height={38}
                style={{ objectFit: "contain" }}
                unoptimized
              />
              <div style={{ lineHeight: 1.1 }}>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#0f284e",
                  }}
                >
                  santrack
                </span>
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 700,
                    color: "#64748b",
                    margin: "1px 0 0",
                  }}
                >
                  Trace Today. Safer Tomorrow.
                </p>
              </div>
            </div>
            <span style={{ width: "1px", height: "34px", background: "#cbd5e1", marginLeft: "8px" }} />
          </div>

          {/* Center: RWANDA REGULATORY AUTHORITY */}
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "#0f284e",
                margin: 0,
              }}
            >
              R W A N D A
            </p>
            <p
              style={{
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#475569",
                marginTop: "3px",
                marginBottom: 0,
              }}
            >
              REGULATORY TRACEABILITY &amp; LICENSING AUTHORITY
            </p>
          </div>

          {/* Right: RWANDA Flag (Prominent, No Border) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <Image
              src="/images/Flag_of_Rwanda.webp"
              alt="Flag of Rwanda"
              width={92}
              height={62}
              style={{
                border: "none",
                objectFit: "cover",
                display: "block",
              }}
              unoptimized
            />
          </div>
        </div>

        {/* ══ 2. CERTIFICATE TITLE SECTION ══════════════════════════════════ */}
        <div style={{ textAlign: "center", marginTop: "2px", marginBottom: "2px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#0f284e",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            DIGITAL LICENSE CERTIFICATE
          </h1>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#209E48",
              marginTop: "5px",
              marginBottom: "8px",
            }}
          >
            {license.categoryName.toUpperCase()}
          </p>

          {/* Sub-divider line */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
            <span style={{ width: "130px", height: "1px", background: "#cbd5e1" }} />
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              REGULATED FACILITY &nbsp;•&nbsp; SAFETY &nbsp;•&nbsp; TRACEABILITY
            </span>
            <span style={{ width: "130px", height: "1px", background: "#cbd5e1" }} />
          </div>
        </div>

        {/* ══ 3. TOP ROW: 3-COLUMN SEAMLESS GRID WITH RIGHT BORDER DIVIDERS ══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.1fr 1fr",
            gap: "0",
            padding: "8px 0",
          }}
        >
          {/* Column 1: LICENSE HOLDER / COMPANY */}
          <div
            style={{
              paddingRight: "20px",
              borderRight: "1px solid #cbd5e1",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "8.5px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              LICENSE HOLDER / COMPANY
            </p>

            <div>
              <p
                style={{
                  fontSize: "14.5px",
                  fontWeight: 800,
                  color: "#0f284e",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {license.organizationName}
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                TAX / REGISTRATION ID
              </p>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#0f284e",
                  fontFamily: "var(--font-geist-mono), monospace",
                  margin: "2px 0 0",
                }}
              >
                {tinNumber}
              </p>
            </div>
          </div>

          {/* Column 2: FACILITY NAME & ADDRESS */}
          <div
            style={{
              padding: "0 20px",
              borderRight: "1px solid #cbd5e1",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "8.5px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              FACILITY NAME
            </p>

            <div>
              <p
                style={{
                  fontSize: "14.5px",
                  fontWeight: 800,
                  color: "#0f284e",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {facilityName}
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                FACILITY ADDRESS
              </p>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#334155",
                  margin: "2px 0 0",
                  lineHeight: 1.35,
                }}
              >
                {locationStr || "Kigali Special Economic Zone, Kigali City, Rwanda"}
              </p>
            </div>
          </div>

          {/* Column 3: LICENSE REFERENCE & VALIDITY */}
          <div
            style={{
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                LICENSE NUMBER
              </p>
              <p
                style={{
                  fontSize: "13.5px",
                  fontWeight: 800,
                  color: "#0f284e",
                  fontFamily: "var(--font-geist-mono), monospace",
                  margin: "1px 0 0",
                }}
              >
                {license.licenseNumber}
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: "7.5px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                LICENSE TYPE
              </p>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#0f284e",
                  margin: "1px 0 0",
                }}
              >
                {license.categoryName}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "2px" }}>
              <div>
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  ISSUED ON
                </p>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#0f284e", margin: "1px 0 0" }}>
                  {fmtDate(license.issuedOn)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  EXPIRATION DATE
                </p>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#209E48", margin: "1px 0 0" }}>
                  {fmtDate(license.expiresOn)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 4. BOTTOM ROW: 2-COLUMN SCOPE & AUTHORIZATION WITH RIGHT BORDER ══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "0",
            padding: "8px 0 4px",
          }}
        >
          {/* Column 1: AUTHORIZED PRODUCTS AT THIS FACILITY */}
          <div
            style={{
              paddingRight: "22px",
              borderRight: "1px solid #cbd5e1",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#0f284e",
                margin: 0,
              }}
            >
              AUTHORIZED PRODUCTS AT THIS FACILITY
            </p>

            {/* Product Table */}
            <div style={{ borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f1f6fc", color: "#475569", fontWeight: 800 }}>
                    <th style={{ padding: "6px 9px" }}>Product Name</th>
                    <th style={{ padding: "6px 9px" }}>Category / Scope</th>
                    <th style={{ padding: "6px 9px" }}>Registration No.</th>
                    <th style={{ padding: "6px 9px" }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: "1px solid #edf2f7", color: "#0f284e", fontWeight: 600 }}>
                    <td style={{ padding: "6px 9px" }}>{productScope ? String(productScope).split(",")[0] : "Authorized Product Line A"}</td>
                    <td style={{ padding: "6px 9px", color: "#475569" }}>{fmtActivity(license.activity)}</td>
                    <td style={{ padding: "6px 9px", fontFamily: "var(--font-geist-mono), monospace" }}>RWF-REG-001234</td>
                    <td style={{ padding: "6px 9px", color: "#475569" }}>Commercial</td>
                  </tr>
                  <tr style={{ borderTop: "1px solid #edf2f7", color: "#0f284e", fontWeight: 600 }}>
                    <td style={{ padding: "6px 9px" }}>{productScope && String(productScope).split(",")[1] ? String(productScope).split(",")[1] : "Authorized Product Line B"}</td>
                    <td style={{ padding: "6px 9px", color: "#475569" }}>{fmtActivity(license.activity)}</td>
                    <td style={{ padding: "6px 9px", fontFamily: "var(--font-geist-mono), monospace" }}>RWF-REG-001235</td>
                    <td style={{ padding: "6px 9px", color: "#475569" }}>Commercial</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 2: REGULATORY AUTHORIZATION */}
          <div
            style={{
              paddingLeft: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#0f284e",
                  margin: "0 0 8px 0",
                }}
              >
                REGULATORY AUTHORIZATION
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Issued by:</span>
                  <span style={{ color: "#0f284e", fontWeight: 800 }}>{issuingAuthority}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Authorization Scope:</span>
                  <span style={{ color: "#0f284e", fontWeight: 800 }}>{fmtActivity(license.activity)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Country:</span>
                  <span style={{ color: "#0f284e", fontWeight: 800 }}>Rwanda</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "8.5px", fontStyle: "italic", color: "#64748b", margin: 0, lineHeight: 1.35 }}>
              This facility is authorized to operate and distribute products in accordance with Rwanda&apos;s regulatory traceability requirements.
            </p>
          </div>
        </div>

        {/* ══ 5. FOOTER (QR, SANTRACK LOGO, SIGNATURE) ══════════════════════ */}
        <div
          style={{
            marginTop: "4px",
            paddingTop: "10px",
            borderTop: "1px solid #e0eaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Verification QR */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                border: "1.2px solid #0f284e",
                padding: "2px",
                background: "#ffffff",
                borderRadius: "2px",
                flexShrink: 0,
              }}
            >
              <QrCodeImage value={verificationUrl} size={58} margin={1} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ fontSize: "8px", fontWeight: 800, color: "#0f284e", margin: 0 }}>
                Scan to verify
                <br />
                authenticity on
                <br />
                Santrack
              </p>
              <p
                style={{
                  fontSize: "7px",
                  fontWeight: 700,
                  color: "#005bb7",
                  margin: "2px 0 0",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                santrack.vercel.app/verify
              </p>
            </div>
          </div>

          {/* Center: SANTRACK Issuing Badge */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <Image
                src="/images/logo-symbol.png"
                alt="SANTRACK"
                width={20}
                height={20}
                style={{ objectFit: "contain" }}
                unoptimized
              />
              <span style={{ fontSize: "16px", fontWeight: 900, color: "#0f284e" }}>santrack</span>
            </div>
            <p style={{ fontSize: "6px", fontWeight: 600, color: "#64748b", margin: 0 }}>
              Trace Today. Safer Tomorrow.
            </p>
            <p
              style={{
                fontSize: "7px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#209E48",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              DIGITAL CERTIFICATE ISSUED BY SANTRACK
            </p>
            <p
              style={{
                fontSize: "6px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: "1px 0 0",
              }}
            >
              RWANDA&apos;S TRUSTED TRACEABILITY PLATFORM
            </p>
          </div>

          {/* Right: Signature & Authority */}
          <div style={{ textAlign: "center", width: "150px" }}>
            <DigitalSignatureSvg />
            <div style={{ width: "100%", height: "1px", background: "#0f284e", marginTop: "-4px", marginBottom: "3px" }} />
            <p style={{ fontSize: "8.5px", fontWeight: 800, color: "#0f284e", margin: 0 }}>
              {signatoryName}
            </p>
            <p style={{ fontSize: "7px", fontWeight: 600, color: "#64748b", margin: "1px 0 0" }}>
              Rwanda FDA / SANTRACK Authority
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export function LicenseCertificateModal({
  open,
  onOpenChange,
  license,
}: LicenseCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!license) return null;

  const handlePrint = () => {
    const certEl = document.getElementById("santrack-certificate-document");
    if (!certEl) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Copy all stylesheets into the iframe so fonts / colors render correctly
    const styleLinks = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        html, body { margin: 0; padding: 0; background: #fff; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
      ${styleLinks}
    </head><body style="margin:0;padding:0;">${certEl.outerHTML}</body></html>`);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up the iframe after printing
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };

  const handleDownloadPdf = handlePrint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className="max-w-5xl w-full max-h-[95vh] flex flex-col p-0 overflow-hidden !bg-white !text-slate-900 border border-slate-200 shadow-2xl rounded-2xl"
        style={{ fontFamily: "var(--font-exo), 'Exo', system-ui, sans-serif" }}
      >
        <DialogTitle className="sr-only">
          Digital License Certificate — {license.licenseNumber}
        </DialogTitle>
        <DialogDescription className="sr-only">
          SANTRACK digital license certificate for {license.organizationName},{" "}
          license number {license.licenseNumber}.
        </DialogDescription>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#209E48]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Digital License Certificate
            </span>
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-xs font-mono font-bold text-[#209E48] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
              {license.licenseNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Download PDF
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Certificate canvas area ── */}
        <div className="flex-1 overflow-auto bg-slate-100/90 p-4 sm:p-6 flex justify-center items-start print:p-0 print:bg-white print:block print:overflow-visible">
          <div ref={printRef} className="w-full flex justify-center print:block">
            <CertificateDocument license={license} />
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
