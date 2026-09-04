"use client";

import { useEffect, useRef, useState } from "react";
import type { Template } from "@pdfme/common";
import { getDefaultFont } from "@pdfme/common";
import { Loader2 } from "lucide-react";
import { PDFME_LABEL_PLUGINS } from "@/lib/pdfme-labels";

type ViewerInstance = InstanceType<
  Awaited<typeof import("@pdfme/ui")>["Viewer"]
>;

export function PdfmeViewerHost({
  template,
  inputs,
  hostKey,
}: {
  template: Template;
  inputs: Record<string, string>[];
  hostKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setReady(false);
    container.replaceChildren();

    void (async () => {
      const { Viewer } = await import("@pdfme/ui");
      if (cancelled || !containerRef.current) return;

      const viewer = new Viewer({
        domContainer: containerRef.current,
        template,
        inputs,
        plugins: PDFME_LABEL_PLUGINS,
        options: { font: getDefaultFont() },
      });
      viewerRef.current = viewer;
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount via hostKey
  }, [hostKey]);

  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.updateTemplate(template);
    viewerRef.current.setInputs(inputs);
  }, [template, inputs]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-border/80 bg-[#edf2f7] shadow-inner flex items-center justify-center">
      <div ref={containerRef} className="h-full w-full" />
      {inputs.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-muted-foreground">
          No label data to preview
        </div>
      ) : !ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#edf2f7]/80 backdrop-blur-xs">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : null}
    </div>
  );
}
