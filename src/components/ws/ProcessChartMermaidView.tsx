import { Copy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProcessChartMermaidViewProps {
  mermaidSvg: string | null
  mermaidSrc: string
  copyMermaid: () => void
  stepsCount: number
}

export function ProcessChartMermaidView({
  mermaidSvg, mermaidSrc, copyMermaid, stepsCount
}: ProcessChartMermaidViewProps) {
  return (
    <div className="m-0 border-none outline-none">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1">Process Map</div>
          <div className="text-xs font-mono text-nd-ink-muted">Auto-generated Mermaid notation</div>
        </div>
        <Button onClick={copyMermaid} variant="outline" size="sm" className="font-mono text-[10px] tracking-wider bg-nd-ink text-nd-bg hover:bg-nd-ink/90 hover:text-white rounded-none border-none">
          <Copy className="w-3 h-3 mr-2" />
          COPY SOURCE
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white border-2 border-nd-ink p-8 flex items-center justify-center min-h-[500px] overflow-auto shadow-[4px_4px_0px_0px_rgba(26,26,24,1)]">
          {mermaidSvg ? (
            <div className="w-full h-full flex items-center justify-center p-4 bg-white" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
          ) : (
            <div className="text-center p-12">
              <div className="w-12 h-12 border-4 border-nd-border border-t-nd-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-mono text-xs text-nd-ink-muted uppercase tracking-widest">Generating Diagram...</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="p-4 bg-nd-surface border-2 border-nd-ink rounded-sm">
            <h4 className="text-[10px] font-mono tracking-widest uppercase mb-4 text-nd-ink flex items-center">
              <AlertCircle className="w-3 h-3 mr-2" />
              Notations
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-nd-ink shrink-0" />
                <div className="text-[11px] leading-tight"><span className="font-bold">Rectangle:</span> Operation (action taken)</div>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#EDEAE2] border-nd-border border shrink-0 rounded-full" />
                <div className="text-[11px] leading-tight"><span className="font-bold">Pill:</span> Transport (movement)</div>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#FDFAED] border-[#D4A017] border shrink-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
                <div className="text-[11px] leading-tight"><span className="font-bold">Triangle:</span> Storage (waiting)</div>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#EDF1FB] border-[#2B5EA7] border shrink-0" />
                <div className="text-[11px] leading-tight"><span className="font-bold">Diamond:</span> Inspection (check)</div>
              </div>
            </div>
            
            {stepsCount > 0 && (
              <div className="mt-8 pt-6 border-t border-nd-border">
                <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-nd-ink mb-2">Mermaid Code</div>
                <pre className="text-[9px] font-mono bg-nd-bg p-3 border border-nd-border overflow-x-auto max-h-48 text-nd-ink-muted">
                  {mermaidSrc}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
