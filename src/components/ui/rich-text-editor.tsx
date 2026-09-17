"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RICH_TEXT_PROSE_CLASS } from "@/components/ui/rich-text";

// ── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {children}
    </button>
  );
}

// ── Editor component ─────────────────────────────────────────────────────────

interface RichTextEditorProps {
  /** Controlled HTML value */
  value?: string;
  /** Called with the updated HTML whenever content changes */
  onChange?: (html: string) => void;
  placeholder?: string;
  /** Tailwind classes forwarded to the outer wrapper */
  className?: string;
  /** Min height of the editable content area (default 120px) */
  minHeight?: number;
  /** Optional max character count — shows a counter when set */
  maxLength?: number;
  disabled?: boolean;
}

/**
 * Tiptap-powered rich text editor.
 *
 * Backed by StarterKit (bold, italic, headings, lists, blockquote, hr, undo/redo)
 * and an optional character counter. Outputs/accepts HTML so it integrates
 * seamlessly with any string-based form field.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  className,
  minHeight = 120,
  maxLength,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({ placeholder }),
      ...(maxLength
        ? [CharacterCount.configure({ limit: maxLength })]
        : []),
    ],
    content: value ?? "",
    editable: !disabled,
    onUpdate({ editor }) {
      // Return empty string for empty doc (avoids "<p></p>" noise)
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange?.(html);
    },
    // Sync external value changes (e.g. form reset)
    editorProps: {
      attributes: {
        class: "outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  const chars = maxLength ? editor?.storage.characterCount?.characters() ?? 0 : 0;
  const nearLimit = maxLength && chars > maxLength * 0.9;

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background text-sm transition-colors",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
      // Focus-ring mirrors Radix/shadcn inputs
      onFocus={(e) => e.currentTarget.classList.add("ring-2", "ring-ring/20", "border-primary")}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove("ring-2", "ring-ring/20", "border-primary");
        }
      }}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
        <ToolbarButton
          title="Bold (Ctrl+B)"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic (Ctrl+I)"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          title="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          title="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          title="Undo (Ctrl+Z)"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo (Ctrl+Shift+Z)"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo className="size-3.5" />
        </ToolbarButton>

        {maxLength && (
          <span
            className={cn(
              "ml-auto text-[13px] font-medium tabular-nums",
              nearLimit ? "text-amber-600" : "text-muted-foreground",
            )}
          >
            {chars}/{maxLength}
          </span>
        )}
      </div>

      {/* ── Content area ── */}
      <EditorContent
        editor={editor}
        className={cn(
          "px-3 py-2.5 text-sm leading-relaxed",
          "[&_.tiptap]:outline-none",
          // Same prose tokens as RichTextDisplay, scoped under .tiptap
          RICH_TEXT_PROSE_CLASS.replaceAll("[&_", "[&_.tiptap_"),
          // Placeholder
          "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/60 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
        )}
      />
    </div>
  );
}
