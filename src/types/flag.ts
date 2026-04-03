import type { FlagSeverity } from '@/components/ws/shared/table-styles'

export interface Flag {
  type: string
  severity: FlagSeverity
  message: string
  guide: string
  /** Used by process flags to deep-link into six-questions analysis */
  targetQuestion?: 'what' | 'why' | 'where' | 'when' | 'who' | 'how'
}
