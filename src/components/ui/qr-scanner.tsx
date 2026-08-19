"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QrScanInputProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
}

/**
 * QR code input with optional inline camera scanner.
 * USB scanners work automatically — just click the input and scan.
 *
 * Flow: scan → code appears in input → user confirms with Enter or button.
 */
export function QrScanInput({ onScan, placeholder = "Scan or enter QR code...", label }: QrScanInputProps) {
  const [input, setInput] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    const code = input.trim();
    if (code) {
      onScan(code);
      setInput("");
      setLastScanned(null);
    }
  }, [input, onScan]);

  const handleCameraScan = useCallback((code: string) => {
    setInput(code);
    setLastScanned(code);
    setCameraOn(false);
  }, []);

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={cameraOn ? "default" : "outline"}
          size="icon"
          onClick={() => setCameraOn((v) => !v)}
          title={cameraOn ? "Close camera" : "Open camera"}
        >
          {cameraOn ? <X className="size-4" /> : <Camera className="size-4" />}
        </Button>
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => { setInput(e.target.value); setLastScanned(null); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button type="button" onClick={handleSubmit} disabled={!input.trim()}>
          <Check className="size-4" />
        </Button>
      </div>

      {lastScanned && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <Check className="size-4" />
          <span className="font-mono">{lastScanned}</span>
        </div>
      )}

      {cameraOn && (
        <div className="w-full max-w-[200px]">
          <InlineCamera onScan={handleCameraScan} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small square inline camera viewfinder
// ---------------------------------------------------------------------------

function InlineCamera({ onScan }: { onScan: (code: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    const id = "qr-cam-" + Math.random().toString(36).slice(2, 8);

    const start = async () => {
      if (!containerRef.current || cancelled) return;
      containerRef.current.id = id;

      scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 180, height: 180 }, aspectRatio: 1 },
          (text) => { if (!cancelled) onScan(text); },
          () => {}
        );

        if (!cancelled && containerRef.current) {
          const video = containerRef.current.querySelector("video");
          if (video?.srcObject instanceof MediaStream) {
            streamRef.current = video.srcObject;
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg.includes("Permission") ? "Camera permission denied" : "Camera not available");
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      try { scanner?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      try { scanner?.clear(); } catch {}
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <CameraOff className="size-3.5 text-destructive" />
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="aspect-square w-full overflow-hidden rounded-lg border"
    />
  );
}
