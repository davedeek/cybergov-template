import { buildCollection } from './createTrpcCollection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMemo } from 'react'
import type { ProcessStep, StepAnnotation } from '@/types/entities'

export function useStepsCollection(orgId?: number, pcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.processChart.listSteps.queryOptions({
      organizationId: orgId ?? -1,
      processChartId: pcId ?? -1,
    })
    return buildCollection<ProcessStep>(`steps-${orgId}-${pcId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!pcId,
      getKey: (s) => s.id,
      onInsert: async (tx) => {
        if (!orgId || !pcId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.processChart.addStep.mutate({
            organizationId: orgId,
            processChartId: pcId,
            symbol: m.modified.symbol,
            description: m.modified.description,
            who: m.modified.who ?? undefined,
            minutes: m.modified.minutes ?? undefined,
            feet: m.modified.feet ?? undefined,
          })
          results.push(res)
        }
        return results[0]
      },
      onUpdate: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          const { id: _id, processChartId: _pcId, sequenceNumber: _seq, ...rest } = m.modified
          await trpcClient.ws.processChart.updateStep.mutate({
            organizationId: orgId,
            stepId: m.key as number,
            ...rest,
            who: rest.who ?? undefined,
            minutes: rest.minutes ?? undefined,
            feet: rest.feet ?? undefined,
            notes: rest.notes ?? undefined,
          })
        }
      },
      onDelete: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.ws.processChart.removeStep.mutate({
            organizationId: orgId,
            stepId: m.key as number,
          })
        }
      },
    })
  }, [orgId, pcId])
}

export function useAnnotationsCollection(orgId?: number, pcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.processChart.listAnnotations.queryOptions({
      organizationId: orgId ?? -1,
      processChartId: pcId ?? -1,
    })
    return buildCollection<StepAnnotation>(`annotations-${orgId}-${pcId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!pcId,
      getKey: (a) => a.id,
      onInsert: async (tx) => {
        if (!orgId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.processChart.upsertAnnotation.mutate({
            organizationId: orgId,
            stepId: m.modified.stepId,
            question: m.modified.question,
            note: m.modified.note,
            proposedAction: m.modified.proposedAction,
          })
          results.push(res)
        }
        return results[0]
      },
      onUpdate: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.ws.processChart.upsertAnnotation.mutate({
            organizationId: orgId,
            stepId: m.modified.stepId,
            question: m.modified.question,
            note: m.modified.note,
            proposedAction: m.modified.proposedAction,
          })
        }
      },
      onDelete: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.ws.processChart.removeAnnotation.mutate({
            organizationId: orgId,
            annotationId: m.key as number,
          })
        }
      },
    })
  }, [orgId, pcId])
}
