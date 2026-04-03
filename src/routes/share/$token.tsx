import { createFileRoute } from '@tanstack/react-router'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Reuse Process Chart shapes mapping
const SYMBOL_META = {
  operation: { label: 'Operation', color: '#1A1A18' },
  transportation: { label: 'Transportation', color: '#5C5A52' },
  storage: { label: 'Storage', color: '#D4A017' },
  inspection: { label: 'Inspection', color: '#2B5EA7' },
} as const

type SymbolType = keyof typeof SYMBOL_META

function SymbolIcon({ type, size = 16, className = "" }: { type: SymbolType, size?: number, className?: string }) {
  const s = size, h = s / 2, strokeW = Math.max(1.5, s * 0.1)
  const color = SYMBOL_META[type].color

  const label = SYMBOL_META[type].label
  if (type === 'operation') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`} role="img" aria-label={label}>
      <title>{label}</title>
      <circle cx={h} cy={h} r={h - strokeW} fill={color} />
    </svg>
  )
  if (type === 'transportation') {
    const sm = s * 0.7
    return (
      <svg width={sm} height={sm} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`} role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx={h} cy={h} r={h - strokeW * 1.2} fill="none" stroke={color} strokeWidth={strokeW * 1.5} />
      </svg>
    )
  }
  if (type === 'storage') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`} role="img" aria-label={label}>
      <title>{label}</title>
      <polygon points={`${h},${strokeW} ${s-strokeW},${s-strokeW} ${strokeW},${s-strokeW}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  )
  if (type === 'inspection') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`} role="img" aria-label={label}>
      <title>{label}</title>
      <rect x={strokeW} y={strokeW} width={s-strokeW*2} height={s-strokeW*2} fill="none" stroke={color} strokeWidth={strokeW} />
    </svg>
  )
  return null
}

function fmtMinutes(m: number | null | undefined) {
  if (!m) return null
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), rem = m % 60
  if (h >= 24) { const d = Math.floor(h/24), rh = h%24; return rh > 0 ? `${d}d ${rh}h` : `${d}d` }
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

export const Route = createFileRoute('/share/$token')({
  component: SharePage,
})

function SharePage() {
  const { token } = Route.useParams()
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery({
    ...trpc.share.getChartData.queryOptions({ token }),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex bg-nd-bg min-h-screen items-center justify-center">
        <div className="text-nd-accent font-mono text-sm tracking-widest uppercase animate-pulse">Loading Chart...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex bg-nd-bg min-h-screen items-center justify-center p-6">
        <div className="bg-nd-surface border-2 border-nd-ink max-w-md w-full p-8 text-center shadow-stamp">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-nd-ink" />
          <h2 className="font-serif text-2xl font-bold mb-2">Unavailable</h2>
          <p className="font-mono text-xs text-nd-ink-muted leading-relaxed uppercase tracking-tight">This share link is invalid or the document has been removed by its owner.</p>
        </div>
      </div>
    )
  }

  // Common Header
  const Header = () => (
    <div className="bg-nd-ink text-nd-bg px-8 py-6 mb-8 print:py-0 print:bg-nd-surface print:text-nd-ink shrink-0 print:mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2">Work Simplification Program</div>
          <h1 className="m-0 text-3xl font-bold tracking-tight font-serif uppercase">{data.chart.name}</h1>
        </div>
        <div className="font-mono text-xs text-nd-bg/60 print:text-nd-ink">
          {data.unitName.toUpperCase()}
        </div>
      </div>
    </div>
  )

  if (data.type === 'process_chart') {
    const steps = data.steps || []
    
    return (
      <div className="min-h-screen bg-nd-bg p-8 print:p-0 print:bg-nd-surface text-nd-ink">
        <div className="max-w-4xl mx-auto">
          <Header />
          <div className="bg-nd-surface border-2 border-nd-ink">
             <Table className="font-sans text-sm">
              <TableHeader className="bg-nd-surface-alt">
                <TableRow className="border-b-2 border-nd-ink hover:bg-transparent">
                  <TableHead className="h-10 px-3 border-r border-nd-border w-12 text-center text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">No.</TableHead>
                  <TableHead className="h-10 px-3 border-r border-nd-border w-40 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Symbol</TableHead>
                  <TableHead className="h-10 px-3 border-r border-nd-border text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Description</TableHead>
                  <TableHead className="h-10 px-3 border-r border-nd-border w-40 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Role / Person</TableHead>
                  <TableHead className="h-10 px-3 w-40 text-right text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Metrics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((step: any, idx: number) => (
                  <TableRow key={step.id} className="border-b border-nd-border last:border-b-0 hover:bg-nd-surface-alt transition-colors">
                    <TableCell className="p-3 border-r border-nd-border text-center font-mono text-xs text-nd-ink-muted">{idx + 1}</TableCell>
                    <TableCell className="p-3 border-r border-nd-border">
                      <div className="flex items-center gap-2">
                        <SymbolIcon type={step.symbol as SymbolType} size={14} />
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold">{SYMBOL_META[step.symbol as SymbolType].label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 border-r border-nd-border leading-snug font-serif">{step.description}</TableCell>
                    <TableCell className="p-3 border-r border-nd-border font-mono text-xs text-nd-ink-muted uppercase">{step.who || '—'}</TableCell>
                    <TableCell className="p-3 text-right font-mono text-xs text-nd-ink-muted">
                      {step.minutes ? <span className="mr-2">⏱ {fmtMinutes(step.minutes)}</span> : ''}
                      {step.feet ? <span>⟷ {step.feet}ft</span> : ''}
                      {!step.minutes && !step.feet ? '—' : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
             </Table>
          </div>
          <div className="mt-8 text-[10px] font-mono text-nd-ink-muted text-center print:hidden uppercase tracking-widest">
            Print Command: <kbd className="bg-nd-surface px-1 border border-nd-border">CMD/CTRL + P</kbd> · Orientation: Portrait
          </div>
        </div>
      </div>
    )
  }

  // WDC Chart
  const employees = data.employees || []
  const activities = data.activities || []
  const tasks = data.tasks || []

  return (
    <div className="min-h-screen bg-nd-bg p-8 print:p-0 print:bg-nd-surface text-nd-ink">
      <div className="max-w-[90vw] mx-auto print:max-w-full">
        <Header />
        <div className="bg-nd-surface border-2 border-nd-ink overflow-x-auto text-sm shadow-stamp">
          <Table className="w-full border-collapse font-sans">
            <TableHeader className="bg-nd-surface-alt">
              <TableRow className="border-b-2 border-nd-ink hover:bg-transparent">
                <TableHead className="p-3 h-auto w-48 border-r border-nd-border text-left font-mono text-[10px] uppercase tracking-widest text-nd-ink-muted">Activities</TableHead>
                {employees.map((emp: any) => (
                  <th key={emp.id} className="p-3 min-w-[200px] border-r border-nd-border text-center font-normal">
                    <div className="font-bold font-serif text-sm uppercase tracking-tight">{emp.name}</div>
                    <div className="font-mono text-[9px] text-nd-ink-muted uppercase mt-1 tracking-widest">
                      {emp.role || 'Team Member'} · {emp.fte} FTE
                    </div>
                  </th>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((act: any) => (
                <TableRow key={act.id} className="border-b border-nd-border hover:bg-nd-surface-alt transition-colors group">
                  <TableCell className="p-4 border-r border-nd-border font-serif font-bold bg-nd-surface-alt/50 group-hover:bg-transparent uppercase tracking-tight">
                    {act.name}
                  </TableCell>
                  {employees.map((emp: any) => {
                    const cellTasks = tasks.filter((t: any) => t.activityId === act.id && t.employeeId === emp.id)
                    return (
                      <TableCell key={emp.id} className="p-3 border-r border-nd-border align-top">
                        {cellTasks.length > 0 ? (
                          <div className="space-y-2">
                            {cellTasks.map((t: any) => (
                              <div key={t.id} className="flex justify-between items-start text-xs leading-snug bg-nd-bg p-2 border border-nd-border shadow-sm">
                                <span className="mr-2 font-serif">{t.taskName}</span>
                                <span className="font-mono text-nd-ink-muted shrink-0 bg-nd-surface px-1 border border-nd-border text-[10px]">{t.hoursPerWeek}h</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-8 text-[10px] font-mono text-nd-ink-muted text-center print:hidden uppercase tracking-widest">
          Print Command: <kbd className="bg-nd-surface px-1 border border-nd-border">CMD/CTRL + P</kbd> · Orientation: Landscape
        </div>
      </div>
    </div>
  )
}

