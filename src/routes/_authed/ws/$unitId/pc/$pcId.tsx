import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useStepsCollection } from '@/db-collections'
import { ArrowLeft, Copy, Trash2, AlertTriangle, LayoutList, TableProperties, Code2, GripVertical, Check, Info, Activity } from 'lucide-react'
import mermaid from 'mermaid'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authed/ws/$unitId/pc/$pcId')({
  component: ProcessChartPage,
})

const SYMBOL_META = {
  operation: { label: 'Operation', color: '#1A1A18', bg: '#F5F5F5', hint: 'Something is changed, created, or added to' },
  transportation: { label: 'Transportation', color: '#5C5A52', bg: '#F1F0EC', hint: 'Something moves from one place to another' },
  storage: { label: 'Storage', color: '#D4A017', bg: '#FDFAED', hint: 'Something waits — no action taken' },
  inspection: { label: 'Inspection', color: '#2B5EA7', bg: '#EDF1FB', hint: 'Something is checked but not changed' },
} as const

type SymbolType = keyof typeof SYMBOL_META

// SVG Icon components for the shapes
function SymbolIcon({ type, size = 16, className = "" }: { type: SymbolType, size?: number, className?: string }) {
  const s = size, h = s / 2, strokeW = Math.max(1.5, s * 0.1)
  const color = SYMBOL_META[type].color

  if (type === 'operation') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
      <circle cx={h} cy={h} r={h - strokeW} fill={color} />
    </svg>
  )
  if (type === 'transportation') {
    const sm = s * 0.7
    return (
      <svg width={sm} height={sm} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
        <circle cx={h} cy={h} r={h - strokeW * 1.2} fill="none" stroke={color} strokeWidth={strokeW * 1.5} />
      </svg>
    )
  }
  if (type === 'storage') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
      <polygon points={`${h},${strokeW} ${s-strokeW},${s-strokeW} ${strokeW},${s-strokeW}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  )
  if (type === 'inspection') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={`shrink-0 ${className}`}>
      <rect x={strokeW} y={strokeW} width={s-strokeW*2} height={s-strokeW*2} fill="none" stroke={color} strokeWidth={strokeW} />
    </svg>
  )
  return null
}

function fmtMinutes(m: number | null | undefined) {
  if (m === null || m === undefined || m === 0) return null
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), rem = m % 60
  if (h >= 24) { const d = Math.floor(h/24), rh = h%24; return rh > 0 ? `${d}d ${rh}h` : `${d}d` }
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

function ProcessChartPage() {
  const { unitId, pcId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const pPcId = parseInt(pcId, 10)

  // -- Queries --
  const { data: pcData, isLoading: pcLoading } = useQuery({
    ...trpc.ws.processChart.get.queryOptions({ organizationId: orgId as number, processChartId: pPcId }),
    enabled: !!orgId && !isNaN(pPcId),
  })

  // TanStack DB Collection for steps
  const stepsCollection = useStepsCollection(orgId, pPcId)
  const { data: liveSteps = [], isLoading: stepsLoading } = useLiveQuery(
    (q) => q.from({ step: stepsCollection }).select(({ step }) => step),
    [stepsCollection],
  )

  const chart = pcData?.chart
  const steps = (liveSteps as any[]) || []
  const isLoading = pcLoading || stepsLoading

  // -- Mutations --
  const addStepMutation = useMutation(trpc.ws.processChart.addStep.mutationOptions())
  const updateStepMutation = useMutation(trpc.ws.processChart.updateStep.mutationOptions())
  const removeStepMutation = useMutation(trpc.ws.processChart.removeStep.mutationOptions())
  const reorderStepsMutation = useMutation(trpc.ws.processChart.reorderSteps.mutationOptions())

  // -- Local State --
  const [activeTab, setActiveTab] = useState('ledger')
  const [newStep, setNewStep] = useState<{ symbol: SymbolType, description: string, who: string, minutes: string, feet: string }>({ 
    symbol: 'operation', description: '', who: '', minutes: '', feet: '' 
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editVals, setEditVals] = useState({ description: '', who: '', minutes: '', feet: '', symbol: 'operation' as SymbolType })
  const [copiedCsv, setCopiedCsv] = useState(false)
  const [copiedMermaid, setCopiedMermaid] = useState(false)
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null)

  // Mermaid initialization
  useMemo(() => {
    if (typeof window !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#FDFAED',
          primaryTextColor: '#1A1A18',
          primaryBorderColor: '#1A1A18',
          lineColor: '#1A1A18',
          secondaryColor: '#EDF1FB',
          tertiaryColor: '#FFFFFF',
        },
        fontFamily: 'Bitter, serif'
      })
    }
  }, [])

  // Drag state
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  const invalidatePc = () => {
    queryClient.invalidateQueries(trpc.ws.processChart.get.queryFilter({ processChartId: pPcId }))
    queryClient.invalidateQueries(trpc.ws.processChart.listSteps.queryFilter({ processChartId: pPcId }))
  }

  // Mermaid Generation
  const mermaidSrc = useMemo(() => {
    const safe = (s: string) => s.replace(/["]/g, "'").replace(/[#{}|]/g, ' ').trim().slice(0, 60)
    const nodeFill = { operation: '#1A1A18', transportation: '#EDEAE2', storage: '#FDFAED', inspection: '#EDF1FB' }
    const nodeStroke = { operation: '#1A1A18', transportation: '#888684', storage: '#D4A017', inspection: '#2B5EA7' }
    const nodeText = { operation: '#F5F0E8', transportation: '#1A1A18', storage: '#6A5000', inspection: '#1A3A7A' }

    const lines = ['flowchart TD']
    steps.forEach((s, idx) => {
      const lbl = safe(s.description)
      const meta = s.minutes ? `⏱ ${fmtMinutes(s.minutes)}` : s.feet ? `⟷ ${s.feet}ft` : ''
      const full = meta ? `${lbl}\\n${meta}` : lbl
      const id = `S${s.id}`

      if (s.symbol === 'operation') lines.push(`  ${id}["${full}"]`)
      else if (s.symbol === 'transportation') lines.push(`  ${id}(["${full}"])`)
      else if (s.symbol === 'storage') lines.push(`  ${id}[/"${full}"/]`)
      else lines.push(`  ${id}{"${full}"}`)

      lines.push(`  style ${id} fill:${nodeFill[s.symbol as SymbolType]},stroke:${nodeStroke[s.symbol as SymbolType]},color:${nodeText[s.symbol as SymbolType]}`)

      if (idx < steps.length - 1) {
        lines.push(`  ${id} --> S${steps[idx + 1].id}`)
      }
    })
    return lines.join('\n')
  }, [steps])

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidSrc)
    setCopiedMermaid(true)
    setTimeout(() => setCopiedMermaid(false), 2000)
  }

  // Mermaid rendering
  useEffect(() => {
    if (activeTab === 'mermaid' && mermaidSrc && typeof window !== 'undefined') {
      let isMounted = true
      const renderDiagram = async () => {
        try {
          // Use random ID for each render to avoid collisions
          const randomId = 'mermaid-svg-' + Math.floor(Math.random() * 100000)
          const { svg } = await mermaid.render(randomId, mermaidSrc)
          if (isMounted) setMermaidSvg(svg)
        } catch (err) {
          console.error('Mermaid render error:', err)
        }
      }
      renderDiagram()
      return () => { isMounted = false }
    }
  }, [activeTab, mermaidSrc])

  // Reordering
  const handleReorder = async (fromIdx: number, toIdx: number) => {
    if (!orgId || fromIdx === toIdx) return
    const nextSteps = [...steps]
    const [removed] = nextSteps.splice(fromIdx, 1)
    nextSteps.splice(toIdx, 0, removed)
    
    await reorderStepsMutation.mutateAsync({
      organizationId: orgId,
      processChartId: pPcId,
      stepIds: nextSteps.map(s => s.id)
    })
    invalidatePc()
  }

  // Add Step
  const handleAddStep = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!orgId || !newStep.description.trim()) return
    await addStepMutation.mutateAsync({
      organizationId: orgId, processChartId: pPcId,
      symbol: newStep.symbol,
      description: newStep.description.trim(),
      who: newStep.who.trim() || undefined,
      minutes: Number(newStep.minutes) || undefined,
      feet: Number(newStep.feet) || undefined
    })
    setNewStep({ symbol: 'operation', description: '', who: '', minutes: '', feet: '' })
    invalidatePc()
  }

  // Edit Step
  const startEdit = (step: any) => {
    setEditingId(step.id)
    setEditVals({ 
      description: step.description, who: step.who || '', 
      minutes: step.minutes?.toString() || '', feet: step.feet?.toString() || '',
      symbol: step.symbol as SymbolType
    })
  }

  const commitEdit = async () => {
    if (!editingId || !orgId) return
    const step = steps.find(s => s.id === editingId)
    if (!step) return

    await updateStepMutation.mutateAsync({
      organizationId: orgId, stepId: editingId,
      symbol: editVals.symbol,
      description: editVals.description.trim() || step.description,
      who: editVals.who.trim() || undefined,
      minutes: editVals.symbol === 'storage' && editVals.minutes ? Number(editVals.minutes) : undefined,
      feet: editVals.symbol === 'transportation' && editVals.feet ? Number(editVals.feet) : undefined,
    })
    setEditingId(null)
    invalidatePc()
  }

  const handleRemoveStep = async (stepId: number) => {
    if (!orgId) return
    await removeStepMutation.mutateAsync({ organizationId: orgId, stepId })
    invalidatePc()
  }

  // CSV Export
  const copyCSV = () => {
    const header = 'Step,Type,Description,Who,Wait (min),Distance (ft)'
    const rows = steps.map((s, i) => `${i + 1},${s.symbol},"${s.description}","${s.who || ''}",${s.minutes ?? ''},${s.feet ?? ''}`)
    navigator.clipboard.writeText([header, ...rows].join('\n'))
    setCopiedCsv(true)
    setTimeout(() => setCopiedCsv(false), 2000)
  }

  // Derived Data & Metrics
  const counts = useMemo(() => {
    return {
      operation: steps.filter(s => s.symbol === 'operation').length,
      transportation: steps.filter(s => s.symbol === 'transportation').length,
      storage: steps.filter(s => s.symbol === 'storage').length,
      inspection: steps.filter(s => s.symbol === 'inspection').length,
      totalMinutes: steps.reduce((sum, s) => sum + (s.minutes || 0), 0),
      totalFeet: steps.reduce((sum, s) => sum + (s.feet || 0), 0),
    }
  }, [steps])

  if (isLoading || !chart) {
    return (
      <div className="p-8 flex justify-center bg-nd-bg min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  const storageWarn = chart.storageWarnMinutes
  const distWarn = chart.distanceWarnFeet

  const thClass = "bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-[#2E2E2C] whitespace-nowrap align-middle select-none"
  const tdClass = "border-b border-r border-nd-border px-3 py-2 align-middle bg-nd-surface group-hover:bg-black/5 transition-colors cursor-pointer"

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
    <div className="bg-nd-bg min-h-screen flex flex-col font-serif text-nd-ink relative overflow-hidden">
      {/* 
        CRITICAL FIX: AppShell has a header that might be overlapping.
        We'll keep the dark header but ensure it starts BELOW the AppShell header.
        Since we are inside 'main' which has flex-1, if the AppShell header is correctly positioned,
        we just need h-full. But the user sees overlap, so we'll add an safety mt-[-64px] 
        and then padding-top to compensate, or just ensure the header here is relative.
      */}
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
      
      {/* Header */}
      <div className="bg-nd-ink text-nd-bg px-8 py-6 print:py-0 print:bg-nd-surface print:text-black shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span>Work Simplification Program — Tool II</span>
            </div>
            <h1 className="m-0 text-3xl font-bold tracking-tight uppercase leading-tight">{chart.name}</h1>
          </div>
          <Link to="/ws/$unitId" params={{ unitId: unitId }} search={orgId ? { orgId } : {}} className="text-nd-bg/70 hover:text-white print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex gap-4 mt-6 text-xs font-mono">
          <div className="flex items-center"><span className="bg-nd-accent text-white px-2 py-1 tracking-wider mr-3">START</span> <span className="text-[#C8C3B4] print:text-black">{chart.startPoint}</span></div>
          <div className="flex items-center"><span className="bg-[#444] text-white px-2 py-1 tracking-wider mr-3">END</span> <span className="text-[#C8C3B4] print:text-black">{chart.endPoint}</span></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="bg-[#EDE8E0] border-b border-nd-border px-8 print:hidden flex items-center justify-between shrink-0">
              <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="ledger" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                  <TableProperties className="w-4 h-4 mr-2" />
                  Ledger
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                  <LayoutList className="w-4 h-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="mermaid" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                  <Code2 className="w-4 h-4 mr-2" />
                  Mermaid
                </TabsTrigger>
              </TabsList>
              
              <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-nd-ink-muted">
                <span>{steps.length} steps</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{fmtMinutes(counts.totalMinutes) || '0m'} total wait</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              
              <TabsContent value="ledger" className="m-0 border-none outline-none">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1">Spreadsheet View</div>
                    <div className="text-xs font-mono text-nd-ink-muted">{steps.length} steps · click a row to edit</div>
                  </div>
                  <Button onClick={copyCSV} variant="outline" size="sm" className="font-mono text-[10px] tracking-wider bg-nd-ink text-nd-bg hover:bg-nd-ink/90 hover:text-white rounded-none border-none">
                    <Copy className="w-3 h-3 mr-2" />
                    {copiedCsv ? 'COPIED' : 'COPY CSV'}
                  </Button>
                </div>

                <div className="border-2 border-nd-ink bg-nd-surface shadow-sm ring-1 ring-black/5 rounded-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thClass} style={{ width: 50, textAlign: 'right' }}>#</th>
                        <th className={thClass} style={{ width: 140 }}>Type</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass} style={{ width: 160 }}>Who</th>
                        <th className={thClass} style={{ width: 100, textAlign: 'right' }}>Wait (m)</th>
                        <th className={`${thClass} border-none`} style={{ width: 100, textAlign: 'right' }}>Dist (ft)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, idx) => {
                        const isEditing = editingId === step.id
                        const warnMin = (step.minutes ?? 0) > storageWarn
                        const warnFt = (step.feet ?? 0) > distWarn
                        const symColor = SYMBOL_META[step.symbol as SymbolType].color

                        return (
                          <tr key={step.id} className={`group ${isEditing ? 'bg-nd-accent/10' : idx % 2 === 0 ? 'bg-nd-surface' : 'bg-nd-bg'}`} onClick={() => !isEditing && startEdit(step)}>
                            <td className={`${tdClass} text-right font-mono text-nd-ink-muted border-l-2 ${isEditing ? 'border-l-nd-accent' : 'border-l-transparent'}`}>
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className={tdClass}>
                              {isEditing ? (
                                <Select value={editVals.symbol} onValueChange={(v) => setEditVals(p => ({ ...p, symbol: v as SymbolType }))}>
                                  <SelectTrigger className="h-7 text-xs font-mono rounded-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="font-mono text-xs">
                                    <SelectItem value="operation">Operation</SelectItem>
                                    <SelectItem value="transportation">Transport</SelectItem>
                                    <SelectItem value="storage">Storage</SelectItem>
                                    <SelectItem value="inspection">Inspection</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <SymbolIcon type={step.symbol as SymbolType} size={14} />
                                  <span className="text-[10px] font-mono uppercase tracking-[0.06em]" style={{ color: symColor }}>
                                    {SYMBOL_META[step.symbol as SymbolType].label}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className={tdClass}>
                              {isEditing ? (
                                <Input autoFocus value={editVals.description} onChange={e => setEditVals(p => ({ ...p, description: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} className="h-7 text-sm rounded-none border-nd-border focus-visible:ring-nd-accent" />
                              ) : (
                                <div className="flex justify-between items-center">
                                  <span className="text-[13px]">{step.description}</span>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id) }} className="text-nd-border hover:text-nd-accent opacity-0 group-hover:opacity-100 transition-opacity ml-2 print:hidden"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              )}
                            </td>
                            <td className={tdClass}>
                              {isEditing ? (
                                <Input value={editVals.who} onChange={e => setEditVals(p => ({ ...p, who: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} className="h-7 text-xs font-mono rounded-none border-nd-border focus-visible:ring-nd-accent" />
                              ) : (
                                <span className="text-xs font-mono text-nd-ink/80">{step.who || '—'}</span>
                              )}
                            </td>
                            <td className={`${tdClass} text-right font-mono`}>
                              {isEditing && editVals.symbol === 'storage' ? (
                                <Input type="number" value={editVals.minutes} onChange={e => setEditVals(p => ({ ...p, minutes: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} className="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent" />
                              ) : step.minutes ? (
                                <span className={`text-[11px] px-1.5 py-0.5 ${warnMin ? 'bg-[#FDFAED] text-[#9A7000] border border-[#D4A017]' : 'text-nd-ink'}`}>
                                  {step.minutes}{warnMin && ' ⚑'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-nd-ink-muted/50">—</span>
                              )}
                            </td>
                            <td className={`${tdClass} border-none text-right font-mono`}>
                              {isEditing && editVals.symbol === 'transportation' ? (
                                <Input type="number" value={editVals.feet} onChange={e => setEditVals(p => ({ ...p, feet: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} className="h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent" />
                              ) : step.feet ? (
                                <span className={`text-[11px] px-1.5 py-0.5 ${warnFt ? 'bg-[#EDF1FB] text-[#2B5EA7] border border-[#2B5EA7]/30' : 'text-nd-ink'}`}>
                                  {step.feet}{warnFt && ' ⚑'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-nd-ink-muted/50">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="bg-nd-ink border-t-[3px] border-nd-ink">
                        <td colSpan={4} className="p-3 font-mono text-[10px] text-[#8A8880] uppercase tracking-[0.1em]">
                          Totals — {steps.length} steps
                        </td>
                        <td className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${counts.totalMinutes > storageWarn ? 'text-[#D4A017]' : 'text-[#F5F0E8]'}`}>
                          {counts.totalMinutes || '—'}
                        </td>
                        <td className={`p-3 text-right font-mono text-sm font-bold border-l border-[#333] ${counts.totalFeet > distWarn ? 'text-[#6A9AE0]' : 'text-[#F5F0E8]'}`}>
                          {counts.totalFeet || '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="list" className="m-0 border-none outline-none">
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
                        <span className="text-xs font-mono text-nd-ink-muted italic ml-3 pt-4">{chart.endPoint}</span>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="mermaid" className="m-0 border-none outline-none">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-1 flex items-center gap-2">
                       <Activity className="w-3 h-3" />
                       Visual Process Flow
                    </div>
                    <div className="text-xs font-mono text-nd-ink-muted">Generated from process sequence</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyMermaid} variant="outline" className="font-mono text-[10px] tracking-wider bg-nd-ink text-nd-bg hover:bg-nd-ink/90 hover:text-white rounded-none border-none h-8">
                      {copiedMermaid ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                      {copiedMermaid ? 'COPIED' : 'COPY SOURCE'}
                    </Button>
                  </div>
                </div>

                <div className="bg-white p-8 border-2 border-nd-ink shadow-inner overflow-hidden flex justify-center min-h-[400px]">
                  {mermaidSvg ? (
                    <div 
                      className="w-full h-full mermaid-render" 
                      dangerouslySetInnerHTML={{ __html: mermaidSvg }} 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-nd-ink-muted">
                      <div className="w-8 h-8 border-2 border-nd-border border-t-nd-accent rounded-full animate-spin" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Generating Diagram...</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-8">
                   <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-nd-accent mb-4">Source Code</div>
                   <div className="bg-nd-surface-dark p-6 border border-nd-ink/20">
                    <pre className="font-mono text-[11px] text-[#C8C3B4] leading-relaxed overflow-x-auto whitespace-pre opacity-70">
                      {mermaidSrc}
                    </pre>
                  </div>
                </div>

                <div className="mt-6 p-4 border border-nd-border bg-nd-surface text-xs font-mono text-nd-ink-muted">
                  <div className="uppercase tracking-widest font-bold text-nd-accent mb-1 text-[9px] flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Compatibility
                  </div>
                  Mermaid diagrams are vector-based (SVG) and can be rendered in GitHub, Notion, and Obsidian.
                </div>
              </TabsContent>

              <div className="mt-4 text-[10px] font-mono text-nd-ink-muted sm:hidden">
                Click a row to edit. Enter to commit, Esc to cancel. ⚑ = exceeds defined chart thresholds.
              </div>

              {/* Add Step Form */}
              <div className="mt-12 border-2 border-nd-ink bg-nd-surface p-6 shadow-sm print:hidden">
                <div className="text-[10px] font-mono text-nd-accent tracking-[0.15em] uppercase mb-4">Add Next Step</div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(SYMBOL_META).map(([key, meta]) => (
                    <button 
                      key={key} 
                      onClick={(e) => { e.preventDefault(); setNewStep(p => ({ ...p, symbol: key as SymbolType })) }}
                      className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 p-3 border-2 transition-colors ${newStep.symbol === key ? 'border-nd-accent bg-nd-accent/10' : 'border-nd-border bg-nd-surface hover:border-nd-ink-muted'}`}
                    >
                      <SymbolIcon type={key as SymbolType} size={20} />
                      <span className="font-mono text-[9px] uppercase tracking-wider text-nd-ink-muted">{meta.label}</span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-[#8A8880] mb-4">
                  {SYMBOL_META[newStep.symbol].hint}
                </div>

                <form onSubmit={handleAddStep} className="flex gap-4 items-end flex-wrap">
                  <div className="flex-[2_1_200px]">
                    <label className="block text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.06em] mb-1">Description</label>
                    <Input value={newStep.description} onChange={e => setNewStep(p => ({ ...p, description: e.target.value }))} placeholder="What happens at this step?" className="font-serif text-sm h-9 rounded-none border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent" />
                  </div>
                  <div className="flex-[1_1_120px]">
                    <label className="block text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.06em] mb-1">Who</label>
                    <Input value={newStep.who} onChange={e => setNewStep(p => ({ ...p, who: e.target.value }))} placeholder="Role or name" className="font-mono text-xs h-9 rounded-none border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent" />
                  </div>
                  
                  {newStep.symbol === 'storage' && (
                    <div className="flex-[0_1_90px]">
                      <label className="block text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.06em] mb-1">Wait (min)</label>
                      <Input type="number" value={newStep.minutes} onChange={e => setNewStep(p => ({ ...p, minutes: e.target.value }))} className="font-mono text-xs h-9 text-right rounded-none border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent bg-[#FDFAED]" />
                    </div>
                  )}
                  
                  {newStep.symbol === 'transportation' && (
                    <div className="flex-[0_1_90px]">
                      <label className="block text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.06em] mb-1">Dist (ft)</label>
                      <Input type="number" value={newStep.feet} onChange={e => setNewStep(p => ({ ...p, feet: e.target.value }))} className="font-mono text-xs h-9 text-right rounded-none border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent bg-[#EDF1FB]" />
                    </div>
                  )}

                  <Button type="submit" disabled={addStepMutation.isPending || !newStep.description} className="h-9 bg-nd-accent hover:bg-nd-accent-hover text-white rounded-none tracking-wide text-xs">
                    + Add Step
                  </Button>
                </form>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Sidebar Composition & Intel */}
        <div className="w-64 bg-[#EDEAE2] border-l border-nd-border p-6 overflow-y-auto shrink-0 print:hidden">
          <div className="text-[10px] font-mono text-nd-accent tracking-[0.15em] uppercase mb-4">Summary</div>
          
          <div className="space-y-0 text-sm">
            {(['operation','transportation','storage','inspection'] as SymbolType[]).map(type => (
              <div key={type} className="flex items-center gap-3 py-2.5 border-b border-[#C8C3B4]">
                <SymbolIcon type={type} size={type === 'transportation' ? 14 : 18} />
                <span className="flex-1 text-[#5C5A52]">{SYMBOL_META[type].label}</span>
                <span className="font-mono text-base font-bold text-nd-ink">{counts[type]}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 py-3 border-b border-[#C8C3B4]">
            <div className="text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.08em] mb-1">Total Wait</div>
            <div className={`font-mono text-2xl font-bold ${counts.totalMinutes > storageWarn ? 'text-[#D4A017]' : 'text-nd-ink'}`}>
              {fmtMinutes(counts.totalMinutes) || '—'}
            </div>
            {counts.totalMinutes > storageWarn && (
              <div className="text-[10px] font-mono text-[#9A7000] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Look for bottlenecks</div>
            )}
          </div>

          <div className="py-3 border-b border-[#C8C3B4] mb-4">
            <div className="text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.08em] mb-1">Total Distance</div>
            <div className={`font-mono text-2xl font-bold ${counts.totalFeet > distWarn ? 'text-[#2B5EA7]' : 'text-nd-ink'}`}>
              {counts.totalFeet > 0 ? `${counts.totalFeet} ft` : '—'}
            </div>
            {counts.totalFeet > distWarn && (
              <div className="text-[10px] font-mono text-[#2B5EA7] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Consider reorganizing</div>
            )}
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.08em] mb-1">Total Steps</div>
            <div className="font-mono text-3xl font-bold text-nd-ink">{steps.length}</div>
          </div>

          {steps.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] font-mono text-[#5C5A52] uppercase tracking-[0.08em] mb-2">Composition</div>
              <div className="flex h-4 bg-nd-surface border border-[#C8C3B4] overflow-hidden">
                {([['operation', '#1A1A18'], ['transportation', '#888684'], ['storage', '#D4A017'], ['inspection', '#2B5EA7']] as const).map(([type, color]) => (
                  counts[type] > 0 ? <div key={type} style={{ width: `${(counts[type] / steps.length) * 100}%`, backgroundColor: color }} title={type} /> : null
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-nd-ink text-white mt-auto rounded-sm border-b-2 border-nd-accent">
            <div className="text-[9px] font-mono text-nd-accent tracking-[0.12em] mb-2 font-bold leading-tight">ELIMINATE · COMBINE · REARRANGE · SIMPLIFY</div>
            <div className="text-[10px] font-mono text-[#C8C3B4] leading-relaxed">
              Non-operation steps are elimination candidates. Long storage = bottleneck. Long distances = rearrange the room.
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}
