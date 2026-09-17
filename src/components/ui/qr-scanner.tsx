"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import {
  Barcode,
  Camera,
  CameraOff,
  Check,
  Loader2,
  RotateCw,
  X,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── ZXing Engine Configuration ──────────────────────────────────────────────
const SUPPORTED_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
];

function createZXingBrowserReader(): BrowserMultiFormatReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

export type ScannerPhase =
  | "idle"
  | "initializing"
  | "searching"
  | "detected"
  | "scanned"
  | "error";

const GUIDANCE: Record<ScannerPhase, string> = {
  idle: "",
  initializing: "Starting camera…",
  searching: "Point camera at a barcode",
  detected: "Hold steady…",
  scanned: "✓ Scanned",
  error: "Camera unavailable",
};

// Corner brackets for the visual reticle
const RETICLE_CORNERS = [
  { key: "tl", className: "-top-0.5 -left-0.5 border-t-2 border-l-2 rounded-tl-md" },
  { key: "tr", className: "-top-0.5 -right-0.5 border-t-2 border-r-2 rounded-tr-md" },
  { key: "br", className: "-bottom-0.5 -right-0.5 border-b-2 border-r-2 rounded-br-md" },
  { key: "bl", className: "-bottom-0.5 -left-0.5 border-b-2 border-l-2 rounded-bl-md" },
] as const;

// ── Compact Camera Viewfinder Component ─────────────────────────────────────
interface CompactCameraProps {
  facingMode: "environment" | "user";
  onScan: (code: string) => void;
  onClose: () => void;
  onToggleFacingMode: () => void;
  aspect?: "wide" | "square";
}

function CompactCamera({
  facingMode,
  onScan,
  onClose,
  onToggleFacingMode,
  aspect = "wide",
}: CompactCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [phase, setPhase] = useState<ScannerPhase>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phaseRef = useRef<ScannerPhase>("initializing");
  const scanLoopIdRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef(0);

  const updatePhase = useCallback((next: ScannerPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // ── Camera stream lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    if (!zxingReaderRef.current) {
      zxingReaderRef.current = createZXingBrowserReader();
    }

    const startCamera = async () => {
      setErrorMessage(null);
      updatePhase("initializing");

      // Stop any existing tracks before opening a new stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        let stream: MediaStream;

        // Try ideal facingMode first
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic facingMode constraint or default video device
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode },
              audio: false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if (!isCancelled) {
          updatePhase("searching");
        }
      } catch (err) {
        if (isCancelled) return;
        updatePhase("error");
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Permission") ||
          msg.includes("NotAllowedError") ||
          msg.toLowerCase().includes("denied")
        ) {
          setErrorMessage(
            "Camera permission denied. Allow camera access in browser settings, or enter code manually.",
          );
        } else if (
          msg.includes("NotFound") ||
          msg.includes("DevicesNotFoundError")
        ) {
          setErrorMessage("No camera detected on this device. Please use manual entry.");
        } else {
          setErrorMessage("Camera unavailable or in use. Please use manual entry.");
        }
      }
    };

    void startCamera();

    return () => {
      isCancelled = true;
      if (scanLoopIdRef.current) {
        cancelAnimationFrame(scanLoopIdRef.current);
        scanLoopIdRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [facingMode, updatePhase]);

  // ── High-Performance Scanning Loop ────────────────────────────────────────
  useEffect(() => {
    if (phase === "error" || phase === "initializing") return;

    let isScanning = true;
    let lastScanTime = 0;
    const SCAN_INTERVAL_MS = 60; // ~16 scans/sec: instant responsiveness

    type NativeDetector = {
      detect: (
        source: HTMLVideoElement,
      ) => Promise<Array<{ boundingBox: DOMRectReadOnly; rawValue: string }>>;
    };
    let nativeDetector: NativeDetector | null = null;

    const initDetector = async () => {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const supported = await (
            window as unknown as {
              BarcodeDetector: { getSupportedFormats: () => Promise<string[]> };
            }
          ).BarcodeDetector.getSupportedFormats().catch(() => []);
          if (supported && supported.length > 0) {
            const DetCtor = (
              globalThis as unknown as {
                BarcodeDetector: new (opts: { formats: string[] }) => NativeDetector;
              }
            ).BarcodeDetector;
            nativeDetector = new DetCtor({ formats: supported });
          }
        } catch {
          nativeDetector = null;
        }
      }
    };
    void initDetector();

    const clearOverlay = () => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawBoundingBox = (box: DOMRectReadOnly, videoWidth: number, videoHeight: number) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.clientWidth || videoWidth;
      canvas.height = canvas.clientHeight || videoHeight;

      // Map video coordinates to rendered canvas coordinates (object-cover)
      const scaleX = canvas.width / videoWidth;
      const scaleY = canvas.height / videoHeight;
      const scale = Math.max(scaleX, scaleY);

      const offsetX = (canvas.width - videoWidth * scale) / 2;
      const offsetY = (canvas.height - videoHeight * scale) / 2;

      const rx = box.x * scale + offsetX;
      const ry = box.y * scale + offsetY;
      const rw = box.width * scale;
      const rh = box.height * scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fillRect(rx, ry, rw, rh);
    };

    const processFrame = async (timestamp: number) => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        scanLoopIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Throttle scanning frame rate
      if (timestamp - lastScanTime < SCAN_INTERVAL_MS) {
        scanLoopIdRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastScanTime = timestamp;

      // Reset temporary 'detected' state to 'searching' if lost
      if (
        phaseRef.current === "detected" &&
        timestamp - lastDetectionTimeRef.current > 700
      ) {
        updatePhase("searching");
        clearOverlay();
      }

      let detectedCode: string | null = null;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // ── Step 1: Fast Native BarcodeDetector ("Hardware Accelerated") ────────
      if (nativeDetector) {
        try {
          const results = await nativeDetector.detect(video);
          if (results.length > 0) {
            const first = results[0];
            detectedCode = first.rawValue;
            drawBoundingBox(first.boundingBox, vw, vh);
            lastDetectionTimeRef.current = timestamp;
            if (phaseRef.current !== "detected") {
              updatePhase("detected");
            }
          }
        } catch {
          // Native detector error, fall back to ZXing
        }
      }

      // ── Step 2: Robust ZXing Browser Multi-Format Reader ───────────────────
      if (!detectedCode && zxingReaderRef.current) {
        try {
          const result = zxingReaderRef.current.decode(video);
          if (result && result.getText()) {
            detectedCode = result.getText();
          }
        } catch {
          // Normal NotFoundException when no code in frame
        }
      }

      // ── Step 3: Handle Decoded Code ───────────────────────────────────────
      if (detectedCode) {
        updatePhase("scanned");
        onScan(detectedCode);

        // Keep camera active and resume scanning after brief feedback
        setTimeout(() => {
          if (isScanning) {
            updatePhase("searching");
            clearOverlay();
            scanLoopIdRef.current = requestAnimationFrame(processFrame);
          }
        }, 800);
        return;
      }

      scanLoopIdRef.current = requestAnimationFrame(processFrame);
    };

    scanLoopIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isScanning = false;
      if (scanLoopIdRef.current) {
        cancelAnimationFrame(scanLoopIdRef.current);
        scanLoopIdRef.current = null;
      }
      clearOverlay();
    };
  }, [phase, onScan, updatePhase]);

  // Error state display
  if (phase === "error" || errorMessage) {
    return (
      <div className="relative flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
        <CameraOff className="size-6 text-destructive/80" />
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          {errorMessage || "Unable to access the camera."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-7 text-xs"
        >
          Use Manual Entry
        </Button>
      </div>
    );
  }

  const isWide = aspect === "wide";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border bg-slate-950 shadow-xs",
        isWide ? "aspect-[16/9] max-h-[320px] sm:max-h-[380px]" : "aspect-square max-h-[380px]",
      )}
    >
      {/* Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Detection Box Canvas Overlay */}
      <canvas
        ref={overlayCanvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Camera Loading Spinner */}
      {phase === "initializing" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-xs text-white">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-[13px] font-medium text-white/80">
            Initializing camera…
          </span>
        </div>
      )}

      {/* Floating Top Controls (Minimal, Non-obtrusive) */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Subtle Live Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleFacingMode}
            className="size-7 p-0 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md"
            title="Flip camera"
          >
            <RotateCw className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-7 p-0 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md"
            title="Close camera"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Reticle / Target Scan Region */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative transition-all duration-200",
            isWide
              ? "w-[70%] max-w-[320px] h-[75%] max-h-[260px]"
              : "w-[65%] max-w-[240px] aspect-square",
            phase === "scanned"
              ? "scale-105"
              : phase === "detected"
                ? "scale-102"
                : "scale-100",
          )}
        >
          {/* Corner Brackets */}
          {RETICLE_CORNERS.map((c) => (
            <div
              key={c.key}
              className={cn(
                "absolute size-4.5 sm:size-5 transition-colors duration-150",
                c.className,
                phase === "scanned"
                  ? "border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : phase === "detected"
                    ? "border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : "border-white/70",
              )}
            />
          ))}

          {/* Laser Sweep Line ("Active during searching") */}
          {phase === "searching" && (
            <div className="absolute inset-x-2 inset-y-1 overflow-hidden opacity-75">
              <div className="h-[2px] w-full rounded-full bg-primary shadow-[0_0_8px_rgba(6,126,218,0.8)] animate-[scanSweep_2s_easeInOut_infinite]" />
            </div>
          )}
        </div>
      </div>

      {/* Compact Guidance Pill ("Bottom Center") */}
      <div className="pointer-events-none absolute bottom-2.5 inset-x-0 z-20 flex justify-center px-4">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium shadow-md backdrop-blur-md transition-all duration-200",
            phase === "scanned"
              ? "bg-success text-white"
              : phase === "detected"
                ? "bg-warning text-warning-foreground"
                : "bg-black/60 text-white/90 border border-white/10",
          )}
        >
          {phase === "scanned" && <Check className="size-3" />}
          <span>{GUIDANCE[phase]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Production-Grade Barcode & QR Scanner Input ────────────────────────
export interface QrScanInputProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
  /** Description for assistive text, e.g. "a product unit or lot code". */
  scanning?: string;
  className?: string;
  /** If true, renders a clean single-line bar without top headers. */
  compact?: boolean;
  aspect?: "wide" | "square";
}

export function QrScanInput({
  onScan,
  placeholder = "Scan barcode or type code…",
  label,
  scanning = "an item",
  className,
  compact = false,
  aspect = "wide",
}: QrScanInputProps) {
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [gunActive, setGunActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");

  const inputRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const gunResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Central Accept & Duplicate Protection Pipeline ────────────────────────
  const accept = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Duplicate protection:
      // - Prevent identical barcode within 1500ms
      // - Prevent any barcode within 350ms
      if (
        (lastScanRef.current.code === trimmed && now - lastScanRef.current.time < 1500) ||
        now - lastScanRef.current.time < 350
      ) {
        return;
      }
      lastScanRef.current = { code: trimmed, time: now };

      setManual("");
      bufferRef.current = "";
      setGunActive(false);
      setLastScanned(trimmed);
      onScan(trimmed);
    },
    [onScan],
  );

  // Auto-dismiss last scanned banner after 2.5s
  useEffect(() => {
    if (!lastScanned) return;
    const t = setTimeout(() => setLastScanned(null), 2500);
    return () => clearTimeout(t);
  }, [lastScanned]);

  // ── Hardware USB/Bluetooth HID Wedge Scanner Detection ────────────────────
  useEffect(() => {
    const GUN_GAP_MS = 45; // Rapid keystrokes from hardware barcode scanners
    const GUN_MIN_LENGTH = 3;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;

      // Do not intercept keystrokes in other form inputs/textareas
      const inAnotherField =
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (tag === "INPUT" && target !== inputRef.current) ||
        target?.isContentEditable === true;
      if (inAnotherField) return;

      const now = Date.now();
      const gap = now - lastKeyAtRef.current;
      lastKeyAtRef.current = now;

      if (event.key === "Enter") {
        const gunCode = bufferRef.current.trim();
        const inputCode = inputRef.current?.value?.trim() || manual.trim();

        bufferRef.current = "";
        setGunActive(false);

        if (gunCode.length >= GUN_MIN_LENGTH) {
          event.preventDefault();
          event.stopPropagation();
          accept(gunCode);
        } else if (target === inputRef.current && inputCode) {
          event.preventDefault();
          event.stopPropagation();
          accept(inputCode);
        }
        return;
      }

      if (event.key.length !== 1) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      bufferRef.current =
        gap > GUN_GAP_MS ? event.key : bufferRef.current + event.key;

      if (bufferRef.current.length >= GUN_MIN_LENGTH) {
        setGunActive(true);
      }

      if (gunResetTimeoutRef.current) clearTimeout(gunResetTimeoutRef.current);
      gunResetTimeoutRef.current = setTimeout(() => {
        bufferRef.current = "";
        setGunActive(false);
      }, 350);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (gunResetTimeoutRef.current) clearTimeout(gunResetTimeoutRef.current);
    };
  }, [accept, manual]);

  const submitManual = () => {
    if (!manual.trim()) return;
    accept(manual);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Optional Top Status Header ("only when not in compact mode") */}
      {!compact && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full transition-all",
                gunActive ? "bg-emerald-500 animate-ping" : "bg-emerald-500",
              )}
            />
            <span>
              {gunActive ? (
                <strong className="text-emerald-600 dark:text-emerald-400">
                  Reading barcode…
                </strong>
              ) : (
                <>Ready for {scanning}</>
              )}
            </span>
          </div>
          <Button
            type="button"
            variant={cameraOn ? "default" : "outline"}
            size="sm"
            onClick={() => setCameraOn(!cameraOn)}
            className="h-7 gap-1.5 text-xs"
          >
            {cameraOn ? (
              <>
                <CameraOff className="size-3" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Camera className="size-3" />
                <span>Camera</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Single-Line Operational Input Bar ── */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          {gunActive ? (
            <Zap className="size-4 text-emerald-500 animate-pulse" />
          ) : (
            <Barcode className="size-4" />
          )}
        </div>

        <Input
          ref={inputRef}
          value={manual}
          placeholder={placeholder}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitManual();
            }
          }}
          className="h-10 rounded-lg border-input bg-background pl-9 pr-24 font-mono text-sm shadow-2xs focus-visible:ring-1 focus-visible:ring-primary"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Quick Clear Button */}
          {manual.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManual("")}
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              title="Clear"
            >
              <X className="size-3.5" />
            </Button>
          )}

          {/* Compact Camera Toggle Icon Button */}
          <Button
            type="button"
            variant={cameraOn ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCameraOn(!cameraOn)}
            className={cn(
              "size-7 p-0 transition-colors",
              cameraOn ? "text-primary bg-primary-light" : "text-muted-foreground hover:text-foreground",
            )}
            title={cameraOn ? "Close Camera" : "Scan with Camera"}
          >
            {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          </Button>

          {/* Submit / Scan Button */}
          <Button
            type="button"
            size="sm"
            onClick={submitManual}
            disabled={!manual.trim()}
            className="h-7 px-2.5 text-xs font-medium gap-1"
          >
            <span>Scan</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* ── Compact Camera Viewfinder ("animated open/close", "below input") ── */}
      <AnimatePresence>
        {cameraOn && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="mx-auto max-w-lg overflow-hidden"
          >
            <CompactCamera
              aspect={aspect}
              facingMode={cameraFacing}
              onScan={(code) => {
                accept(code);
              }}
              onClose={() => setCameraOn(false)}
              onToggleFacingMode={() =>
                setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Captured Code Confirmation ── */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="flex items-center justify-center gap-2 py-1.5 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <Check className="size-3.5 shrink-0" />
            <span className="font-medium">Captured:</span>
            <span className="font-mono font-semibold">{lastScanned}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
