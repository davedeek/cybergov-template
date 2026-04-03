import { useMemo } from 'react'
import { Flag } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WdcChart, WdcEmployee, WdcActivity, WdcTask } from '@/types/entities'
import { TABLE_STYLES } from '../shared/table-styles'

interface WdcDataTableProps {
  activities: WdcActivity[]
  employees: WdcEmployee[]
  getCellTasks: (actId: number, empId: number) => WdcTask[]
  activeCell: { actId: number; empId: number } | null
  setActiveCell: (cell: { actId: number; empId: number } | null) => void
  handleRemoveTask: (taskId: number) => Promise<void>
  actTotals: Record<number, number>
  empTotals: Record<number, number>
  chart: WdcChart
}

export function WdcDataTable({
  activities,
  employees,
  getCellTasks,
  activeCell,
  setActiveCell,
  handleRemoveTask,
  actTotals,
  empTotals,
  chart,
}: WdcDataTableProps) {
  const columns = useMemo<ColumnDef<WdcActivity>[]>(() => {
    const cols: ColumnDef<WdcActivity>[] = [
      {
        accessorKey: 'name',
        header: 'Activity / Task',
        cell: ({ row }) => <div className={`${TABLE_STYLES.tdWdc} ${TABLE_STYLES.actLabel}`}>{row.original.name}</div>,
        size: 160,
      },
    ]

    employees.forEach((emp) => {
      cols.push({
        id: `emp-${emp.id}`,
        header: () => (
          <div className="flex flex-col">
            <div className="text-[13px]">{emp.name}</div>
            {emp.role && <div className="font-sans font-normal opacity-70 text-[10px] mt-0.5 normal-case tracking-normal">{emp.role}</div>}
            <div className="font-mono font-normal opacity-50 text-[10px] mt-0.5 normal-case tracking-normal text-nd-accent-light">FTE: {emp.fte}</div>
          </div>
        ),
        cell: ({ row }) => {
          const act = row.original
          const cellTasks = getCellTasks(act.id, emp.id)
          const hrs = cellTasks.reduce((s, t) => s + t.hoursPerWeek, 0)

          return (
            <div className="flex flex-col h-full min-h-[60px]">
              <div className="flex-1 space-y-1 mb-2">
                {cellTasks.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-2 py-1 border-b border-nd-border border-dotted group/task">
                    <span className="text-xs flex-1 leading-snug font-serif text-nd-ink/90">{t.taskName}</span>
                    <span className="font-mono text-[10px] text-nd-ink-muted whitespace-nowrap mt-0.5">{t.hoursPerWeek}h</span>
                    <button onClick={() => handleRemoveTask(t.id)} className="opacity-0 group-hover/task:opacity-100 text-nd-border hover:text-nd-accent transition-all shrink-0 -mt-0.5 ml-1 leading-none print:hidden" aria-label={`Remove task ${t.taskName}`}>×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveCell({ actId: act.id, empId: emp.id })}
                className="w-full text-left font-mono text-[10px] text-nd-border border border-dashed border-nd-border hover:border-nd-accent hover:text-nd-accent px-2 py-1 transition-colors mt-auto bg-nd-surface/30 print:hidden"
                aria-label={`Add task for ${emp.name} in ${act.name}`}
              >
                {cellTasks.length === 0 ? '+ add task' : `+ add · ${hrs}h ttl`}
              </button>
              <div className="hidden print:block font-mono text-[10px] text-right text-nd-ink-muted mt-auto pt-1">{hrs > 0 ? `${hrs}h` : ''}</div>
            </div>
          )
        },
        meta: {
          empId: emp.id,
          empName: emp.name,
          fte: emp.fte
        }
      } as ColumnDef<WdcActivity>)
    })

    cols.push({
      id: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div className="text-right font-mono text-xs text-nd-ink align-bottom pb-3 leading-snug">
          {actTotals[row.original.id] || 0}h
        </div>
      ),
      size: 70,
      meta: { className: "bg-nd-surface-alt border-l-2 border-l-nd-bg" }
    })

    return cols
  }, [activities, employees, getCellTasks, activeCell, setActiveCell, handleRemoveTask, actTotals])

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto border-2 border-nd-ink bg-nd-surface shadow-sm ring-1 ring-black/5 rounded-sm">
      <Table className="w-full border-collapse">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={TABLE_STYLES.thAlignTop}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group/row hover:bg-transparent border-none">
              {row.getVisibleCells().map((cell) => {
                const isActive = cell.column.id.startsWith('emp-') && activeCell?.actId === row.original.id && activeCell?.empId === (cell.column.columnDef.meta as any)?.empId

                return (
                  <TableCell
                    key={cell.id}
                    className={`${TABLE_STYLES.tdWdc} relative ${isActive ? 'ring-2 ring-inset ring-nd-accent z-10' : 'group-hover/row:bg-black/5'} ${(cell.column.columnDef.meta as any)?.className || ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}

          {/* Column Totals (Footer) */}
          <TableRow className="border-t-[3px] border-nd-ink hover:bg-transparent">
            <TableCell className="bg-nd-ink text-nd-bg font-mono text-xs tracking-widest p-3 text-left">HRS / WEEK</TableCell>
            {employees.map(e => {
              const threshold = chart.hoursThreshold * parseFloat(e.fte || '1')
              const over = empTotals[e.id] > threshold
              return (
                <TableCell key={e.id} className={`font-mono text-sm p-3 text-left border-r border-nd-surface-dark font-semibold tracking-tight ${over ? 'bg-nd-accent/10 text-nd-accent' : 'bg-nd-ink text-nd-bg'}`}>
                  {empTotals[e.id] || 0}h {over ? <Flag className="inline w-3 h-3 ml-1 mb-0.5 text-nd-accent fill-current" /> : ''}
                </TableCell>
              )
            })}
            <TableCell className="bg-nd-ink text-nd-accent-light font-mono text-sm p-3 text-right font-bold tracking-tight border-l-nd-bg border-l-2">
              {Object.values(empTotals).reduce((a, b) => a + b, 0)}h
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
