import { useMemo } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef 
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SymbolIcon, SYMBOL_META, SymbolType } from './SymbolMeta'
import { FormError } from '@/components/ui/form-error'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProcessChartLedgerProps {
  steps: any[]
  editingId: number | null
  editForm: any
  startEdit: (step: any) => void
  commitEdit: () => void
  setEditingId: (id: number | null) => void
  handleRemoveStep: (id: number) => void
  storageWarn: number
  distWarn: number
  copyCSV: () => void
  copiedCsv: boolean
}

export function ProcessChartLedger({
  steps, editingId, editForm, startEdit, commitEdit, setEditingId,
  handleRemoveStep, storageWarn, distWarn, copyCSV, copiedCsv
}: ProcessChartLedgerProps) {
  const thClass = "bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-[#2E2E2C] whitespace-nowrap align-middle select-none h-auto rounded-none"
  const tdClass = "border-b border-r border-nd-border px-3 py-2 align-middle bg-nd-surface group-hover:bg-black/5 transition-colors cursor-pointer"

  const totalMinutes = useMemo(() => steps.reduce((sum, s) => sum + (s.minutes || 0), 0), [steps])
  const totalFeet = useMemo(() => steps.reduce((sum, s) => sum + (s.feet || 0), 0), [steps])

  const columns = useMemo<ColumnDef<any>[]>(() => [
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
      meta: { className: "text-right" }
    },
    {
      accessorKey: 'symbol',
      header: 'Type',
      cell: ({ row }) => {
        const step = row.original
        const isEditing = editingId === step.id
        if (isEditing) {
          return (
            <editForm.Field
              name="symbol"
              children={(field: any) => (
                <Select value={field.state.value} onValueChange={(v: string) => field.handleChange(v as SymbolType)}>
                  <SelectTrigger className="h-7 text-xs font-mono rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    <SelectItem value="operation">Operation</SelectItem>
                    <SelectItem value="transportation">Transport</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )
        }
        const symColor = SYMBOL_META[step.symbol as SymbolType].color
        return (
          <div className="flex items-center gap-2">
            <SymbolIcon type={step.symbol as SymbolType} size={14} />
            <span className="text-[10px] font-mono uppercase tracking-[0.06em]" style={{ color: symColor }}>
              {SYMBOL_META[step.symbol as SymbolType].label}
            </span>
          </div>
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
        if (isEditing) {
          return (
            <editForm.Field
              name="description"
              children={(field: any) => (
                <>
                  <Input 
                    autoFocus 
                    value={field.state.value} 
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)} 
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                      if (e.key === 'Enter') commitEdit(); 
                      if (e.key === 'Escape') setEditingId(null) 
                    }} 
                    className="h-7 text-sm rounded-none border-nd-border focus-visible:ring-nd-accent" 
                  />
                  <FormError errors={field.state.meta.errors} />
                </>
              )}
            />
          )
        }
        return (
          <div className="flex justify-between items-center">
            <span className="text-[13px]">{step.description}</span>
            <button onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id) }} className="text-nd-border hover:text-nd-accent opacity-0 group-hover:opacity-100 transition-opacity ml-2 print:hidden"><Trash2 className="w-3 h-3" /></button>
          </div>
        )
      },
    },
    {
      accessorKey: 'who',
      header: 'Who',
      cell: ({ row }) => {
        const step = row.original
        const isEditing = editingId === step.id
        if (isEditing) {
          return (
            <editForm.Field
              name="who"
              children={(field: any) => (
                <>
                  <Input 
                    value={field.state.value} 
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)} 
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                      if (e.key === 'Enter') commitEdit(); 
                      if (e.key === 'Escape') setEditingId(null) 
                    }} 
                    className="h-7 text-xs font-mono rounded-none border-nd-border focus-visible:ring-nd-accent" 
                  />
                  <FormError errors={field.state.meta.errors} />
                </>
              )}
            />
          )
        }
        return <span className="text-xs font-mono text-nd-ink/80">{step.who || '—'}</span>
      },
      size: 160,
    },
    {
      accessorKey: 'minutes',
      header: 'Wait (m)',
      cell: ({ row }) => {
        const step = row.original
        const isEditing = editingId === step.id
        if (isEditing) {
          return (
            <editForm.Subscribe
              selector={(stateDetail: any) => stateDetail.values.symbol}
              children={(symbol: string) => (
                symbol === 'storage' ? (
                  <editForm.Field
                    name="minutes"
                    children={(field: any) => (
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={field.state.value} 
                          onBlur={field.handleBlur}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)} 
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                            if (e.key === 'Enter') commitEdit(); 
                            if (e.key === 'Escape') setEditingId(null) 
                          }} 
                          className="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent" 
                        />
                        <div className="absolute right-0 top-full z-20">
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <span className="text-[11px] text-nd-ink-muted/50">—</span>
                )
              )}
            />
          )
        }
        const warnMin = (step.minutes ?? 0) > storageWarn
        return step.minutes ? (
          <span className={`text-[11px] px-1.5 py-0.5 ${warnMin ? 'bg-[#FDFAED] text-[#9A7000] border border-[#D4A017]' : 'text-nd-ink'}`}>
            {step.minutes}{warnMin && ' ⚑'}
          </span>
        ) : (
          <span className="text-[11px] text-nd-ink-muted/50">—</span>
        )
      },
      size: 100,
      meta: { className: "text-right font-mono" }
    },
    {
      accessorKey: 'feet',
      header: 'Dist (ft)',
      cell: ({ row }) => {
        const step = row.original
        const isEditing = editingId === step.id
        if (isEditing) {
          return (
            <editForm.Subscribe
              selector={(stateDetail: any) => stateDetail.values.symbol}
              children={(symbol: string) => (
                symbol === 'transportation' ? (
                  <editForm.Field
                    name="feet"
                    children={(field: any) => (
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={field.state.value} 
                          onBlur={field.handleBlur}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)} 
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                            if (e.key === 'Enter') commitEdit(); 
                            if (e.key === 'Escape') setEditingId(null) 
                          }} 
                          className="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent" 
                        />
                        <div className="absolute right-0 top-full z-20">
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <span className="text-[11px] text-nd-ink-muted/50">—</span>
                )
              )}
            />
          )
        }
        const warnFt = (step.feet ?? 0) > distWarn
        return step.feet ? (
          <span className={`text-[11px] px-1.5 py-0.5 ${warnFt ? 'bg-[#EDF1FB] text-[#2B5EA7] border border-[#2B5EA7]/30' : 'text-nd-ink'}`}>
            {step.feet}{warnFt && ' ⚑'}
          </span>
        ) : (
          <span className="text-[11px] text-nd-ink-muted/50">—</span>
        )
      },
      size: 100,
      meta: { className: "text-right font-mono border-none" }
    }
  ], [editingId, storageWarn, distWarn, handleRemoveStep, commitEdit, setEditingId, editForm])

  const table = useReactTable({
    data: steps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="m-0 border-none outline-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1">Spreadsheet View</div>
          <div className="text-xs font-mono text-nd-ink-muted">{steps.length} steps · click a row to edit</div>
        </div>
        <Button onClick={copyCSV} variant="outline" size="sm" className="font-mono text-[10px] tracking-wider bg-nd-ink text-nd-bg hover:bg-nd-ink/90 hover:text-white rounded-none border-none">
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
                    className={thClass}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                      className={`${tdClass} ${(cell.column.columnDef.meta as any)?.className || ''} ${cell.column.id === 'index' ? (isEditing ? 'border-l-2 border-l-nd-accent' : 'border-l-2 border-l-transparent') : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            
            {/* Totals Row */}
            <TableRow className="bg-nd-ink border-t-[3px] border-nd-ink hover:bg-nd-ink">
              <TableCell colSpan={4} className="p-3 font-mono text-[10px] text-[#8A8880] uppercase tracking-[0.1em]">
                Totals — {steps.length} steps
              </TableCell>
              <TableCell className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${totalMinutes > storageWarn ? 'text-[#D4A017]' : 'text-[#F5F0E8]'}`}>
                {totalMinutes || '—'}
              </TableCell>
              <TableCell className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${totalFeet > distWarn ? 'text-[#6A9AE0]' : 'text-[#F5F0E8]'}`}>
                {totalFeet || '—'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
