"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { barcodeService, type Symbology } from "@/services/barcode.service";

interface BarcodePreviewProps {
  symbology: Symbology;
  /** The value to encode. Falls back to the example from the catalogue. */
  value?: string;
  /** Module scale — 2 for screen, 3+ for print. */
  scale?: number;
  /** Show the human-readable text line beneath the bars. */
  showText?: boolean;
  className?: string;
}

/**
 * Live barcode preview.
 *
 * Renders the actual symbol the printer will produce, using the same BWIPP
 * encoder on the server. An operator sees exactly what will come out of the
 * printer — no guessing whether a Data Matrix fits on the label or whether
 * the ITF-14 bars are readable.
 *
 * Falls back to the spec's example value when nothing has been typed yet, so
 * the picker shows a preview of each type before the operator selects one.
 */
function getDefaultExample(symbology: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://santrack.rw");

  const examples: Record<string, string> = {
    QR: `${baseUrl}/verify/demo`,
    GS1_QR: `https://id.gs1.org/01/06161106380602/21/SAMPLE123`,
    DATA_MATRIX: "SANTRACK-ITEM-001",
    GS1_DATA_MATRIX: "010616110638060221SAMPLE123",
    PDF417: "SANTRACK-PDF417-DEMO",
    AZTEC: "SANTRACK-AZTEC",
    EAN_13: "6161106380602",
    EAN_8: "12345670",
    UPC_A: "012345678905",
    UPC_E: "0123456",
    ISBN: "9780306406157",
    ITF_14: "10616110638069",
    GS1_128: "(01)06161106380602(10)LOT123",
    SSCC_18: "000616110638060212",
    CODE_128: "SANTRACK-128",
    CODE_39: "SANTRACK-39",
    CODE_93: "SANTRACK-93",
    CODABAR: "A12345678B",
  };

  return examples[symbology] || "SANTRACK-DEMO";
}

export function BarcodePreview({
  symbology,
  value,
  scale = 2,
  showText = true,
  className,
}: BarcodePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Revoke the previous blob URL to avoid memory leaks
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    const fallback = getDefaultExample(symbology);
    const displayValue = value?.trim() || fallback;

    setLoading(true);
    barcodeService
      .render({
        symbology,
        value: displayValue,
        scale,
        showText,
        format: "svg",
      })
      .then((blobUrl) => {
        if (!cancelled) {
          urlRef.current = blobUrl;
          setUrl(blobUrl);
          setError(false);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbology, value, scale, showText]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 ${className ?? "h-16"}`}
      >
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 text-xs text-muted-foreground ${className ?? "h-16"}`}
      >
        Preview unavailable
      </div>
    );
  }

  return url ? (
    <img
      src={url}
      alt={`${symbology} barcode preview`}
      className={`block ${className ?? "max-h-32 w-auto"}`}
    />
  ) : null;
}
