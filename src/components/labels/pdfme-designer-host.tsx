"use client";

import { useEffect, useRef, useState } from "react";
import type { Template } from "@pdfme/common";
import { getDefaultFont } from "@pdfme/common";
import { Loader2 } from "lucide-react";
import { PDFME_LABEL_PLUGINS } from "@/lib/pdfme-labels";
import "./pdfme-designer-theme.css";

type DesignerInstance = InstanceType<
  Awaited<typeof import("@pdfme/ui")>["Designer"]
>;

export function PdfmeDesignerHost({
  template,
  onTemplateChange,
  hostKey,
}: {
  template: Template;
  onTemplateChange: (template: Template) => void;
  /** Remount when preset/pool resets. */
  hostKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<DesignerInstance | null>(null);
  const onChangeRef = useRef(onTemplateChange);
  const [ready, setReady] = useState(false);
  onChangeRef.current = onTemplateChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setReady(false);
    container.replaceChildren();

    void (async () => {
      const { Designer } = await import("@pdfme/ui");
      if (cancelled || !containerRef.current) return;

      const designer = new Designer({
        domContainer: containerRef.current,
        template,
        plugins: PDFME_LABEL_PLUGINS,
        options: {
          font: getDefaultFont(),
          theme: {
            token: {
              colorPrimary: "#0284c7",
              borderRadius: 8,
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
            },
          },
        },
      });

      designer.onChangeTemplate((next) => onChangeRef.current(next));
      designerRef.current = designer;
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      designerRef.current?.destroy();
      designerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount via hostKey
  }, [hostKey]);

  useEffect(() => {
    designerRef.current?.updateTemplate(template);
  }, [template]);

  return (
    <div className="santrack-designer-canvas relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-border/80 shadow-xs">
      <div ref={containerRef} className="h-full w-full" />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f8fafc]/90 backdrop-blur-xs z-30">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">
            Initializing Packaging Studio…
          </p>
        </div>
      ) : null}
    </div>
  );
}
