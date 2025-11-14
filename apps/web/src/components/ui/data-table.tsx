"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enablePagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  variant?:
    | "default"
    | "healthcare"
    | "healthcareSuccess"
    | "healthcareWarning"
    | "healthcareError"
    | "healthcareInfo";
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  filters?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchKey,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  enablePagination = true,
  pageSize = 10,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  variant = "default",
  onRowClick,
  emptyMessage = "No results found.",
  filters,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Use server-side search if provided, otherwise use client-side
  const isServerSideSearch = searchValue !== undefined && onSearchChange !== undefined;
  const isServerSidePagination = currentPage !== undefined && totalPages !== undefined && onPageChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination && !isServerSidePagination
      ? getPaginationRowModel()
      : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: !isServerSideSearch ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: isServerSideSearch ? undefined : setGlobalFilter,
    globalFilterFn: !isServerSideSearch ? (row, columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase();
      const rowData = row.original as any;

      // Search across all string fields
      return Object.values(rowData).some((value: any) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchValue);
        }
        if (typeof value === "object" && value !== null) {
          // Handle nested objects (e.g., home.name, home.city)
          return JSON.stringify(value).toLowerCase().includes(searchValue);
        }
        return false;
      });
    } : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: isServerSideSearch ? "" : globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
        pageIndex: isServerSidePagination && currentPage ? currentPage - 1 : 0,
      },
    },
    manualPagination: isServerSidePagination,
    manualFiltering: isServerSideSearch,
    pageCount: isServerSidePagination && totalPages ? totalPages : undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      {(filters || searchKey) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={isServerSideSearch ? (searchValue ?? "") : (globalFilter ?? "")}
              onChange={(event) => {
                if (isServerSideSearch && onSearchChange) {
                  onSearchChange(event.target.value);
                } else {
                  setGlobalFilter(event.target.value);
                }
              }}
              disabled={isLoading}
              className="w-full sm:w-96"
            />
          )}
          {/* Custom Filters */}
          {filters && (
            <div className="flex flex-wrap items-center gap-4 flex-1 justify-end">
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table variant={variant}>
          <TableHeader variant={variant}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} variant={variant}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap",
                        canSort && "cursor-pointer select-none",
                        header.column.getCanResize() && "relative"
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="ml-2">
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} variant={variant}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`}>
                      <Skeleton className="h-4 w-full" variant={variant === "healthcare" ? "healthcare" : "default"} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  variant={variant}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    !row.getIsSelected() && "hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {isServerSidePagination && totalItems !== undefined
              ? `Showing ${data.length} of ${totalItems} row(s)`
              : `${table.getFilteredRowModel().rows.length} of ${table.getCoreRowModel().rows.length} row(s) shown.`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isServerSidePagination && onPageChange && currentPage) {
                  onPageChange(currentPage - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={
                isLoading ||
                (isServerSidePagination
                  ? currentPage === undefined || currentPage <= 1
                  : !table.getCanPreviousPage())
              }
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Page{" "}
                {isServerSidePagination && currentPage
                  ? currentPage
                  : table.getState().pagination.pageIndex + 1}{" "}
                of{" "}
                {isServerSidePagination && totalPages
                  ? totalPages
                  : table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isServerSidePagination && onPageChange && currentPage) {
                  onPageChange(currentPage + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={
                isLoading ||
                (isServerSidePagination
                  ? currentPage === undefined ||
                    totalPages === undefined ||
                    currentPage >= totalPages
                  : !table.getCanNextPage())
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
