import { createColumnHelper } from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'

// Module augmentation for typed column meta across all tables
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
    headerClassName?: string
    align?: 'left' | 'center' | 'right'
    empId?: number
    empName?: string
    fte?: string
  }
}

// Re-export for convenience
export { createColumnHelper }
