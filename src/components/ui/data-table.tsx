"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  Table as TableType,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string | ((row: TData) => string)
  cellClassName?: string
  onRowClick?: (row: TData) => void
  renderFooter?: (table: TableType<TData>) => React.ReactNode
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  cellClassName,
  onRowClick,
  renderFooter,
  enableSorting = false,
  enableFiltering = false,
  enablePagination = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onGlobalFilterChange: setGlobalFilter,
    }),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    state: {
      ...(enableSorting && { sorting }),
      ...(enableFiltering && { globalFilter }),
    },
  })

  return (
    <div className={className}>
      {enableFiltering && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full max-w-sm rounded-none border border-nd-border bg-nd-surface px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-nd-accent"
          />
        </div>
      )}
      <Table className={tableClassName}>
        <TableHeader className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as Record<string, string> | undefined
                return (
                  <TableHead
                    key={header.id}
                    className={meta?.headerClassName}
                    onClick={enableSorting && header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={enableSorting && header.column.getCanSort() ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {enableSorting && header.column.getIsSorted() === 'asc' && ' \u25B2'}
                          {enableSorting && header.column.getIsSorted() === 'desc' && ' \u25BC'}
                        </div>
                      )}
                  </TableHead>
                )
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
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('button, a, input, select, textarea, [role="button"]')) return
                  onRowClick?.(row.original)
                }}
                className={
                  typeof rowClassName === "function"
                    ? rowClassName(row.original)
                    : rowClassName
                }
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as Record<string, string> | undefined
                  return (
                    <TableCell key={cell.id} className={meta?.className || cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {renderFooter && renderFooter(table)}
      </Table>
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-4 px-2">
          <div className="text-xs font-mono text-nd-ink-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-none font-mono text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-none font-mono text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
