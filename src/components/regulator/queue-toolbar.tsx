"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const INTEL_PAGE_SIZE = 10;

/** Search only — keep above the table. */
export function QueueSearch({
  query,
  onQuery,
  placeholder,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8"
        />
      </div>
    </div>
  );
}

/** Pagination — keep below the table, same pattern as DataTable. */
export function QueuePagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={safePage <= 0}
          onClick={() => onPage(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPage(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * @deprecated Prefer QueueSearch above the table and QueuePagination below.
 * Kept so any remaining callers still compile during migration.
 */
export function QueueToolbar(props: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  return (
    <>
      <QueueSearch
        query={props.query}
        onQuery={props.onQuery}
        placeholder={props.placeholder}
      />
      <QueuePagination
        total={props.total}
        page={props.page}
        pageSize={props.pageSize}
        onPage={props.onPage}
      />
    </>
  );
}
