"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type RowData,
  useTable,
  tableFeatures,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  sortFn_alphanumeric,
  filterFn_includesString,
  FlexRender,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Shared features object — tree-shaken to only what we use.
const tableFeatures_ = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { text: sortFn_text, alphanumeric: sortFn_alphanumeric },
});

export type TableFeatures = typeof tableFeatures_;

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    /** Pin this column while the table scrolls horizontally. */
    sticky?: "left" | "right";
  }
}

const STICKY_RIGHT =
  "sticky right-0 z-40 isolate min-w-14 bg-white border-l border-border";
const STICKY_RIGHT_HEAD =
  "sticky right-0 z-50 isolate min-w-14 bg-rwanda-blue border-l border-white/20 text-white";
const STICKY_LEFT =
  "sticky left-0 z-40 isolate bg-white border-r border-border";
const STICKY_LEFT_HEAD =
  "sticky left-0 z-50 isolate bg-rwanda-blue border-r border-white/20 text-white";

const HEADER_CELL =
  "bg-rwanda-blue text-white [&_svg]:text-white border-b border-r border-white/20 last:border-r-0";
const BODY_CELL = "border-b border-r border-border last:border-r-0";

function stickySide(
  columnId: string,
  meta: { sticky?: "left" | "right" } | undefined,
  pinActions: boolean,
): "left" | "right" | null {
  if (meta?.sticky === "left" || meta?.sticky === "right") return meta.sticky;
  if (pinActions && columnId === "actions") return "right";
  return null;
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TableFeatures, TData>[];
  data: TData[];
  filterPlaceholder?: string;
  /**
   * When set, filters that single column. Otherwise a global search across
   * all accessor columns is used. Filter UI shows whenever `showFilter` is true.
   */
  filterColumn?: string;
  pageSize?: number;
  /** Choices for the rows-per-page control. Empty = hide the control. */
  pageSizeOptions?: number[];
  showFilter?: boolean;
  showPagination?: boolean;
  /** Hide the “N of M selected” line when selection isn’t used. */
  showSelectionCount?: boolean;
  /** Skip the border wrapper (use when rendered inside a Card, avoiding a double border) */
  noBorder?: boolean;
  /** Extra className on the <table> element */
  tableClassName?: string;
  /** Extra className on each <thead> row */
  headerClassName?: string;
  /** Per-row className callback */
  rowClassName?: (
    row: ReturnType<
      ReturnType<typeof useTable<TableFeatures, TData>>["getRowModel"]
    >["rows"][number],
  ) => string;
  /** When set, the whole row is clickable. */
  onRowClick?: (row: TData) => void;
  /**
   * Keep the `actions` column (or any column with `meta.sticky`) pinned while
   * the table scrolls horizontally. Default true.
   */
  pinActions?: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  filterPlaceholder = "Search…",
  filterColumn,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  showFilter = true,
  showPagination = true,
  showSelectionCount = true,
  noBorder = false,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
  pinActions = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageSize === pageSize ? prev : { pageIndex: 0, pageSize },
    );
  }, [pageSize]);

  const table = useTable<TableFeatures, TData>({
    features: tableFeatures_,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  const filterValue = filterColumn
    ? ((table.getColumn(filterColumn)?.getFilterValue() as string) ?? "")
    : (globalFilter ?? "");

  return (
    <div className="space-y-4">
      {showFilter && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={filterPlaceholder}
            value={filterValue}
            onChange={(event) => {
              const next = event.target.value;
              if (filterColumn) {
                table.getColumn(filterColumn)?.setFilterValue(next);
              } else {
                table.setGlobalFilter(next);
              }
            }}
            className="max-w-sm"
            aria-label={filterPlaceholder}
          />
        </div>
      )}

      <div
        className={
          noBorder ? "overflow-hidden" : "overflow-hidden rounded-md border"
        }
      >
        <Table
          className={cn("border-separate border-spacing-0", tableClassName)}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  "border-b-0 hover:bg-transparent",
                  headerClassName,
                )}
              >
                {headerGroup.headers.map((header) => {
                  const side = stickySide(
                    header.column.id,
                    header.column.columnDef.meta,
                    pinActions,
                  );
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        HEADER_CELL,
                        side === "right" && STICKY_RIGHT_HEAD,
                        side === "left" && STICKY_LEFT_HEAD,
                        side && "bg-clip-padding",
                        canSort && "cursor-pointer select-none",
                      )}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : canSort
                              ? "none"
                              : undefined
                      }
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <span className="inline-flex items-center gap-1.5">
                          <FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5 shrink-0 opacity-90" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5 shrink-0 opacity-90" />
                          ) : (
                            <ArrowUpDown className="size-3.5 shrink-0 opacity-60" />
                          )}
                        </span>
                      ) : (
                        <FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    [
                      "group/row border-b-0",
                      onRowClick ? "cursor-pointer hover:bg-muted/50" : "",
                      rowClassName ? rowClassName(row) : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  onClick={
                    onRowClick
                      ? () => onRowClick(row.original as TData)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const side = stickySide(
                      cell.column.id,
                      cell.column.columnDef.meta,
                      pinActions,
                    );
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          BODY_CELL,
                          side === "right" && STICKY_RIGHT,
                          side === "left" && STICKY_LEFT,
                          side &&
                            "bg-clip-padding group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        )}
                      >
                        <FlexRender cell={cell} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 border-b border-border text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="flex flex-col gap-3 border-t border-border/60 px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {showSelectionCount ? (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </span>
            ) : (
              <span>
                {table.getFilteredRowModel().rows.length} row
                {table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
              </span>
            )}
            {pageSizeOptions.length > 0 ? (
              <label className="inline-flex items-center gap-2">
                <span className="whitespace-nowrap">Rows per page</span>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  value={pagination.pageSize}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPagination({ pageIndex: 0, pageSize: next });
                  }}
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm text-muted-foreground">
              Page {pagination.pageIndex + 1} of{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
