import { SIX_QUESTIONS } from '../shared/six-questions'

export function WdcLegend() {
  return (
    <div className="max-w-3xl bg-nd-surface border border-nd-border shadow-sm">
      <div className="p-8 pb-6 border-b border-nd-border bg-nd-surface-alt">
        <h2 className="text-2xl font-bold font-serif m-0 mb-1 text-nd-ink">The Six Questions</h2>
        <p className="text-xs font-mono text-nd-ink-muted m-0">
          From the original Work Simplification program. Apply to every task and activity on your
          chart.
        </p>
      </div>
      <div className="flex flex-col divide-y divide-nd-border">
        {SIX_QUESTIONS.map(({ q, prompt }) => (
          <div key={q} className="flex flex-col sm:flex-row items-stretch">
            <div className="bg-nd-ink text-nd-accent font-serif font-bold text-xl px-8 py-5 sm:w-32 flex-shrink-0 flex items-center shadow-inner">
              {q}
            </div>
            <div className="p-5 flex-1 bg-nd-surface text-sm font-serif leading-relaxed text-nd-ink/90 flex items-center border-[0.5px] border-l-0 border-nd-border/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              {prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
