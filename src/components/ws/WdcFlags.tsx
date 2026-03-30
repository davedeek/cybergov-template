import { FLAG_SEVERITY_COLORS } from './table-styles'
import type { WdcFlag } from '@/hooks/useWdcFlags'

interface WdcFlagsProps {
  flags: WdcFlag[]
  onNavigateToFlags?: () => void
}

export function WdcFlags({ flags }: WdcFlagsProps) {
  return (
    <div className="max-w-2xl bg-nd-surface p-8 border border-nd-border shadow-sm">
      <h2 className="text-2xl font-bold font-serif m-0 mb-1 text-nd-ink">Analysis Flags</h2>
      <p className="text-xs font-mono text-nd-ink-muted mb-8 pb-4 border-b border-nd-border dashed">
        Automatically raised from chart data. Starting points for inquiry — not verdicts.
      </p>

      {flags.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
          No active flags. Add data to the chart or adjust capacities to see pattern analysis.
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((f, i) => {
            const colors = FLAG_SEVERITY_COLORS[f.severity]
            return (
              <div key={i} className={`p-4 pl-5 border-l-4 border border-nd-border border-r-0 border-t-0 border-b-0 shadow-sm ${colors.bg} ${colors.border}`}>
                <div className={`text-[10px] font-mono uppercase tracking-[0.12em] mb-1.5 font-bold ${colors.text}`}>{f.type}</div>
                <div className="text-sm font-serif mb-2 leading-snug">{f.message}</div>
                <div className="text-xs font-mono text-nd-ink-muted bg-nd-surface/50 p-2 border border-nd-border/50">
                  <span className="text-nd-accent mr-2 font-bold opacity-50">&rarr;</span>
                  {f.guide}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
