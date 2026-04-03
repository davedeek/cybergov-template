// Shared table styling constants for work simplification tables
export const TABLE_STYLES = {
  th: 'bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-nd-surface-dark whitespace-nowrap align-middle select-none h-auto',
  thAlignTop:
    'bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-nd-surface-dark whitespace-nowrap align-top select-none',
  td: 'border-b border-r border-nd-border px-3 py-2 align-middle bg-nd-surface group-hover:bg-black/5 transition-colors cursor-pointer',
  tdWdc: 'border border-nd-border p-2 align-top bg-nd-surface min-w-[140px]',
  actLabel:
    'bg-nd-surface-dark text-nd-bg font-mono text-xs min-w-[160px] max-w-[160px] border-none select-none',
} as const

// Semantic color tokens for warning/status indicators
export const STATUS_COLORS = {
  storageWarn: { bg: 'bg-nd-status-warn-bg', text: 'text-nd-status-warn', border: 'border-nd-flag-yellow' },
  distanceWarn: { bg: 'bg-nd-flag-blue/10', text: 'text-nd-flag-blue', border: 'border-nd-flag-blue/30' },
  overloaded: { bg: 'bg-nd-accent/10', text: 'text-nd-accent', border: 'border-l-nd-accent' },
  caution: { bg: 'bg-nd-bg', text: 'text-nd-status-warn', border: 'border-l-nd-flag-yellow' },
  info: { bg: 'bg-nd-flag-blue/10', text: 'text-nd-flag-blue', border: 'border-l-nd-flag-blue' },
  neutral: { bg: 'bg-nd-surface-alt', text: 'text-nd-ink-muted', border: 'border-l-nd-ink-muted' },
} as const

export type FlagSeverity = 'red' | 'yellow' | 'blue' | 'gray'

export const FLAG_SEVERITY_COLORS: Record<
  FlagSeverity,
  { bg: string; border: string; text: string }
> = {
  red: STATUS_COLORS.overloaded,
  yellow: STATUS_COLORS.caution,
  blue: STATUS_COLORS.info,
  gray: STATUS_COLORS.neutral,
}

// Shared tab trigger class for consistent styling across chart pages
export const TAB_TRIGGER_CLASS =
  'border-none bg-none p-0 pb-3 text-sm font-nd-display uppercase tracking-widest text-nd-ink-muted data-[state=active]:text-nd-ink data-[state=active]:border-b-4 data-[state=active]:border-nd-accent transition-none' as const
