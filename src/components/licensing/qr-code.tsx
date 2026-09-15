"use client";

import { useEffect, useState } from "react";
import { renderTrustQrDataUrl } from "@/lib/trust-qr";

interface QrCodeProps {
  /** The URL or string to encode. */
  value: string;
  /** Pixel size of the QR (width = height). Default 140. */
  size?: number;
  /** Quiet zone margin in modules. Default 2. */
  margin?: number;
  className?: string;
}

/**
 * Renders a SanTrack Trust QR as a data-URL <img>.
 * Works in browser and in print view.
 */
export function QrCodeImage({
  value,
  size = 140,
  margin = 2,
  className,
}: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderTrustQrDataUrl(value, {
      size: Math.max(size * 2, 280),
      margin,
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size, margin]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          background: "#f1f4f8",
          border: "1px solid #d9e1ea",
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={`Trust QR for ${value}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
