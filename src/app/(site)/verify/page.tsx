"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import {
  Camera,
  CameraOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCw,
  QrCode,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TrustSeal } from "@/components/verify/trust-seal";

/**
 * Public consumer verify entry.
 *
 * Accepts the unit QR (UUID /verify link) and the printed serial (ST-…).
 * Product catalogue barcodes (GTIN/SKU) are not unique to one pack.
 */

export default function ConsumerVerifyPage() {
  const t = useTranslations("verify");
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const cameraActiveRef = useRef(false);
  const lastScanRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const startingRef = useRef(false);

  const stopCamera = useCallback(async () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    cameraActiveRef.current = false;
    setCameraActive(false);
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

  // zxing's MultiFormatReader console.warns internally on every reader miss
  // ("non-ReaderException") — normal when no code is in view, but it floods the
  // console 12×/second. Silence warnings only for the synchronous decode call.
  const quietDecode = useCallback(() => {
    const reader = zxingReaderRef.current;
    if (!reader || !videoRef.current) return null;
    const originalWarn = console.warn;
    try {
      console.warn = () => {};
      const res = reader.decode(videoRef.current);
      if (res && res.getText()) return res.getText();
    } catch {
      // NotFound — no code in frame, keep scanning
    } finally {
      console.warn = originalWarn;
    }
    return null;
  }, []);

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setCameraError(null);

    try {
      await stopCamera();

      if (!zxingReaderRef.current) {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.CODE_128,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        zxingReaderRef.current = new BrowserMultiFormatReader(hints);
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      cameraActiveRef.current = true;
      setCameraActive(true);

      const hasNative = typeof window !== "undefined" && "BarcodeDetector" in window;
      type NativeDetector = {
        detect: (s: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
      let nativeDetector: NativeDetector | null = null;
      if (hasNative) {
        try {
          const DetCtor = (globalThis as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => NativeDetector }).BarcodeDetector;
          nativeDetector = new DetCtor({ formats: ["qr_code", "data_matrix", "code_128"] });
        } catch {
          nativeDetector = null;
        }
      }

      let lastScanTime = 0;
      const processFrame = async (timestamp: number) => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) {
          scanLoopRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (timestamp - lastScanTime >= 80) {
          lastScanTime = timestamp;
          let detectedText: string | null = null;

          if (nativeDetector) {
            try {
              const res = await nativeDetector.detect(video);
              if (res.length > 0) {
                detectedText = res[0].rawValue;
              }
            } catch {
              // fallback
            }
          }

          if (!detectedText) {
            detectedText = quietDecode();
          }

          if (detectedText) {
            handleScannedResult(detectedText);
            return;
          }
        }

        scanLoopRef.current = requestAnimationFrame(processFrame);
      };

      scanLoopRef.current = requestAnimationFrame(processFrame);
    } catch {
      cameraActiveRef.current = false;
      setCameraActive(false);
      setCameraError(t("cameraError"));
    } finally {
      startingRef.current = false;
    }
  }, [facingMode, handleScannedResult, quietDecode, stopCamera]);

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

  const corner = "absolute size-5 border-[#FAD126]";

  return (
    /*
     * Renders inside `(site)` layout (LandingNav + FooterSection).
     * Clear the fixed nav; fill the flex-1 content slot; footer owns the
     * bottom flag stripe — do not duplicate it here.
     */
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-[#0557b0] text-white">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
        {/* Brand moment for this tool — site logo stays in the shared nav */}
        <header className="mb-6 flex w-full shrink-0 flex-col items-center gap-2 sm:mb-8 sm:gap-3">
          <TrustSeal size="lg" tone="neutral" animate surface="dark" />
          <div className="px-2 text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-white/50 sm:text-lg">
              {t("registry")}
            </p>
          </div>
        </header>

        {/* ── Mode switch ── */}
        <div className="mb-6 flex w-full max-w-xs shrink-0 items-center gap-1 rounded-full bg-white/10 p-1 sm:mb-7">
          <button
            type="button"
            onClick={() => setActiveMode("camera")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all sm:px-5",
              activeMode === "camera"
                ? "bg-white text-[#0557b0] shadow-sm"
                : "text-white/65 hover:text-white",
            )}
          >
            <Camera className="size-3.5 shrink-0" />
            {t("modeCamera")}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all sm:px-5",
              activeMode === "manual"
                ? "bg-white text-[#0557b0] shadow-sm"
                : "text-white/65 hover:text-white",
            )}
          >
            <QrCode className="size-3.5 shrink-0" />
            {t("modeType")}
          </button>
        </div>

        {/* ── Interactive panel ── */}
        <div className="w-full min-w-0 shrink-0">
          {activeMode === "camera" ? (
            <div className="flex flex-col items-center gap-4 sm:gap-5">
              <div className="relative mx-auto aspect-square w-full max-w-[min(280px,85vw)] overflow-hidden rounded-[1.75rem] bg-black/40 shadow-2xl ring-2 ring-white/10">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {cameraActive && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className={cn(corner, "-left-0.5 -top-0.5 rounded-tl-2xl border-l-[3px] border-t-[3px]")} />
                    <div className={cn(corner, "-right-0.5 -top-0.5 rounded-tr-2xl border-r-[3px] border-t-[3px]")} />
                    <div className={cn(corner, "-bottom-0.5 -left-0.5 rounded-bl-2xl border-b-[3px] border-l-[3px]")} />
                    <div className={cn(corner, "-bottom-0.5 -right-0.5 rounded-br-2xl border-b-[3px] border-r-[3px]")} />
                    <div className="absolute left-6 right-6 top-1/2 h-px animate-pulse bg-[#FAD126] shadow-[0_0_12px_#FAD126]" />
                    <p className="absolute inset-x-0 bottom-3 px-2 text-center text-[10px] font-semibold tracking-[0.2em] text-white/60">
                      {t("alignCode")}
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-black/80 p-4 text-center sm:p-6">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FAD126]">
                      <CameraOff className="size-5 text-[#0557b0]" />
                    </span>
                    <p className="max-w-[220px] text-xs leading-relaxed text-white/80">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveMode("manual")}
                      className="rounded-full bg-[#FAD126] px-5 py-2 text-xs font-extrabold text-[#0557b0] transition-all hover:brightness-95"
                    >
                      {t("typeInstead")}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void toggleCamera()}
                disabled={!cameraActive}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/45 underline underline-offset-4 transition-colors hover:text-white/80 disabled:pointer-events-none disabled:opacity-30"
              >
                <RotateCw className="size-3" />
                {t("switchCamera")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full min-w-0 space-y-3">
              <div className="relative min-w-0">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="size-4" />
                </div>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={t("inputPlaceholder")}
                  className="h-12 w-full min-w-0 rounded-2xl border-0 bg-white pl-11 pr-14 font-mono text-sm text-slate-900 shadow-xl shadow-black/25 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#FAD126] sm:h-14"
                  autoFocus
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  aria-label="Verify code"
                  className="absolute right-2.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#FAD126] text-[#0557b0] shadow-md transition-all hover:brightness-95 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xs font-extrabold uppercase tracking-[0.18em] text-[#0557b0] shadow-xl shadow-black/25 transition-all hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 sm:h-14"
              >
                <ShieldCheck className="size-4 shrink-0" />
                <span className="truncate">{t("verifyButton")}</span>
              </button>
            </form>
          )}
        </div>

        {/* ── Promise strip — wraps on narrow screens ── */}
        <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 px-1 sm:mt-10 sm:gap-x-6">
          {[
            { icon: <CheckCircle2 className="size-3.5 shrink-0 text-[#1ABD6A]" />, label: t("badgeGenuine") },
            { icon: <Sparkles className="size-3.5 shrink-0 text-[#FAD126]" />, label: t("badgeStandards") },
            { icon: <ShieldCheck className="size-3.5 shrink-0 text-[#20A4D8]" />, label: t("badgeFresh") },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex max-w-full items-center gap-1.5 text-[13px] font-semibold text-white/60"
            >
              {icon}
              <span className="truncate">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
