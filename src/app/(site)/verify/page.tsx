"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Public consumer verify entry.
 *
 * Accepts the unit QR (UUID /verify link) and the printed serial (ST-…).
 * Product catalogue barcodes (GTIN/SKU) are not unique to one pack.
 */

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

export default function ConsumerVerifyPage() {
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
      setCameraError(
        "Camera permission was denied or is unavailable. Type the serial or QR payload manually, or allow camera access.",
      );
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

  const corner = "absolute size-5 border-rwanda-yellow";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-primary text-white">
      {/* ── Flag edge ── */}
      <div className="flex h-1.5 shrink-0">
        <span className="flex-1 bg-rwanda-blue" />
        <span className="flex-1 bg-rwanda-yellow" />
        <span className="flex-1 bg-rwanda-green" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-7 pt-5">
        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RwandaMark />
            <div className="leading-none">
              <p className="text-[11px] font-extrabold tracking-[0.22em] text-white">
                SANTRACK
              </p>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.18em] text-white/55">
                PUBLIC VERIFICATION
              </p>
            </div>
          </div>
          <p className="text-right text-[10px] font-semibold uppercase tracking-widest text-white/55">
            National registry
          </p>
        </header>

        {/* ── Hero copy ── */}
        <div className="mt-9 text-center">
          <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-3xl">
            Check it&apos;s genuine.
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/75">
            Scan the QR code or type the ST‑serial printed on the label — the
            registry answers in seconds.
          </p>
        </div>

        {/* ── Mode switch (no pill card) ── */}
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMode("camera")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all",
              activeMode === "camera"
                ? "bg-white text-primary"
                : "text-white/70 hover:text-white",
            )}
          >
            <Camera className="size-3.5" />
            Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all",
              activeMode === "manual"
                ? "bg-white text-primary"
                : "text-white/70 hover:text-white",
            )}
          >
            <QrCode className="size-3.5" />
            Type code
          </button>
        </div>

        {/* ── Interactive panel ── */}
        <div className="mt-6">
          {activeMode === "camera" ? (
            <div className="text-center">
              {/* Camera viewport — no surrounding card chrome */}
              <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[1.75rem] bg-slate-950">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {cameraActive && (
                  <div className="pointer-events-none absolute inset-0">
                    {/* Corner brackets */}
                    <div
                      className={cn(
                        corner,
                        "-left-0.5 -top-0.5 border-l-[3px] border-t-[3px] rounded-tl-2xl",
                      )}
                    />
                    <div
                      className={cn(
                        corner,
                        "-right-0.5 -top-0.5 border-r-[3px] border-t-[3px] rounded-tr-2xl",
                      )}
                    />
                    <div
                      className={cn(
                        corner,
                        "-bottom-0.5 -left-0.5 border-b-[3px] border-l-[3px] rounded-bl-2xl",
                      )}
                    />
                    <div
                      className={cn(
                        corner,
                        "-bottom-0.5 -right-0.5 border-b-[3px] border-r-[3px] rounded-br-2xl",
                      )}
                    />
                    {/* Breathing focus line */}
                    <div className="absolute left-6 right-6 top-1/2 h-px animate-pulse bg-rwanda-yellow shadow-[0_0_10px_#fac600]" />
                    <p className="absolute inset-x-0 bottom-3 text-center text-[10px] font-semibold tracking-[0.2em] text-white/70">
                      ALIGN THE CODE INSIDE
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-warning">
                      <CameraOff className="size-5 text-warning-foreground" />
                    </span>
                    <p className="max-w-[240px] text-xs leading-relaxed text-white/80">
                      {cameraError}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveMode("manual")}
                      className="h-9 rounded-full bg-warning px-4 text-xs font-extrabold text-warning-foreground hover:brightness-95"
                    >
                      Type the code instead
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-white/65">
                <button
                  type="button"
                  onClick={() => void toggleCamera()}
                  disabled={!cameraActive}
                  className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  <RotateCw className="size-3" />
                  Switch lens
                </button>
                <span className="text-white/30">•</span>
                <span>Works with QR, Data Matrix &amp; serials</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    <Search className="size-4" />
                  </div>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="QR UUID, ST-… serial, or /verify/… link"
                    className="h-13 rounded-2xl border-0 bg-white py-0 pl-11 pr-12 font-mono text-sm text-slate-900 shadow-lg shadow-primary-dark/10 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-rwanda-yellow"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    aria-label="Verify code"
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-rwanda-yellow text-warning-foreground shadow-md transition-all hover:brightness-95 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="h-12 w-full rounded-2xl bg-white text-xs font-extrabold uppercase tracking-[0.18em] text-primary shadow-lg shadow-primary-dark/10 hover:bg-slate-100"
                >
                  <ShieldCheck className="mr-2 size-4" />
                  Verify in the registry
                </Button>
              </form>

              <p className="text-center text-[11px] leading-relaxed text-white/60">
                QR UUIDs, ST‑serials and full /verify links all work. Shelf
                barcodes (GTIN) name every pack of a product, so they cannot
                verify a single unit.
              </p>
            </div>
          )}
        </div>

        {/* ── Promise strip ── */}
        <div className="mt-auto pt-9">
          <div className="flex items-center justify-center gap-5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/85">
              <CheckCircle2 className="size-3.5 text-rwanda-yellow" />
              Genuine
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/85">
              <Sparkles className="size-3.5 text-rwanda-yellow" />
              Standards checked
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/85">
              <ShieldCheck className="size-3.5 text-rwanda-yellow" />
              Batch fresh
            </span>
          </div>
          <p className="mt-4 text-center text-[10px] font-medium tracking-wide text-white/45">
            SanTrack — unit-level traceability for Rwanda
          </p>
        </div>
      </div>
    </div>
  );
}
