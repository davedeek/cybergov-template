import { useState, useMemo, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useStepsCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { SymbolType, fmtMinutes } from '@/components/ws/SymbolMeta'
import { z } from 'zod'

export function useProcessChart(orgId: number | undefined, pPcId: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { handleMutation, isPending: mutationPending, error: mutationError } = useMutationHandler()

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
  const reorderStepsMutation = useMutation(trpc.ws.processChart.reorderSteps.mutationOptions())

  // -- Local State --
  const [activeTab, setActiveTab] = useState('ledger')
  
  const stepSchema = z.object({
    symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
    description: z.string().trim().min(3, 'Description must be at least 3 characters'),
    who: z.string().trim(),
    minutes: z.string().refine(v => v === '' || !isNaN(Number(v)), 'Must be a number'),
    feet: z.string().refine(v => v === '' || !isNaN(Number(v)), 'Must be a number'),
  })

  const addStepForm = useForm({
    defaultValues: {
      symbol: 'operation' as SymbolType,
      description: '',
      who: '',
      minutes: '',
      feet: '',
    },
    validators: {
      onChange: stepSchema,
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return
      await handleMutation(
        () => stepsCollection.insert({
          symbol: value.symbol,
          description: value.description.trim(),
          who: value.who.trim() || null,
          minutes: value.minutes ? Number(value.minutes) : null,
          feet: value.feet ? Number(value.feet) : null
        } as any),
        { 
          label: 'Create Process Step',
          onSuccess: () => addStepForm.reset()
        }
      )
    },
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const editStepForm = useForm({
    defaultValues: {
      symbol: 'operation' as SymbolType,
      description: '',
      who: '',
      minutes: '',
      feet: '',
    },
    validators: {
      onChange: stepSchema,
    },
    onSubmit: async ({ value }) => {
      if (!editingId || !orgId) return
      const step = steps.find(s => s.id === editingId)
      if (!step) return

      await handleMutation(
        () => stepsCollection.update(editingId, {
          symbol: value.symbol,
          description: value.description.trim() || step.description,
          who: value.who.trim() || null,
          minutes: value.minutes ? Number(value.minutes) : null,
          feet: value.feet ? Number(value.feet) : null,
        } as any),
        { 
          label: 'Update Process Step',
          onSuccess: () => setEditingId(null)
        }
      )
    },
  })
  const [copiedCsv, setCopiedCsv] = useState(false)
  const [copiedMermaid, setCopiedMermaid] = useState(false)
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null)

  // Drag state
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  const invalidatePc = () => {
    queryClient.invalidateQueries(trpc.ws.processChart.get.queryFilter({ processChartId: pPcId }))
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

  // Mermaid Rendering (lazy-loaded to keep mermaid out of the main bundle)
  useEffect(() => {
    if (activeTab === 'mermaid' && mermaidSrc && typeof window !== 'undefined') {
      let isMounted = true
      const renderDiagram = async () => {
        try {
          const { default: mermaid } = await import('mermaid')
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
    
    await handleMutation(
      () => reorderStepsMutation.mutateAsync({
        organizationId: orgId,
        processChartId: pPcId,
        stepIds: nextSteps.map(s => s.id)
      }),
      { 
        label: 'Reorder Flow Sequence',
        onSuccess: () => invalidatePc()
      }
    )
  }

  const handleAddStep = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    addStepForm.handleSubmit()
  }

  const startEdit = (step: any) => {
    setEditingId(step.id)
    editStepForm.reset({ 
      description: step.description, 
      who: step.who || '', 
      minutes: step.minutes?.toString() || '', 
      feet: step.feet?.toString() || '',
      symbol: step.symbol as SymbolType
    })
  }

  const commitEdit = async () => {
    editStepForm.handleSubmit()
  }

  const handleRemoveStep = async (stepId: number) => {
    if (!orgId) return
    await handleMutation(
      () => stepsCollection.delete(stepId),
      { label: 'Unregister Process Step' }
    )
  }

  return {
    chart, steps, isLoading,
    activeTab, setActiveTab,
    addStepForm,
    editStepForm,
    editingId, setEditingId,
    copiedCsv, setCopiedCsv,
    copiedMermaid, setCopiedMermaid,
    mermaidSvg, mermaidSrc,
    dragId, setDragId,
    dropIdx, setDropIdx,
    handleReorder, handleAddStep, startEdit, commitEdit, handleRemoveStep,
    invalidatePc,
    mutationPending,
    mutationError
  }
}
