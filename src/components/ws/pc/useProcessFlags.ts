import { useMemo } from 'react'
import type { ProcessStep } from '@/types/entities'
import type { Flag } from '@/types/flag'

interface UseProcessFlagsParams {
  steps: ProcessStep[]
  storageWarnMinutes: number
  distanceWarnFeet: number
}

export function useProcessFlags({
  steps,
  storageWarnMinutes,
  distanceWarnFeet,
}: UseProcessFlagsParams): Flag[] {
  return useMemo(() => {
    if (steps.length === 0) return []
    const flags: Flag[] = []

    // Excessive wait — storage steps over threshold
    steps.forEach((s, idx) => {
      if (s.symbol === 'storage' && (s.minutes ?? 0) > storageWarnMinutes) {
        flags.push({
          type: 'Excessive Wait',
          severity: 'red',
          message: `Step ${idx + 1} "${s.description}" idles for ${s.minutes} min (threshold: ${storageWarnMinutes} min).`,
          guide: 'Ask WHY this wait exists. Can upstream send work sooner?',
          targetQuestion: 'why',
        })
      }
    })

    // Long transport — transportation steps over threshold
    steps.forEach((s, idx) => {
      if (s.symbol === 'transportation' && (s.feet ?? 0) > distanceWarnFeet) {
        flags.push({
          type: 'Long Transport',
          severity: 'red',
          message: `Step ${idx + 1} "${s.description}" moves ${s.feet} ft (threshold: ${distanceWarnFeet} ft).`,
          guide: "Ask WHERE — can work be done closer to where it's needed?",
          targetQuestion: 'where',
        })
      }
    })

    // Back-to-back storage
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i].symbol === 'storage' && steps[i + 1].symbol === 'storage') {
        flags.push({
          type: 'Back-to-Back Idle',
          severity: 'yellow',
          message: `Steps ${i + 1}–${i + 2} are consecutive storage/wait steps: "${steps[i].description}" → "${steps[i + 1].description}".`,
          guide: 'Work is sitting idle twice in a row. Can these waits be eliminated or combined?',
          targetQuestion: 'why',
        })
      }
    }

    // Inspection-heavy — more than 30% inspections
    const inspections = steps.filter((s) => s.symbol === 'inspection').length
    if (steps.length >= 4 && inspections / steps.length > 0.3) {
      flags.push({
        type: 'Inspection-Heavy',
        severity: 'yellow',
        message: `${inspections} of ${steps.length} steps are inspections (${Math.round((inspections / steps.length) * 100)}%).`,
        guide:
          'More than a third of steps are checks. Ask WHY — are earlier operations unreliable?',
        targetQuestion: 'why',
      })
    }

    // No operations
    const operations = steps.filter((s) => s.symbol === 'operation').length
    if (operations === 0 && steps.length >= 2) {
      flags.push({
        type: 'No Value-Adding Steps',
        severity: 'gray',
        message:
          'This process has zero operation steps — nothing is being created, changed, or added to.',
        guide: 'Is the chart complete? Operations are where value is created.',
        targetQuestion: 'what',
      })
    }

    // Single handler
    const handlers = new Set(steps.map((s) => s.who).filter(Boolean))
    if (handlers.size === 1 && steps.length >= 4) {
      const handler = [...handlers][0]
      flags.push({
        type: 'Single Handler',
        severity: 'blue',
        message: `All ${steps.length} steps are assigned to "${handler}".`,
        guide:
          'One person does everything. Ask WHO — is there a key-person risk or delegation opportunity?',
        targetQuestion: 'who',
      })
    }

    // Long process
    if (steps.length > 15) {
      flags.push({
        type: 'Long Process',
        severity: 'blue',
        message: `This process has ${steps.length} steps.`,
        guide: 'Complex process. Look for steps to ELIMINATE or COMBINE.',
        targetQuestion: 'what',
      })
    }

    return flags
  }, [steps, storageWarnMinutes, distanceWarnFeet])
}
