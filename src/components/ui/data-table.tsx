"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={className}>
      <Table className={tableClassName}>
        <TableHeader className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                onClick={() => onRowClick?.(row.original)}
                className={
                  typeof rowClassName === "function"
                    ? rowClassName(row.original)
                    : rowClassName
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cellClassName}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
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
    </div>
  )
}
