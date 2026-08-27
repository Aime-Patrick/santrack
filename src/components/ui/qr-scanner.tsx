"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Check,
  Keyboard,
  ScanLine,
  X,
  Zap,
  RotateCw,
  Barcode,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QrScanInputProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
  /** What is being scanned, for the prompt: "a unit, box or pallet". */
  scanning?: string;
  className?: string;
}

/**
 * Enterprise-grade hardware & camera barcode scanner input.
 *
 * Supported scan modalities:
 *  1. **Hardware Gun Scanner** (USB/Bluetooth HID wedge) — instant keystroke burst listener.
 *  2. **Camera Scanner** (HTML5-QRCode) — high-framerate multi-symbology video decoder with reticle.
 *  3. **Direct Manual Input** — fast keyboard fallback with Enter shortcut.
 */
export function QrScanInput({
  onScan,
  placeholder = "Scan barcode or type code…",
  label,
  scanning = "an item",
  className,
}: QrScanInputProps) {
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [gunActive, setGunActive] = useState(false);
  const [gunConnected, setGunConnected] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");

  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Debounce: prevent duplicate scan of the same barcode within 1.2s or any scan within 350ms
      if (
        (lastScanRef.current.code === trimmed && now - lastScanRef.current.time < 1200) ||
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

  // Auto-dismiss capture flash so it does not linger over the cart.
  useEffect(() => {
    if (!lastScanned) return;
    const t = setTimeout(() => setLastScanned(null), 2500);
    return () => clearTimeout(t);
  }, [lastScanned]);

  // ── Hardware gun scanner detection ────────────────────────────────
  useEffect(() => {
    const GUN_GAP_MS = 45; // Max gap between characters from a hardware scanner
    const GUN_MIN_LENGTH = 3;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;

      // Don't intercept when user is typing in unrelated form fields
      const inAField =
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (tag === "INPUT" && target !== inputRef.current) ||
        target?.isContentEditable === true;
      if (inAField) return;

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
        setGunConnected(true);
      }

      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => {
        bufferRef.current = "";
        setGunActive(false);
      }, 350);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, [accept, manual]);

  // Auto-clear last scanned notification banner after 3.5s
  useEffect(() => {
    if (!lastScanned) return;
    const t = setTimeout(() => setLastScanned(null), 3500);
    return () => clearTimeout(t);
  }, [lastScanned]);

  const submitManual = () => {
    if (!manual.trim()) return;
    accept(manual);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Header: Scanner Status & Mode Switchers ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-muted/40 p-2 sm:px-3">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={cn(
              "flex size-2 rounded-full transition-all duration-300",
              gunActive
                ? "bg-emerald-500 ring-4 ring-emerald-500/20 animate-ping"
                : gunConnected
                  ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                  : "bg-blue-500 ring-2 ring-blue-500/20",
            )}
          />
          {gunActive ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
              <Zap className="size-3 text-emerald-500" /> Reading barcode…
            </span>
          ) : (
            <span className="text-foreground/80 font-medium">
              Ready for {scanning}
              <span className="hidden sm:inline text-muted-foreground">
                {" "}— auto-detects USB/BT scanner gun
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            type="button"
            variant={cameraOn ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all",
              cameraOn
                ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20"
                : "border-border bg-background hover:bg-muted text-foreground",
            )}
            onClick={() => setCameraOn(!cameraOn)}
          >
            {cameraOn ? (
              <>
                <CameraOff className="size-3.5" />
                <span>Close Camera</span>
              </>
            ) : (
              <>
                <Camera className="size-3.5 text-primary" />
                <span>Camera Scan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Camera Viewfinder Container ── */}
      {cameraOn && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-slate-950 p-4 shadow-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-medium text-slate-300">
                Live Viewfinder · Point at QR or Barcode
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1 rounded-md"
                onClick={() =>
                  setCameraFacing((prev) =>
                    prev === "environment" ? "user" : "environment",
                  )
                }
              >
                <RotateCw className="size-3" />
                <span className="hidden sm:inline">Flip</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                onClick={() => setCameraOn(false)}
                title="Close camera"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="mx-auto max-w-sm relative">
            <InlineCamera
              facingMode={cameraFacing}
              onScan={(code) => {
                accept(code);
                setCameraOn(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Main Input Bar (Search / Type) ── */}
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
          <Barcode className="size-4 text-primary/70" />
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
          className="h-11 pl-9 pr-24 font-mono text-sm tracking-wide rounded-xl border-input bg-background text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {manual.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
              onClick={() => setManual("")}
              title="Clear text"
            >
              <X className="size-3.5" />
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={submitManual}
            disabled={!manual.trim()}
            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1 shadow-xs"
          >
            <span>Scan</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* ── Last Scanned Notification Banner ── */}
      {lastScanned && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-success/40 bg-success px-3.5 py-2.5 text-xs text-success-foreground shadow-2xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 truncate">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Check className="size-3 stroke-[3]" />
            </div>
            <span className="font-medium">Code captured:</span>
            <span className="font-mono font-bold tracking-wide truncate">
              {lastScanned}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastScanned(null)}
            className="ml-2 text-success-foreground/80 hover:text-success-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Camera Viewfinder Component with Reticle & Laser Beam
// ---------------------------------------------------------------------------

function InlineCamera({
  facingMode = "environment",
  onScan,
}: {
  facingMode?: "environment" | "user";
  onScan: (code: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    const id = "scan-cam-" + Math.random().toString(36).slice(2, 8);

    const start = async () => {
      if (!containerRef.current || cancelled) return;
      containerRef.current.id = id;
      setLoading(true);
      setError(null);

      scanner = new Html5Qrcode(id, true);

      try {
        await scanner.start(
          { facingMode },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (text) => {
            if (!cancelled) onScan(text);
          },
          () => {},
        );

        if (!cancelled && containerRef.current) {
          setLoading(false);
          const video = containerRef.current.querySelector("video");
          if (video?.srcObject instanceof MediaStream) {
            streamRef.current = video.srcObject;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          const message = err instanceof Error ? err.message : String(err);
          setError(
            message.includes("Permission") || message.includes("NotAllowedError")
              ? "Camera permission denied. Allow camera access in browser settings, or enter the code manually."
              : "Camera unavailable or in use by another app. Please use manual entry.",
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      try {
        void scanner?.stop();
      } catch {
        /* already stopped */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      try {
        scanner?.clear();
      } catch {
        /* already cleared */
      }
    };
  }, [facingMode, onScan]);

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 leading-relaxed">
        <CameraOff className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold text-amber-300 mb-0.5">Camera Error</p>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black border border-slate-800 shadow-inner flex items-center justify-center">
      {/* ── Reticle Overlays ── */}
      <div
        ref={containerRef}
        className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-slate-300">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs">Initializing camera…</span>
        </div>
      )}

      {!loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* ── Scan Reticle Box ── */}
          <div className="relative size-48 rounded-lg border-2 border-primary/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 size-3.5 border-t-2 border-l-2 border-primary" />
            <div className="absolute -top-1 -right-1 size-3.5 border-t-2 border-r-2 border-primary" />
            <div className="absolute -bottom-1 -left-1 size-3.5 border-b-2 border-l-2 border-primary" />
            <div className="absolute -bottom-1 -right-1 size-3.5 border-b-2 border-r-2 border-primary" />

            {/* Laser scan line animation */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-pulse shadow-[0_0_8px_#3b82f6]" />
          </div>
        </div>
      )}
    </div>
  );
}
