"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectItem {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  items: SearchableSelectItem[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  allowClear?: boolean;
}

export function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = "Select an option…",
  searchPlaceholder = "Search…",
  disabled = false,
  className,
  triggerClassName,
  emptyMessage = "No matching items found.",
  allowClear = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});

  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedItem = React.useMemo(
    () => items.find((i) => i.value === value),
    [items, value],
  );

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)),
    );
  }, [items, search]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reset highlight index on search change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const updatePopupPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const maxHeight = 288; // max-h-72
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUpward = spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;

    setPopupStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 70,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + gap, maxHeight: Math.min(maxHeight, spaceAbove) }
        : { top: rect.bottom + gap, maxHeight: Math.min(maxHeight, Math.max(spaceBelow, 120)) }),
    });
  }, []);

  // Position popup when opened; keep it aligned on scroll/resize
  React.useEffect(() => {
    if (!open) return;

    setSearch("");
    updatePopupPosition();
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    window.addEventListener("resize", updatePopupPosition);
    // Capture scroll from nested overflow containers too
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [open, updatePopupPosition]);

  // Click outside listener (trigger + portaled popup)
  React.useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popupRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev,
      );
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredItems[highlightedIndex];
      if (target) {
        onValueChange(target.value);
        setOpen(false);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const child = list.children[index] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ block: "nearest" });
    }
  };

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
  };

  const popup = open && mounted && (
    <div
      ref={popupRef}
      style={popupStyle}
      className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100"
      onKeyDown={handleKeyDown}
    >
      {/* Search Header */}
      <div className="flex items-center border-b border-border/80 px-3 py-2 bg-muted/20">
        <Search className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Results List */}
      <div
        ref={listRef}
        className="overflow-y-auto p-1 text-xs space-y-0.5 scroll-py-1"
        style={{ maxHeight: "calc(100% - 2.5rem)" }}
      >
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected = item.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <div
                key={item.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors text-left select-none",
                  isHighlighted && "bg-muted text-foreground",
                  isSelected && "bg-primary-light text-primary font-semibold",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon && (
                    <span className="shrink-0 text-muted-foreground">
                      {item.icon}
                    </span>
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded border bg-muted/60 px-1 py-0.2 text-[9px] font-mono text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.sublabel && (
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-primary stroke-[2.5]" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-2xs transition-all outline-none select-none",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary ring-2 ring-primary/20",
          triggerClassName,
        )}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {selectedItem?.icon && (
            <span className="shrink-0 text-muted-foreground">
              {selectedItem.icon}
            </span>
          )}
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-foreground truncate">
                {selectedItem.label}
              </span>
              {selectedItem.badge && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {selectedItem.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {allowClear && selectedItem && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180 text-primary",
            )}
          />
        </div>
      </button>

      {mounted && createPortal(popup, document.body)}
    </div>
  );
}
