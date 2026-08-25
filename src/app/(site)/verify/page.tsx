"use client";

import { useEffect, useRef, useState } from "react";
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
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ConsumerVerifyPage() {
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const qrRegionId = "consumer-qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);

  // Handle scanned result with strict deduplication
  const handleScannedResult = (decodedText: string) => {
    let token = decodedText.trim();
    if (token.includes("/verify/")) {
      const parts = token.split("/verify/");
      token = parts[parts.length - 1].split("?")[0].split("#")[0];
    }
    if (!token) return;

    const now = Date.now();
    if (
      (lastScanRef.current.code === token && now - lastScanRef.current.time < 1500) ||
      now - lastScanRef.current.time < 400
    ) {
      return;
    }
    lastScanRef.current = { code: token, time: now };

    stopCamera();
    router.push(`/verify/${encodeURIComponent(token)}`);
  };

  // Hardware barcode scanner gun listener
  useEffect(() => {
    const GUN_GAP_MS = 45;
    const GUN_MIN_LENGTH = 3;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      const now = Date.now();
      const gap = now - lastKeyAtRef.current;
      lastKeyAtRef.current = now;

      if (e.key === "Enter") {
        const gunCode = bufferRef.current.trim();
        bufferRef.current = "";
        if (gunCode.length >= GUN_MIN_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          handleScannedResult(gunCode);
        } else if (inInput && manualCode.trim()) {
          e.preventDefault();
          e.stopPropagation();
          handleScannedResult(manualCode.trim());
        }
        return;
      }

      if (e.key.length !== 1) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      bufferRef.current =
        gap > GUN_GAP_MS ? e.key : bufferRef.current + e.key;
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [manualCode]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: facingMode },
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        () => {},
      );

      setCameraActive(true);
    } catch {
      setCameraActive(false);
      setCameraError(
        "Camera permission was denied or is unavailable. Please enter the code below.",
      );
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const toggleCamera = async () => {
    await stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    if (activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeMode, facingMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (trimmed) {
      handleScannedResult(trimmed);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 pt-24 pb-20 flex flex-col justify-center overflow-hidden">
      {/* ── Rwanda Flag Decorative Ambient Glows ── */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[600px] bg-gradient-to-r from-sky-400/15 via-amber-300/20 to-emerald-500/15 blur-3xl opacity-70" />

      <div className="max-w-md mx-auto px-4 w-full space-y-6 relative z-10">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          {/* Rwanda Flag Top Ribbon Accent */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="h-1.5 w-8 rounded-full bg-[#00A3E0]" />
            <div className="h-1.5 w-6 rounded-full bg-[#FAD201]" />
            <div className="h-1.5 w-8 rounded-full bg-[#20603D]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Verify Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Scan packaging QR code to authenticate genuine standards.
          </p>
        </div>

        {/* ── Segmented Mode Switcher ── */}
        <div className="flex rounded-xl bg-slate-200/60 p-1 border border-slate-200 shadow-2xs max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setActiveMode("camera")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
              activeMode === "camera"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Camera className="size-3.5 text-[#00A3E0]" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
              activeMode === "manual"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <QrCode className="size-3.5 text-[#00A3E0]" />
            <span>Enter Code</span>
          </button>
        </div>

        {/* ── Scanner Card ── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm overflow-hidden relative">
          {activeMode === "camera" ? (
            <div className="space-y-4 text-center">
              {/* Video Camera Viewport */}
              <div className="relative mx-auto aspect-square max-w-[280px] overflow-hidden rounded-2xl bg-slate-950 shadow-inner border border-slate-800 flex items-center justify-center">
                <div id={qrRegionId} className="w-full h-full object-cover" />

                {/* Reticle Scanner Overlay */}
                {cameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative size-48 border-2 border-dashed border-white/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Laser beam */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#00A3E0] to-transparent animate-pulse shadow-[0_0_12px_#00A3E0]" />
                      <div className="absolute -top-1 -left-1 size-3.5 border-t-2 border-l-2 border-[#FAD201]" />
                      <div className="absolute -top-1 -right-1 size-3.5 border-t-2 border-r-2 border-[#FAD201]" />
                      <div className="absolute -bottom-1 -left-1 size-3.5 border-b-2 border-l-2 border-[#20603D]" />
                      <div className="absolute -bottom-1 -right-1 size-3.5 border-b-2 border-r-2 border-[#20603D]" />
                    </div>
                  </div>
                )}

                {/* Error fallback overlay */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-white text-center bg-slate-950/95 gap-3">
                    <CameraOff className="size-8 text-amber-400" />
                    <p className="text-xs leading-relaxed text-slate-300">{cameraError}</p>
                    <Button
                      size="sm"
                      onClick={() => setActiveMode("manual")}
                      className="bg-[#00A3E0] hover:bg-sky-600 text-white text-xs font-semibold rounded-xl"
                    >
                      Enter Code Manually
                    </Button>
                  </div>
                )}
              </div>

              {/* Camera Flip Control */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCamera}
                  disabled={!cameraActive}
                  className="rounded-xl h-8 px-3 text-xs font-medium text-slate-700 border-slate-200"
                >
                  <RotateCw className="mr-1.5 size-3.5" /> Switch Lens
                </Button>
              </div>
            </div>
          ) : (
            /* Manual Input Mode */
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
                    <Search className="size-4 text-[#00A3E0]" />
                  </div>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter serial or barcode number"
                    className="h-12 font-mono text-sm uppercase pl-10 pr-12 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#00A3E0]/20"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="absolute right-2 top-2 size-8 flex items-center justify-center rounded-lg bg-[#00A3E0] text-white hover:bg-sky-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full h-11 bg-gradient-to-r from-[#00A3E0] to-[#008751] hover:opacity-95 text-white font-semibold rounded-xl shadow-xs text-xs tracking-wide uppercase"
                >
                  <ShieldCheck className="mr-2 size-4" /> Verify Code
                </Button>
              </form>

              {/* Sample codes */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-400 font-medium">Quick test:</span>
                <div className="flex gap-1.5">
                  {["ST-AKAG-000101", "6161106380602"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setManualCode(sample);
                        router.push(`/verify/${encodeURIComponent(sample)}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-600 hover:border-[#00A3E0] hover:text-[#00A3E0] transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Rwanda Standards Trust Badges ── */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xs p-2.5 shadow-2xs space-y-0.5">
            <CheckCircle2 className="size-4 text-[#008751] mx-auto" />
            <p className="text-[11px] font-bold text-slate-800">Genuine</p>
            <p className="text-[10px] text-slate-400">Authentic origin</p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xs p-2.5 shadow-2xs space-y-0.5">
            <Sparkles className="size-4 text-[#00A3E0] mx-auto" />
            <p className="text-[11px] font-bold text-slate-800">RSB Standard</p>
            <p className="text-[10px] text-slate-400">Quality approved</p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xs p-2.5 shadow-2xs space-y-0.5">
            <Lock className="size-4 text-[#FAD201] text-amber-500 mx-auto" />
            <p className="text-[11px] font-bold text-slate-800">Fresh Batch</p>
            <p className="text-[10px] text-slate-400">Expiry checked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
