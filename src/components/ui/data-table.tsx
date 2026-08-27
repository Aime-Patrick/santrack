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
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  sortFn_alphanumeric,
  filterFn_includesString,
  FlexRender,
} from "@tanstack/react-table";
import {
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

// Shared features object — tree-shaken to only what we use.
const tableFeatures_ = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
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

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TableFeatures, TData>[];
  data: TData[];
  filterPlaceholder?: string;
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
  rowClassName?: (row: ReturnType<ReturnType<typeof useTable<TableFeatures, TData>>['getRowModel']>['rows'][number]) => string;
  /** When set, the whole row is clickable. */
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  filterPlaceholder = "Filter...",
  filterColumn,
  pageSize = 10,
  pageSizeOptions = [10, 15, 25, 50],
  showFilter = true,
  showPagination = true,
  showSelectionCount = true,
  noBorder = false,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
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
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  return (
    <div className="space-y-4">
      {showFilter && filterColumn && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={filterPlaceholder}
            value={
              (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(filterColumn)
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}

      <div className={noBorder ? "overflow-hidden" : "overflow-hidden rounded-md border"}>
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={headerClassName}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
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
