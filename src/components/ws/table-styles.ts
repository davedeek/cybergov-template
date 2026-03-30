// Shared table styling constants for work simplification tables
export const TABLE_STYLES = {
  th: "bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-[#2E2E2C] whitespace-nowrap align-middle select-none h-auto rounded-none",
  thAlignTop: "bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-[#2E2E2C] whitespace-nowrap align-top select-none",
  td: "border-b border-r border-nd-border px-3 py-2 align-middle bg-nd-surface group-hover:bg-black/5 transition-colors cursor-pointer",
  tdWdc: "border border-nd-border p-2 align-top bg-nd-surface min-w-[140px]",
  actLabel: "bg-[#2A2A28] text-nd-bg font-mono text-xs min-w-[160px] max-w-[160px] border-none select-none",
} as const

// Semantic color tokens for warning/status indicators
export const STATUS_COLORS = {
  storageWarn: { bg: 'bg-[#FDFAED]', text: 'text-[#9A7000]', border: 'border-[#D4A017]' },
  distanceWarn: { bg: 'bg-[#EDF1FB]', text: 'text-[#2B5EA7]', border: 'border-[#2B5EA7]/30' },
  overloaded: { bg: 'bg-[#FDF0ED]', text: 'text-[#C94A1E]', border: 'border-l-[#C94A1E]' },
  caution: { bg: 'bg-nd-bg', text: 'text-[#9A7000]', border: 'border-l-[#D4A017]' },
  info: { bg: 'bg-[#EDF1FB]', text: 'text-[#2B5EA7]', border: 'border-l-[#2B5EA7]' },
  neutral: { bg: 'bg-[#F5F5F5]', text: 'text-[#5C5A52]', border: 'border-l-[#8A8880]' },
} as const

export type FlagSeverity = 'red' | 'yellow' | 'blue' | 'gray'

export const FLAG_SEVERITY_COLORS: Record<FlagSeverity, { bg: string; border: string; text: string }> = {
  red: STATUS_COLORS.overloaded,
  yellow: STATUS_COLORS.caution,
  blue: STATUS_COLORS.info,
  gray: STATUS_COLORS.neutral,
}
