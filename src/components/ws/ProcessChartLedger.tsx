/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { SymbolIcon, SYMBOL_META, SymbolType } from './SymbolMeta'
import { EditableCell } from './EditableCell'
import { TABLE_STYLES, STATUS_COLORS } from './table-styles'
import type { ProcessStep } from '@/types/entities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProcessChartLedgerProps {
  steps: ProcessStep[]
  editingId: number | null
  editForm: any
  startEdit: (step: ProcessStep) => void
  commitEdit: () => void
  setEditingId: (id: number | null) => void
  handleRemoveStep: (id: number) => void
  storageWarn: number
  distWarn: number
  copyCSV: () => void
  copiedCsv: boolean
}

export function ProcessChartLedger({
  steps,
  editingId,
  editForm,
  startEdit,
  commitEdit,
  setEditingId,
  handleRemoveStep,
  storageWarn,
  distWarn,
  copyCSV,
  copiedCsv,
}: ProcessChartLedgerProps) {
  const totalMinutes = useMemo(() => steps.reduce((sum, s) => sum + (s.minutes || 0), 0), [steps])
  const totalFeet = useMemo(() => steps.reduce((sum, s) => sum + (s.feet || 0), 0), [steps])

  const columns = useMemo<ColumnDef<ProcessStep>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        accessorFn: (_, index) => index + 1,
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          return (
            <div className={`font-mono text-nd-ink-muted ${isEditing ? 'border-l-nd-accent' : ''}`}>
              {String(row.index + 1).padStart(2, '0')}
            </div>
          )
        },
        size: 50,
        meta: { className: 'text-right' },
      },
      {
        accessorKey: 'symbol',
        header: 'Type',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          const symColor = SYMBOL_META[step.symbol as SymbolType].color
          return (
            <EditableCell
              type="select"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="symbol"
              options={[
                { value: 'operation', label: 'Operation' },
                { value: 'transportation', label: 'Transport' },
                { value: 'storage', label: 'Storage' },
                { value: 'inspection', label: 'Inspection' },
              ]}
              displayValue={
                <div className="flex items-center gap-2">
                  <SymbolIcon type={step.symbol as SymbolType} size={14} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.06em]"
                    style={{ color: symColor }}
                  >
                    {SYMBOL_META[step.symbol as SymbolType].label}
                  </span>
                </div>
              }
            />
          )
        },
        size: 140,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          return (
            <EditableCell
              type="text"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="description"
              autoFocus
              inputClassName="h-7 text-sm rounded-none border-nd-border focus-visible:ring-nd-accent"
              displayValue={
                <div className="flex justify-between items-center">
                  <span className="text-[13px]">{step.description}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveStep(step.id)
                    }}
                    className="text-nd-border hover:text-nd-accent opacity-0 group-hover:opacity-100 transition-opacity ml-2 print:hidden"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              }
            />
          )
        },
      },
      {
        accessorKey: 'who',
        header: 'Who',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          return (
            <EditableCell
              type="text"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="who"
              inputClassName="h-7 text-xs font-mono rounded-none border-nd-border focus-visible:ring-nd-accent"
              displayValue={
                <span className="text-xs font-mono text-nd-ink/80">{step.who || '\u2014'}</span>
              }
            />
          )
        },
        size: 160,
      },
      {
        accessorKey: 'minutes',
        header: 'Wait (m)',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          const warnMin = (step.minutes ?? 0) > storageWarn
          return (
            <EditableCell
              type="number"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="minutes"
              visibleForSymbol="storage"
              inputClassName="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent"
              displayValue={
                step.minutes ? (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 ${warnMin ? `${STATUS_COLORS.storageWarn.bg} ${STATUS_COLORS.storageWarn.text} border ${STATUS_COLORS.storageWarn.border}` : 'text-nd-ink'}`}
                  >
                    {step.minutes}
                    {warnMin && ' \u2691'}
                  </span>
                ) : (
                  <span className="text-[11px] text-nd-ink-muted/50">\u2014</span>
                )
              }
            />
          )
        },
        size: 100,
        meta: { className: 'text-right font-mono' },
      },
      {
        accessorKey: 'feet',
        header: 'Dist (ft)',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          const warnFt = (step.feet ?? 0) > distWarn
          return (
            <EditableCell
              type="number"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="feet"
              visibleForSymbol="transportation"
              inputClassName="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent"
              displayValue={
                step.feet ? (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 ${warnFt ? `${STATUS_COLORS.distanceWarn.bg} ${STATUS_COLORS.distanceWarn.text} border ${STATUS_COLORS.distanceWarn.border}` : 'text-nd-ink'}`}
                  >
                    {step.feet}
                    {warnFt && ' \u2691'}
                  </span>
                ) : (
                  <span className="text-[11px] text-nd-ink-muted/50">\u2014</span>
                )
              }
            />
          )
        },
        size: 100,
        meta: { className: 'text-right font-mono' },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => {
          const step = row.original
          const isEditing = editingId === step.id
          return (
            <EditableCell
              type="text"
              isEditing={isEditing}
              editForm={editForm}
              onCommit={commitEdit}
              onCancel={() => setEditingId(null)}
              fieldName="notes"
              inputClassName="h-7 text-xs font-mono rounded-none border-nd-border focus-visible:ring-nd-accent"
              displayValue={
                step.notes ? (
                  <span
                    className="text-[11px] font-mono text-nd-ink-muted italic"
                    title={step.notes}
                  >
                    {step.notes.length > 50 ? step.notes.slice(0, 50) + '...' : step.notes}
                  </span>
                ) : (
                  <span className="text-[11px] text-nd-ink-muted/30 italic">—</span>
                )
              }
            />
          )
        },
        size: 180,
        meta: { className: 'border-none' },
      },
    ],
    [editingId, storageWarn, distWarn, handleRemoveStep, commitEdit, setEditingId, editForm],
  )

  const table = useReactTable({
    data: steps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="m-0 border-none outline-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1">
            Spreadsheet View
          </div>
          <div className="text-xs font-mono text-nd-ink-muted">
            {steps.length} steps · click a row to edit
          </div>
        </div>
        <Button
          onClick={copyCSV}
          variant="outline"
          size="sm"
          className="font-mono text-[10px] tracking-wider bg-nd-ink text-nd-bg hover:bg-nd-ink/90 hover:text-white rounded-none border-none"
        >
          <Copy className="w-3 h-3 mr-2" />
          {copiedCsv ? 'COPIED' : 'COPY CSV'}
        </Button>
      </div>

      <div className="border-2 border-nd-ink bg-nd-surface shadow-sm ring-1 ring-black/5 rounded-sm overflow-hidden">
        <Table className="w-full border-collapse">
          <TableHeader className="bg-nd-ink">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={TABLE_STYLES.th}
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
            {table.getRowModel().rows.map((row, idx) => {
              const isEditing = editingId === row.original.id
              return (
                <TableRow
                  key={row.id}
                  className={`group border-none ${isEditing ? 'bg-nd-accent/10' : idx % 2 === 0 ? 'bg-nd-surface' : 'bg-nd-bg'} hover:bg-black/5 cursor-pointer`}
                  onClick={() => !isEditing && startEdit(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${TABLE_STYLES.td} ${(cell.column.columnDef.meta as Record<string, string> | undefined)?.className || ''} ${cell.column.id === 'index' ? (isEditing ? 'border-l-2 border-l-nd-accent' : 'border-l-2 border-l-transparent') : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}

            {/* Totals Row */}
            <TableRow className="bg-nd-ink border-t-[3px] border-nd-ink hover:bg-nd-ink">
              <TableCell
                colSpan={4}
                className="p-3 font-mono text-[10px] text-[#8A8880] uppercase tracking-[0.1em]"
              >
                Totals — {steps.length} steps
              </TableCell>
              <TableCell
                className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${totalMinutes > storageWarn ? 'text-[#D4A017]' : 'text-[#F5F0E8]'}`}
              >
                {totalMinutes || '\u2014'}
              </TableCell>
              <TableCell
                className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${totalFeet > distWarn ? 'text-[#6A9AE0]' : 'text-[#F5F0E8]'}`}
              >
                {totalFeet || '\u2014'}
              </TableCell>
              <TableCell className="p-3 border-l border-[#333]" />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
