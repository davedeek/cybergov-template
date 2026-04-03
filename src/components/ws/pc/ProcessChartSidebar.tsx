import { Info, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SymbolIcon, SYMBOL_META, SymbolType, fmtMinutes } from './SymbolMeta'

interface ProcessChartSidebarProps {
  chart: any
  steps: any[]
  storageWarn: number
  distWarn: number
}

export function ProcessChartSidebar({ chart, steps, storageWarn, distWarn }: ProcessChartSidebarProps) {
  const stats = steps.reduce((acc, s) => {
    acc[s.symbol as SymbolType] = (acc[s.symbol as SymbolType] || 0) + 1
    acc.totalMinutes += (s.minutes || 0)
    acc.totalFeet += (s.feet || 0)
    return acc
  }, { operation: 0, transportation: 0, storage: 0, inspection: 0, totalMinutes: 0, totalFeet: 0 })

  const warnings = steps.filter(s => (s.minutes ?? 0) > storageWarn || (s.feet ?? 0) > distWarn)

  return (
    <div className="space-y-6">
      <Card className="border-2 border-nd-ink shadow-none">
        <CardContent className="p-5">
          <h3 className="text-[10px] font-mono tracking-widest uppercase mb-4 text-nd-ink flex items-center">
            <Info className="w-3 h-3 mr-2 text-nd-accent" />
            Meta Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono text-nd-ink-muted uppercase mb-1">Process Started At</div>
              <div className="text-xs font-bold">{chart.startPoint || 'Not defined'}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-nd-ink-muted uppercase mb-1">Process Ends At</div>
              <div className="text-xs font-bold">{chart.endPoint || 'Not defined'}</div>
            </div>
            <div className="pt-2 border-t border-nd-border">
              <div className="text-[10px] font-mono text-nd-ink-muted uppercase mb-1">Charted Date</div>
              <div className="text-xs font-mono">{new Date(chart.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-nd-ink bg-nd-surface shadow-none">
        <CardContent className="p-5">
          <h3 className="text-[10px] font-mono tracking-widest uppercase mb-4 text-nd-ink flex items-center">
            <HelpCircle className="w-3 h-3 mr-2 text-nd-accent" />
            Analysis Overview
          </h3>
          <div className="space-y-3">
            {(Object.keys(SYMBOL_META) as SymbolType[]).map(type => (
              <div key={type} className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <SymbolIcon type={type} size={14} />
                  <span className="text-[11px] font-mono text-nd-ink-muted group-hover:text-nd-ink transition-colors">{SYMBOL_META[type].label}</span>
                </div>
                <div className="font-mono text-xs font-bold">{stats[type]}</div>
              </div>
            ))}
            
            <div className="pt-4 border-t-2 border-nd-ink space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-mono uppercase text-nd-ink-muted">Total Wait Time</span>
                <span className={`font-mono text-sm font-bold ${stats.totalMinutes > storageWarn ? 'text-nd-accent' : ''}`}>
                  {fmtMinutes(stats.totalMinutes) || '—'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-mono uppercase text-nd-ink-muted">Total Distance</span>
                <span className={`font-mono text-sm font-bold ${stats.totalFeet > distWarn ? 'text-nd-accent' : ''}`}>
                  {stats.totalFeet > 0 ? `${stats.totalFeet} ft` : '—'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Card className="border-2 border-nd-accent/30 bg-white shadow-none">
          <CardContent className="p-5">
            <h3 className="text-[10px] font-mono tracking-widest uppercase mb-3 text-nd-accent flex items-center">
              ⚑ Critical Findings
            </h3>
            <div className="space-y-4">
              {warnings.map(s => (
                <div key={s.id} className="text-[11px] leading-snug p-2 bg-nd-bg/50 border-l-2 border-nd-accent">
                  <div className="font-bold mb-0.5">{s.description}</div>
                  <div className="text-nd-ink-muted opacity-80">
                    {s.minutes > storageWarn ? `Excessive wait: ${s.minutes}m` : `Long transport: ${s.feet}ft`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
