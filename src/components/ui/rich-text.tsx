import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared prose styles for TipTap HTML — editor and read-only display.
 *
 * Keep these in one place so a recall reason, inspection note, or consultation
 * reply renders the same way it was authored.
 */
export const RICH_TEXT_PROSE_CLASS = [
  "[&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold",
  "[&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold",
  "[&_p]:mb-1.5 [&_p:last-child]:mb-0",
  "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:mb-0.5",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-3 [&_hr]:border-border",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
].join(" ");

/** True when TipTap would treat the value as an empty document. */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  return plainTextFromHtml(html).length === 0;
}

/**
 * Plain text from stored HTML (or legacy plain strings).
 *
 * Use for search, table previews, print lines, and emptiness checks — never
 * for the primary on-screen rendering of authored rich content.
 */
export function plainTextFromHtml(html: string | null | undefined): string {
  if (!html) return "";
  const trimmed = html.trim();
  if (!trimmed) return "";

  // Already plain (legacy recall reasons and similar).
  if (!/[<>]/.test(trimmed)) return trimmed;

  if (typeof document === "undefined") {
    return trimmed
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  const el = document.createElement("div");
  el.innerHTML = trimmed;
  return (el.textContent ?? el.innerText ?? "").replace(/\u00a0/g, " ").trim();
}

/**
 * Renders HTML authored in {@link RichTextEditor}.
 *
 * Plain legacy strings (no tags) render as ordinary text so older recall
 * reasons still display correctly.
 */
export function RichTextDisplay({
  html,
  className,
  empty,
}: {
  html: string | null | undefined;
  className?: string;
  /** Shown when there is nothing to display. Omit to render nothing. */
  empty?: ReactNode;
}) {
  if (isRichTextEmpty(html)) {
    return empty ? <>{empty}</> : null;
  }

  const value = html!.trim();
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(value);

  if (!looksLikeHtml) {
    return (
      <div className={cn("text-sm leading-relaxed whitespace-pre-wrap", className)}>
        {value}
      </div>
    );
  }

  return (
    <div
      className={cn("text-sm leading-relaxed", RICH_TEXT_PROSE_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}
