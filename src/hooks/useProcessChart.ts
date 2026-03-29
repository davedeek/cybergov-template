import { useState, useMemo, useEffect } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useStepsCollection } from '@/db-collections'
import mermaid from 'mermaid'
import { SymbolType, fmtMinutes } from '@/components/ws/SymbolMeta'

export function useProcessChart(orgId: number | undefined, pPcId: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

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
      const id = `S${s.id}`
      const full = meta ? `${lbl}\\n${meta}` : lbl

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

  // Mermaid Rendering
  useEffect(() => {
    if (activeTab === 'mermaid' && mermaidSrc && typeof window !== 'undefined') {
      let isMounted = true
      const renderDiagram = async () => {
        try {
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

  // Logic handlers
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

  return {
    chart, steps, isLoading,
    activeTab, setActiveTab,
    newStep, setNewStep,
    editingId, setEditingId,
    editVals, setEditVals,
    copiedCsv, setCopiedCsv,
    copiedMermaid, setCopiedMermaid,
    mermaidSvg, mermaidSrc,
    dragId, setDragId,
    dropIdx, setDropIdx,
    handleReorder, handleAddStep, startEdit, commitEdit, handleRemoveStep,
    invalidatePc
  }
}
