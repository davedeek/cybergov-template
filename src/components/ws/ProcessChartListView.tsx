import React from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SymbolIcon, SYMBOL_META, SymbolType, fmtMinutes } from './SymbolMeta'

interface ProcessChartListViewProps {
  steps: any[]
  dragId: number | null
  setDragId: (id: number | null) => void
  dropIdx: number | null
  setDropIdx: (idx: number | null) => void
  handleReorder: (from: number, to: number) => void
  handleRemoveStep: (id: number) => void
  storageWarn: number
  distWarn: number
  endPoint?: string | null
}

export function ProcessChartListView({
  steps, dragId, setDragId, dropIdx, setDropIdx, handleReorder, handleRemoveStep,
  storageWarn, distWarn, endPoint
}: ProcessChartListViewProps) {
  const onDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-9999px;opacity:0;'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const onDropZone = async (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragId === null) return
    const fromIdx = steps.findIndex(s => s.id === dragId)
    if (fromIdx === -1) return
    const toIdx = idx > fromIdx ? idx - 1 : idx
    if (toIdx !== fromIdx) {
      await handleReorder(fromIdx, toIdx)
    }
    setDragId(null)
    setDropIdx(null)
  }

  return (
    <div className="m-0 border-none outline-none">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1">Process Flow View</div>
          <div className="text-xs font-mono text-nd-ink-muted">Drag cards to reorder steps</div>
        </div>
      </div>

      <div className="space-y-0 relative">
        {steps.map((step, idx) => {
          const isDragging = dragId === step.id
          return (
            <div key={step.id}>
              {/* Drop zone above */}
              <div
                className={`h-2 mx-12 transition-all ${dropIdx === idx && dragId && dragId !== step.id ? 'h-12 bg-nd-accent/10 border-2 border-dashed border-nd-accent my-2 flex items-center justify-center text-[10px] font-mono text-nd-accent tracking-widest' : ''}`}
                onDragOver={e => { e.preventDefault(); setDropIdx(idx) }}
                onDragLeave={() => setDropIdx(null)}
                onDrop={e => onDropZone(e, idx)}
              >
                {dropIdx === idx && dragId && dragId !== step.id ? 'DROP HERE' : null}
              </div>

              <div 
                className={`flex items-stretch group/item ${isDragging ? 'opacity-30' : ''}`}
                draggable
                onDragStart={e => onDragStart(e, step.id)}
                onDragEnd={() => { setDragId(null); setDropIdx(null) }}
              >
                {/* Connector line */}
                <div className="w-12 flex flex-col items-center shrink-0">
                  {idx > 0 && <div className="w-0.5 flex-1 bg-nd-border group-hover/item:bg-nd-accent/50 transition-colors" />}
                  <div className="w-10 h-10 flex items-center justify-center relative z-10">
                    <SymbolIcon type={step.symbol as SymbolType} size={28} />
                  </div>
                  {idx < steps.length - 1 && <div className="w-0.5 flex-1 bg-nd-border group-hover/item:bg-nd-accent/50 transition-colors" />}
                </div>

                {/* Step card */}
                <Card className={`flex-1 rounded-none border-nd-border shadow-none mb-0 ${idx === 0 ? '' : 'border-t-0'} group-hover/item:border-nd-accent group-hover/item:z-20 transition-colors relative transition-all duration-200`}>
                  <CardContent className="p-4 flex gap-4 items-start">
                    <span className="text-[10px] font-mono text-nd-border group-hover/item:text-nd-accent transition-colors pt-1">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-[0.1em] font-bold" style={{ color: SYMBOL_META[step.symbol as SymbolType].color }}>
                          {SYMBOL_META[step.symbol as SymbolType].label}
                        </span>
                        {step.who && (
                          <span className="text-[10px] font-mono text-nd-ink-muted">· {step.who}</span>
                        )}
                      </div>
                      
                      <h3 className={`text-[15px] leading-snug ${step.symbol === 'operation' ? 'font-bold' : 'font-normal'}`}>
                        {step.description}
                      </h3>

                      <div className="flex gap-4 mt-3">
                        {step.minutes && (
                          <div className="flex items-center font-mono text-[10px] text-nd-ink-muted bg-nd-bg px-2 py-0.5 border border-nd-border">
                            ⏱ {fmtMinutes(step.minutes)}
                            {(step.minutes ?? 0) > storageWarn && <span className="text-nd-accent ml-1.5">⚑</span>}
                          </div>
                        )}
                        {step.feet && (
                          <div className="flex items-center font-mono text-[10px] text-nd-ink-muted bg-nd-bg px-2 py-0.5 border border-nd-border">
                            ⟷ {step.feet} ft
                            {(step.feet ?? 0) > distWarn && <span className="text-nd-accent ml-1.5">⚑</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-nd-border hover:text-nd-accent" onClick={() => handleRemoveStep(step.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="cursor-grab active:cursor-grabbing text-nd-border hover:text-nd-ink p-1">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}

        {/* Final drop zone */}
        {steps.length > 0 && (
          <div
            className={`h-2 mx-12 transition-all ${dropIdx === steps.length && dragId ? 'h-12 bg-nd-accent/10 border-2 border-dashed border-nd-accent my-2 flex items-center justify-center text-[10px] font-mono text-nd-accent tracking-widest' : ''}`}
            onDragOver={e => { e.preventDefault(); setDropIdx(steps.length) }}
            onDragLeave={() => setDropIdx(null)}
            onDrop={e => onDropZone(e, steps.length)}
          >
            {dropIdx === steps.length && dragId ? 'DROP HERE' : null}
          </div>
        )}

        {steps.length > 0 && (
          <div className="flex items-center">
            <div className="w-12 flex flex-col items-center">
              <div className="w-0.5 h-6 bg-nd-border" />
              <div className="w-3 h-3 bg-nd-accent rounded-full" />
            </div>
            <span className="text-xs font-mono text-nd-ink-muted italic ml-3 pt-4">{endPoint}</span>
          </div>
        )}
      </div>
    </div>
  )
}
