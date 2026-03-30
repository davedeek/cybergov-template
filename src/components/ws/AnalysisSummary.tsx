import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck } from 'lucide-react'
import {
  SIX_QUESTIONS,
  PROPOSED_ACTIONS,
  ACTION_COLORS,
  type ProposedAction,
} from './six-questions'
import type { ProcessStep, StepAnnotation } from '@/types/entities'

interface AnalysisSummaryProps {
  steps: ProcessStep[]
  annotations: StepAnnotation[]
}

export function AnalysisSummary({ steps, annotations }: AnalysisSummaryProps) {
  if (steps.length === 0) return null

  const questionsWithAnnotations = SIX_QUESTIONS.filter((q) =>
    annotations.some((a) => a.question === q.key && (a.note.trim() || a.proposedAction !== 'none')),
  ).length

  const actionCounts = annotations.reduce(
    (acc, a) => {
      if (a.proposedAction !== 'none') {
        acc[a.proposedAction] = (acc[a.proposedAction] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )
  const totalActions = Object.values(actionCounts).reduce((s, c) => s + c, 0)

  // Steps with at least one proposed action
  const stepsWithActions = new Set(
    annotations.filter((a) => a.proposedAction !== 'none').map((a) => a.stepId),
  )

  return (
    <Card className="rounded-none border-2 border-nd-ink bg-nd-surface shadow-none">
      <CardContent className="p-5">
        <h3 className="text-[10px] font-mono tracking-widest uppercase mb-4 text-nd-ink flex items-center">
          <ClipboardCheck className="w-3 h-3 mr-2 text-nd-accent" />
          Six Questions Analysis
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-mono uppercase text-nd-ink-muted">
              Questions Reviewed
            </span>
            <span className="font-mono text-xs font-bold">{questionsWithAnnotations}/6</span>
          </div>

          {totalActions > 0 && (
            <>
              <div className="pt-3 border-t border-nd-border">
                <div className="text-[10px] font-mono uppercase text-nd-ink-muted mb-2">
                  Proposed Changes
                </div>
                <div className="space-y-1.5">
                  {PROPOSED_ACTIONS.filter((a) => a.value !== 'none' && actionCounts[a.value]).map(
                    (a) => (
                      <div
                        key={a.value}
                        className={`flex justify-between items-center text-[11px] pl-2 border-l-2 ${ACTION_COLORS[a.value as ProposedAction]}`}
                      >
                        <span className="font-mono text-nd-ink-muted">{a.label}</span>
                        <span className="font-mono font-bold">{actionCounts[a.value]}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-nd-border">
                <div className="text-[10px] font-mono uppercase text-nd-ink-muted mb-2">
                  Steps Flagged
                </div>
                <div className="space-y-1">
                  {steps
                    .filter((s) => stepsWithActions.has(s.id))
                    .map((s) => {
                      const stepAnnotation = annotations.find(
                        (a) => a.stepId === s.id && a.proposedAction !== 'none',
                      )
                      const action = stepAnnotation?.proposedAction as ProposedAction
                      return (
                        <div
                          key={s.id}
                          className={`text-[11px] leading-snug p-1.5 bg-nd-bg/50 border-l-2 ${ACTION_COLORS[action]}`}
                        >
                          <span className="font-mono text-nd-ink-muted mr-1.5">
                            {String(steps.indexOf(s) + 1).padStart(2, '0')}
                          </span>
                          <span className="font-serif">
                            {s.description.slice(0, 40)}
                            {s.description.length > 40 ? '...' : ''}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </>
          )}

          {totalActions === 0 && questionsWithAnnotations === 0 && (
            <div className="text-[11px] font-mono text-nd-ink-muted italic">
              Use the Six Questions tab to analyze your process.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
