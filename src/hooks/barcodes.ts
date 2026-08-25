"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  barcodeService,
  type CheckResult,
  type RenderOptions,
  type Symbology,
  type SymbologyCatalogue,
} from "@/services/barcode.service";

export const barcodeKeys = {
  all: ["barcodes"] as const,
  catalogue: ["barcodes", "symbologies"] as const,
  check: (symbology: Symbology, value: string) =>
    ["barcodes", "check", symbology, value] as const,
};

/**
 * The symbology catalogue. Reference data — it changes when the platform is
 * redeployed, not while somebody is printing labels.
 */
export function useSymbologies() {
  return useQuery<SymbologyCatalogue>({
    queryKey: barcodeKeys.catalogue,
    queryFn: barcodeService.catalogue,
    staleTime: 60 * 60_000,
  });
}

/**
 * Live validation while the operator types.
 *
 * Debounced, because every keystroke of a thirteen-digit GTIN is a partial
 * value the check digit rules will reject, and flashing "wrong check digit" at
 * somebody halfway through typing teaches them to ignore it.
 */
export function useBarcodeCheck(
  symbology: Symbology | undefined,
  value: string,
  { debounceMs = 350 }: { debounceMs?: number } = {},
) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return useQuery<CheckResult>({
    queryKey: barcodeKeys.check(symbology!, settled),
    queryFn: () => barcodeService.check(symbology!, settled),
    enabled: !!symbology && settled.trim().length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Renders a label and keeps the object URL alive only as long as it is shown.
 *
 * Blob URLs are not garbage collected — they are held by the document until
 * revoked — so a preview that re-renders on every keystroke leaks the whole
 * session's worth of PNGs without this.
 */
export function useBarcodePreview(options: RenderOptions | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const key = options ? JSON.stringify(options) : null;

  useEffect(() => {
    if (!key || !options?.value?.trim()) {
      setUrl(null);
      setProblem(null);
      return;
    }

    let cancelled = false;
    let created: string | null = null;

    setRendering(true);
    setProblem(null);

    barcodeService
      .render(options)
      .then((next) => {
        if (cancelled) {
          URL.revokeObjectURL(next);
          return;
        }
        created = next;
        setUrl(next);
      })
      .catch(async (error: unknown) => {
        if (cancelled) return;
        setUrl(null);
        setProblem(await readBlobError(error));
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
    // `key` is the serialised options, so this re-runs exactly when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { url, rendering, problem };
}

/**
 * The API's refusal arrives as a Blob, because the request asked for one.
 * Reading it back is what turns "Request failed with status code 400" into the
 * sentence the backend actually wrote.
 */
async function readBlobError(error: unknown): Promise<string> {
  const data = (error as { response?: { data?: unknown } })?.response?.data;

  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON — fall through to the generic message below.
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Could not render this code";
}
