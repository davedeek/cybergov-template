import { useMemo } from 'react'
import type { ProcessStep, WorkCountEntry } from '@/types/entities'
import type { FlagSeverity } from '@/components/ws/table-styles'

export interface WorkCountFlag {
  type: string
  severity: FlagSeverity
  message: string
  guide: string
}

interface UseWorkCountFlagsParams {
  steps: ProcessStep[]
  entries: WorkCountEntry[]
  dropThreshold?: number // percentage drop that triggers a flag (default 30)
}

export function useWorkCountFlags({
  steps,
  entries,
  dropThreshold = 30,
}: UseWorkCountFlagsParams): WorkCountFlag[] {
  return useMemo(() => {
    if (steps.length < 2 || entries.length === 0) return []
    const flags: WorkCountFlag[] = []

    // Build count-per-step map (summed across all entries for that step)
    const stepCounts: Record<number, number> = {}
    entries.forEach((e) => {
      stepCounts[e.stepId] = (stepCounts[e.stepId] ?? 0) + e.count
    })

    // Walk steps in sequence order and check for volume drops
    const sortedSteps = [...steps].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    for (let i = 0; i < sortedSteps.length - 1; i++) {
      const current = stepCounts[sortedSteps[i].id] ?? 0
      const next = stepCounts[sortedSteps[i + 1].id] ?? 0

      if (current > 0 && next < current) {
        const dropPct = Math.round(((current - next) / current) * 100)
        if (dropPct >= dropThreshold) {
          flags.push({
            type: 'Volume Drop',
            severity: dropPct >= 50 ? 'red' : 'yellow',
            message: `Volume drops ${dropPct}% between step ${i + 1} "${sortedSteps[i].description}" (${current}) and step ${i + 2} "${sortedSteps[i + 1].description}" (${next}).`,
            guide:
              'A significant volume drop may indicate a bottleneck, backlog, or lost work items at this transition.',
          })
        }
      }
    }

    // Check for zero-count steps that are operations (should have volume)
    sortedSteps.forEach((step, idx) => {
      if (step.symbol === 'operation' && (stepCounts[step.id] ?? 0) === 0) {
        flags.push({
          type: 'Zero Volume',
          severity: 'gray',
          message: `Step ${idx + 1} "${step.description}" (operation) has zero recorded counts.`,
          guide:
            'This operation step shows no volume. Has it been counted yet, or is it being skipped?',
        })
      }
    })

    return flags
  }, [steps, entries, dropThreshold])
}
