import { createFileRoute } from '@tanstack/react-router'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

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

  if (type === 'operation') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
      <circle cx={h} cy={h} r={h - strokeW} fill={color} />
    </svg>
  )
  if (type === 'transportation') {
    const sm = s * 0.7
    return (
      <svg width={sm} height={sm} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <circle cx={h} cy={h} r={h - strokeW * 1.2} fill="none" stroke={color} strokeWidth={strokeW * 1.5} />
      </svg>
    )
  }
  if (type === 'storage') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
      <polygon points={`${h},${strokeW} ${s-strokeW},${s-strokeW} ${strokeW},${s-strokeW}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  )
  if (type === 'inspection') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
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
        <div className="bg-nd-surface border-2 border-nd-ink max-w-md w-full p-8 text-center shadow-[4px_4px_0px_#1A1A18]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-nd-ink" />
          <h2 className="font-serif text-2xl font-bold mb-2">Unavailable</h2>
          <p className="font-mono text-xs text-[#5C5A52] leading-relaxed">This share link is invalid or the document has been removed by its owner.</p>
        </div>
      </div>
    )
  }

  // Common Header
  const Header = () => (
    <div className="bg-nd-ink text-nd-bg px-8 py-6 mb-8 print:py-0 print:bg-nd-surface print:text-black shrink-0 print:mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2">Work Simplification Program</div>
          <h1 className="m-0 text-3xl font-bold tracking-tight">{data.chart.name}</h1>
        </div>
        <div className="font-mono text-xs text-nd-bg/60 print:text-black">
          {data.unitName}
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
             <table className="w-full text-left font-serif text-sm">
              <thead className="bg-[#EDEAE2]">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-[#5C5A52]">
                  <th className="p-3 border-b-2 border-r border-[#C8C3B4] w-12 text-center">No.</th>
                  <th className="p-3 border-b-2 border-r border-[#C8C3B4] w-32">Symbol</th>
                  <th className="p-3 border-b-2 border-r border-[#C8C3B4]">Description</th>
                  <th className="p-3 border-b-2 border-r border-[#C8C3B4] w-32">Role / Person</th>
                  <th className="p-3 border-b-2 border-[#C8C3B4] w-32 text-right">Metrics</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step: any, idx: number) => (
                  <tr key={step.id} className="border-b border-[#E8E4DC] last:border-b-0">
                    <td className="p-3 border-r border-[#E8E4DC] text-center font-mono text-xs text-[#8A8880]">{idx + 1}</td>
                    <td className="p-3 border-r border-[#E8E4DC]">
                      <div className="flex items-center gap-2">
                        <SymbolIcon type={step.symbol as SymbolType} size={14} />
                        <span className="font-mono text-[9px] uppercase tracking-widest">{SYMBOL_META[step.symbol as SymbolType].label}</span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-[#E8E4DC] leading-snug">{step.description}</td>
                    <td className="p-3 border-r border-[#E8E4DC] font-mono text-xs text-[#5C5A52]">{step.who || '—'}</td>
                    <td className="p-3 text-right font-mono text-xs text-[#5C5A52]">
                      {step.minutes ? `⏱ ${fmtMinutes(step.minutes)}` : ''}
                      {step.feet ? `⟷ ${step.feet}ft` : ''}
                      {!step.minutes && !step.feet ? '—' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>
          <div className="mt-4 text-[10px] font-mono text-nd-ink text-center print:hidden">
            Press CMD/CTRL + P to print or save as PDF.
          </div>
        </div>
      </div>
    )
  }

  // WDC Chart
  const employees = data.employees || []
  const activities = data.activities || []
  const tasks = data.tasks || []

  // Pre-calculate FTEs and capacity
  const eFtes: Record<number, number> = {}
  employees.forEach(e => eFtes[e.id] = parseFloat(e.fte || '1.0'))

  return (
    <div className="min-h-screen bg-nd-bg p-8 print:p-0 print:bg-nd-surface text-nd-ink">
      <div className="max-w-[90vw] mx-auto print:max-w-full">
        <Header />
        <div className="bg-nd-surface border-2 border-nd-ink overflow-x-auto text-sm">
          <table className="w-full border-collapse">
            <thead className="bg-[#EDEAE2]">
              <tr className="border-b-2 border-[#C8C3B4]">
                <th className="p-3 w-48 border-r border-[#C8C3B4] text-left font-mono text-[10px] uppercase tracking-wider text-[#5C5A52]">Activities</th>
                {employees.map((emp: any) => (
                  <th key={emp.id} className="p-3 min-w-[200px] border-r border-[#C8C3B4] text-center">
                    <div className="font-bold font-serif text-sm">{emp.name}</div>
                    <div className="font-mono text-[9px] text-[#5C5A52] uppercase mt-1">
                      {emp.role || 'Team Member'} · {emp.fte} FTE
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((act: any) => (
                <tr key={act.id} className="border-b border-[#E8E4DC]">
                  <td className="p-3 border-r border-[#E8E4DC] font-serif font-bold bg-[#FAFAF7]">
                    {act.name}
                  </td>
                  {employees.map((emp: any) => {
                    const cellTasks = tasks.filter((t: any) => t.activityId === act.id && t.employeeId === emp.id)
                    return (
                      <td key={emp.id} className="p-2 border-r border-[#E8E4DC] align-top">
                        {cellTasks.length > 0 ? (
                          <div className="space-y-1">
                            {cellTasks.map((t: any) => (
                              <div key={t.id} className="flex justify-between items-start text-xs leading-snug bg-[#F5F5F5] p-1.5 border border-[#E0E0E0]">
                                <span className="mr-2">{t.taskName}</span>
                                <span className="font-mono text-[#8A8880] shrink-0">{t.hoursPerWeek}h</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-4"></div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-[10px] font-mono text-nd-ink text-center print:hidden">
          Press CMD/CTRL + P to print or save as PDF. Landscape orientation recommended for WDCs.
        </div>
      </div>
    </div>
  )
}
