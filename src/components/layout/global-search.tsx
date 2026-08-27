"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { useGlobalSearch, type SearchHit } from "@/hooks/search";
import { cn } from "@/lib/utils";

type PageItem = {
  type: "page";
  id: string;
  title: string;
  href: string;
};

type ListItem =
  | (PageItem & { group: "Pages" })
  | (SearchHit & { group: string });

const PAGES: PageItem[] = [
  { type: "page", id: "dashboard", title: "Home", href: "/dashboard" },
  { type: "page", id: "products", title: "Products", href: "/dashboard/products" },
  {
    type: "page",
    id: "categories",
    title: "Categories",
    href: "/dashboard/products/categories",
  },
  {
    type: "page",
    id: "production",
    title: "Production",
    href: "/dashboard/manufacturing/production",
  },
  {
    type: "page",
    id: "quality",
    title: "Quality Control",
    href: "/dashboard/manufacturing/quality",
  },
  {
    type: "page",
    id: "inventory",
    title: "Inventory",
    href: "/dashboard/inventory",
  },
  { type: "page", id: "sales", title: "Sales", href: "/dashboard/sales" },
  {
    type: "page",
    id: "customers",
    title: "Customers",
    href: "/dashboard/sales/customers",
  },
  {
    type: "page",
    id: "trace",
    title: "Trace & Act",
    href: "/dashboard/manufacturing/trace",
  },
  { type: "page", id: "recall", title: "Recalls", href: "/dashboard/recall" },
  {
    type: "page",
    id: "licenses",
    title: "Licenses & Permits",
    href: "/dashboard/licenses",
  },
  {
    type: "page",
    id: "settings",
    title: "Settings",
    href: "/dashboard/settings",
  },
];

const TYPE_GROUP: Record<SearchHit["type"], string> = {
  product: "Products",
  category: "Categories",
  batch: "Lots",
  customer: "Customers",
  item: "Identities",
};

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounced = useDebounced(query, 250);

  const { data, isFetching } = useGlobalSearch(debounced, open);

  const pageHits = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = !q
      ? PAGES
      : PAGES.filter((p) => p.title.toLowerCase().includes(q));
    return pages.map(
      (p): ListItem => ({
        ...p,
        group: "Pages",
      }),
    );
  }, [query]);

  const remoteHits = React.useMemo((): ListItem[] => {
    if (!data?.results?.length) return [];
    return data.results.map((hit) => ({
      ...hit,
      group: TYPE_GROUP[hit.type],
    }));
  }, [data]);

  const items = React.useMemo(
    () => [...pageHits, ...remoteHits],
    [pageHits, remoteHits],
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [items]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, data?.results]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = React.useCallback(
    (item: ListItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    }
  };

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className={cn(
          "top-[18%] translate-y-0 p-0 gap-0 overflow-hidden",
          "max-w-lg w-[calc(100%-2rem)] rounded-2xl border border-border/80",
          "bg-white shadow-2xl",
        )}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>

        <div className="border-b border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search products, lots, pages…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            {isFetching ? (
              <span className="text-[10px] text-muted-foreground">…</span>
            ) : null}
          </div>
        </div>

        <div className="max-h-[min(52vh,420px)] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query.trim().length < 2
                ? "Type to search, or pick a page below"
                : "No matches"}
            </p>
          ) : (
            groups.map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {groupItems.map((item) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    return (
                      <li key={`${item.group}-${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(item)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-muted text-foreground"
                              : "text-foreground hover:bg-muted/70",
                          )}
                        >
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {item.title}
                          </span>
                          {"subtitle" in item && item.subtitle ? (
                            <span className="shrink-0 truncate font-mono text-[10px] text-muted-foreground">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
          <kbd className="inline-flex size-5 items-center justify-center rounded border border-border/80 bg-muted/60 font-sans text-[10px]">
            <CornerDownLeft className="size-3" />
          </kbd>
          <span>Go to Page</span>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

/** Cmd/Ctrl+K listener + open state for the dashboard chrome. */
export function useGlobalSearchHotkey() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
