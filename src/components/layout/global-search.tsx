"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { useGlobalSearch, type SearchHit } from "@/hooks/search";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { navigationSearchPages, type SearchPage } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ListItem =
  | (SearchPage & { group: "Pages"; type: "page" })
  | (SearchHit & { group: string });

const PAGES = navigationSearchPages();

const TYPE_GROUP: Record<SearchHit["type"], string> = {
  product: "Products",
  category: "Categories",
  batch: "Lots",
  customer: "Customers",
  item: "Identities",
  organization: "Industries",
  user: "Users",
};

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function matchesPage(page: SearchPage, query: string) {
  const haystack = [page.title, ...(page.searchKeywords ?? [])].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const hasOrganization = !!me?.organization;
  const isTradingOrg = hasOrganization && me?.organization?.type !== "REGULATOR";
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounced = useDebounced(query, 250);
  const { data, isFetching } = useGlobalSearch(debounced, open);

  const pageHits = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allowed = PAGES.filter((page) => {
      if (permissions.loading) return false;
      if (page.requiresOrganization && !hasOrganization) return false;
      if (page.requiresTradingOrg && !isTradingOrg) return false;
      if (page.requires && !permissions.canAll(page.requires)) return false;
      if (page.requiresAny && !permissions.canAny(page.requiresAny)) return false;
      return true;
    });
    const featuredPages = allowed.filter((page) => page.featured);
    const pages = normalizedQuery
      ? allowed.filter((page) => matchesPage(page, normalizedQuery))
      : featuredPages.length > 0
        ? featuredPages
        : allowed.slice(0, 6);

    return pages.map(
      (page): ListItem => ({ ...page, type: "page", group: "Pages" }),
    );
  }, [hasOrganization, isTradingOrg, permissions, query]);

  const remoteHits = React.useMemo((): ListItem[] => {
    if (!data?.results?.length) return [];
    return data.results.map((hit) => ({
      ...hit,
      group: TYPE_GROUP[hit.type] ?? "Results",
    }));
  }, [data]);

  const items = React.useMemo(() => [...pageHits, ...remoteHits], [pageHits, remoteHits]);
  const groups = React.useMemo(() => {
    const grouped = new Map<string, ListItem[]>();
    for (const item of items) {
      const current = grouped.get(item.group) ?? [];
      current.push(item);
      grouped.set(item.group, current);
    }
    return [...grouped.entries()];
  }, [items]);

  React.useEffect(() => setActiveIndex(0), [query, data?.results]);
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const go = React.useCallback((item: ListItem) => {
    onOpenChange(false);
    router.push(item.href);
  }, [onOpenChange, router]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(items.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    }
  };

  let flatIndex = -1;
  const placeholder = hasOrganization
    ? "Search workspaces, products, lots…"
    : "Search industries, users, workspaces…";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={cn("top-[18%] w-[calc(100%-2rem)] max-w-lg translate-y-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-white p-0 shadow-2xl")}>
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <div className="border-b border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            {isFetching && <span className="text-[10px] text-muted-foreground">…</span>}
          </div>
        </div>

        <div className="max-h-[min(52vh,420px)] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query.trim().length < 2 ? "Type to find a workspace, product, lot, or user" : "No matches"}
            </p>
          ) : (
            groups.map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{group}</p>
                <ul className="space-y-0.5">
                  {groupItems.map((item) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    return (
                      <li key={`${item.group}-${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(item)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                            index === activeIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70",
                          )}
                        >
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                          {"subtitle" in item && item.subtitle ? (
                            <span className="shrink-0 truncate font-mono text-[10px] text-muted-foreground">{item.subtitle}</span>
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
          <kbd className="inline-flex size-5 items-center justify-center rounded border border-border/80 bg-muted/60 font-sans text-[10px]"><CornerDownLeft className="size-3" /></kbd>
          <span>Go to page</span>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

/** Cmd/Ctrl+K listener and open state for the dashboard chrome. */
export function useGlobalSearchHotkey() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
