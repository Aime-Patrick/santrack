"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCw,
  QrCode,
  Lock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Public consumer verify entry.
 *
 * Accepts the unit QR (UUID /verify link) and the printed serial (ST-…).
 * Product catalogue barcodes (GTIN/SKU) are not unique to one pack.
 */
export default function ConsumerVerifyPage() {
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const qrRegionId = "consumer-qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraActiveRef = useRef(false);
  const lastScanRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const startingRef = useRef(false);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      cameraActiveRef.current = false;
      setCameraActive(false);
      return;
    }
    scannerRef.current = null;
    cameraActiveRef.current = false;
    setCameraActive(false);
    try {
      const state = scanner.getState?.();
      // 2 = SCANNING in html5-qrcode; avoid stop() when already idle.
      if (state === undefined || state === 2) {
        await scanner.stop();
      }
    } catch {
      // Camera may already be torn down on navigation.
    }
    try {
      scanner.clear();
    } catch {
      // ignore
    }
  }, []);

  const handleScannedResult = useCallback(
    (decodedText: string) => {
      let token = decodedText.trim();

      // Category share QRs encode a full /c/{token} URL — send them there,
      // not into item verification.
      if (token.includes("/c/")) {
        const parts = token.split("/c/");
        const categoryToken = parts[parts.length - 1]
          .split("?")[0]
          .split("#")[0];
        if (!categoryToken) return;
        const now = Date.now();
        if (
          (lastScanRef.current.code === categoryToken &&
            now - lastScanRef.current.time < 1500) ||
          now - lastScanRef.current.time < 400
        ) {
          return;
        }
        lastScanRef.current = { code: categoryToken, time: now };
        void stopCamera().then(() => {
          router.push(`/c/${encodeURIComponent(categoryToken)}`);
        });
        return;
      }

      if (token.includes("/verify/")) {
        const parts = token.split("/verify/");
        token = parts[parts.length - 1].split("?")[0].split("#")[0];
      }
      // Strip accidental wrapping quotes from some scanner guns.
      token = token.replace(/^["']|["']$/g, "");
      try {
        token = decodeURIComponent(token);
      } catch {
        // keep raw token
      }
      if (!token) return;

      const now = Date.now();
      if (
        (lastScanRef.current.code === token &&
          now - lastScanRef.current.time < 1500) ||
        now - lastScanRef.current.time < 400
      ) {
        return;
      }
      lastScanRef.current = { code: token, time: now };

      void stopCamera().then(() => {
        router.push(`/verify/${encodeURIComponent(token)}`);
      });
    },
    [router, stopCamera],
  );

  // Hardware barcode scanner gun listener (only outside text fields for chars;
  // Enter still submits the manual field).
  useEffect(() => {
    const GUN_GAP_MS = 45;
    const GUN_MIN_LENGTH = 8;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      const now = Date.now();
      const gap = now - lastKeyAtRef.current;
      lastKeyAtRef.current = now;

      if (e.key === "Enter") {
        const gunCode = bufferRef.current.trim();
        bufferRef.current = "";
        if (!inInput && gunCode.length >= GUN_MIN_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          handleScannedResult(gunCode);
        }
        return;
      }

      if (inInput) return;
      if (e.key.length !== 1) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      bufferRef.current = gap > GUN_GAP_MS ? e.key : bufferRef.current + e.key;
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleScannedResult]);

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setCameraError(null);

    try {
      await stopCamera();

      // Region must exist in the DOM (camera mode only).
      const region = document.getElementById(qrRegionId);
      if (!region) {
        setCameraError("Scanner viewport is not ready. Try again.");
        return;
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        () => {},
      );

      cameraActiveRef.current = true;
      setCameraActive(true);
    } catch {
      cameraActiveRef.current = false;
      setCameraActive(false);
      scannerRef.current = null;
      setCameraError(
        "Camera permission was denied or is unavailable. Type the serial or QR payload manually, or allow camera access.",
      );
    } finally {
      startingRef.current = false;
    }
  }, [facingMode, handleScannedResult, stopCamera]);

  const toggleCamera = async () => {
    await stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    if (activeMode === "camera") {
      void startCamera();
    } else {
      void stopCamera();
    }

    return () => {
      void stopCamera();
    };
  }, [activeMode, facingMode, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (trimmed) {
      handleScannedResult(trimmed);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50/50 pb-20 pt-24">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[600px] -translate-x-1/2 bg-gradient-to-r from-sky-400/15 via-amber-300/20 to-emerald-500/15 opacity-70 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-md space-y-6 px-4">
        <div className="space-y-2 text-center">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            <div className="h-1.5 w-8 rounded-full bg-[#00A3E0]" />
            <div className="h-1.5 w-6 rounded-full bg-[#FAD201]" />
            <div className="h-1.5 w-8 rounded-full bg-[#20603D]" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Verify Product
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Point at the packaging QR, or enter the printed serial (ST-…).
            Shared product barcodes (EAN/GTIN) are not accepted.
          </p>
        </div>

        <div className="mx-auto flex max-w-xs rounded-xl border border-slate-200 bg-slate-200/60 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMode("camera")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeMode === "camera"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Camera className="size-3.5 text-[#00A3E0]" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeMode === "manual"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <QrCode className="size-3.5 text-[#00A3E0]" />
            <span>Paste QR</span>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          {activeMode === "camera" ? (
            <div className="space-y-4 text-center">
              <div className="relative mx-auto flex aspect-square max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
                <div id={qrRegionId} className="h-full w-full object-cover" />

                {cameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative size-48 rounded-2xl border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      <div className="absolute left-0 right-0 top-0 h-1 animate-pulse bg-gradient-to-r from-transparent via-[#00A3E0] to-transparent shadow-[0_0_12px_#00A3E0]" />
                      <div className="absolute -left-1 -top-1 size-3.5 border-l-2 border-t-2 border-[#FAD201]" />
                      <div className="absolute -right-1 -top-1 size-3.5 border-r-2 border-t-2 border-[#FAD201]" />
                      <div className="absolute -bottom-1 -left-1 size-3.5 border-b-2 border-l-2 border-[#20603D]" />
                      <div className="absolute -bottom-1 -right-1 size-3.5 border-b-2 border-r-2 border-[#20603D]" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-5 text-center text-white">
                    <CameraOff className="size-8 text-amber-400" />
                    <p className="text-xs leading-relaxed text-slate-300">
                      {cameraError}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveMode("manual")}
                      className="rounded-xl bg-[#00A3E0] text-xs font-semibold text-white hover:bg-sky-600"
                    >
                      Type code instead
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void toggleCamera()}
                  disabled={!cameraActive}
                  className="h-8 rounded-xl border-slate-200 px-3 text-xs font-medium text-slate-700"
                >
                  <RotateCw className="mr-1.5 size-3.5" /> Switch Lens
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400">
                    <Search className="size-4 text-[#00A3E0]" />
                  </div>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="QR UUID, ST-… serial, or /verify/… link"
                    className="h-12 rounded-xl border-slate-200 pl-10 pr-12 font-mono text-sm focus-visible:ring-2 focus-visible:ring-[#00A3E0]/20"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-[#00A3E0] text-white shadow-xs transition-all hover:bg-sky-600 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#008751] text-xs font-semibold uppercase tracking-wide text-white shadow-xs hover:opacity-95"
                >
                  <ShieldCheck className="mr-2 size-4" /> Verify
                </Button>
              </form>

              <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
                You can scan the unit QR or type the printed serial on the same
                label. Product shelf barcodes (GTIN) name every pack of that
                product, so they cannot verify a single unit.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="space-y-0.5 rounded-2xl border border-slate-200/70 bg-white/80 p-2.5 shadow-2xs backdrop-blur-xs">
            <CheckCircle2 className="mx-auto size-4 text-[#008751]" />
            <p className="text-[11px] font-bold text-slate-800">Genuine</p>
            <p className="text-[10px] text-slate-400">Authentic origin</p>
          </div>

          <div className="space-y-0.5 rounded-2xl border border-slate-200/70 bg-white/80 p-2.5 shadow-2xs backdrop-blur-xs">
            <Sparkles className="mx-auto size-4 text-[#00A3E0]" />
            <p className="text-[11px] font-bold text-slate-800">RSB Standard</p>
            <p className="text-[10px] text-slate-400">Quality approved</p>
          </div>

          <div className="space-y-0.5 rounded-2xl border border-slate-200/70 bg-white/80 p-2.5 shadow-2xs backdrop-blur-xs">
            <Lock className="mx-auto size-4 text-amber-500" />
            <p className="text-[11px] font-bold text-slate-800">Fresh Batch</p>
            <p className="text-[10px] text-slate-400">Expiry checked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
