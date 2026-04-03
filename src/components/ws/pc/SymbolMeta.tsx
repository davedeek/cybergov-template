export const SYMBOL_META = {
  operation: {
    label: 'Operation',
    color: '#1A1A18',
    bg: '#F5F5F5',
    hint: 'Something is changed, created, or added to',
  },
  transportation: {
    label: 'Transportation',
    color: '#5C5A52',
    bg: '#F1F0EC',
    hint: 'Something moves from one place to another',
  },
  storage: {
    label: 'Storage',
    color: '#D4A017',
    bg: '#FDFAED',
    hint: 'Something waits — no action taken',
  },
  inspection: {
    label: 'Inspection',
    color: '#2B5EA7',
    bg: '#EDF1FB',
    hint: 'Something is checked but not changed',
  },
} as const

export type SymbolType = keyof typeof SYMBOL_META

export function SymbolIcon({
  type,
  size = 16,
  className = '',
  color: colorOverride,
}: {
  type: SymbolType
  size?: number
  className?: string
  color?: string
}) {
  const s = size,
    h = s / 2,
    strokeW = Math.max(1.5, s * 0.1)
  const color = colorOverride ?? SYMBOL_META[type].color

  if (type === 'operation')
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <circle cx={h} cy={h} r={h - strokeW} fill={color} />
      </svg>
    )
  if (type === 'transportation') {
    const sm = s * 0.7
    return (
      <svg width={sm} height={sm} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <circle
          cx={h}
          cy={h}
          r={h - strokeW * 1.2}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 1.5}
        />
      </svg>
    )
  }
  if (type === 'storage')
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <polygon
          points={`${h},${strokeW} ${s - strokeW},${s - strokeW} ${strokeW},${s - strokeW}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
      </svg>
    )
  if (type === 'inspection')
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <rect
          x={strokeW}
          y={strokeW}
          width={s - strokeW * 2}
          height={s - strokeW * 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
        />
      </svg>
    )
  return null
}

export function fmtMinutes(m: number | null | undefined) {
  if (m === null || m === undefined || m === 0) return null
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60),
    rem = m % 60
  if (h >= 24) {
    const d = Math.floor(h / 24),
      rh = h % 24
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`
  }
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}
