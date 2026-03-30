import { buildCollection, getCachedCollection } from './createTrpcCollection'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMemo } from 'react'
import type {
  Todo,
  OrganizationMembership,
  Unit,
  ProcessChart,
  ProcessStep,
  StepAnnotation,
  ProposedChange,
  WdcChart,
  WdcEmployee,
  WdcActivity,
  WdcTask,
} from '@/types/entities'

export function useTodosCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.todos.list.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<Todo>(`todos-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (t) => t.id,
      onInsert: async (tx) => {
        if (!orgId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.todos.add.mutate({
            organizationId: orgId,
            name: m.modified.name,
          })
          results.push(res)
        }
        return results[0]
      },
      onUpdate: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          const { id: _id, organizationId: _orgId, ...rest } = m.modified
          await trpcClient.todos.update.mutate({
            organizationId: orgId,
            id: m.key as number,
            ...rest,
          })
        }
      },
      onDelete: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.todos.delete.mutate({ organizationId: orgId, id: m.key as number })
        }
      },
    })
  }, [orgId])
}

export function useMembersCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.organization.listMembers.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<OrganizationMembership>(`members-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (m) => m.id,
    })
  }, [orgId])
}

export function useOrganizationsCollection() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.organization.listMine.queryOptions()
    return getCachedCollection(`organizations`, () =>
      createCollection(
        queryCollectionOptions({
          queryClient,
          queryKey: qo.queryKey,
          queryFn: async (ctx) => {
            if (!qo.queryFn) return []
            return qo.queryFn(ctx)
          },
          getKey: (org) => (org as { organization: { id: number } }).organization.id,
        }),
      ),
    )
  }, [])
}

export function useUnitsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.units.list.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<Unit>(`units-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (u) => u.id,
      onInsert: async (tx) => {
        if (!orgId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.units.create.mutate({
            organizationId: orgId,
            name: m.modified.name,
            description: m.modified.description ?? undefined,
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId])
}

export function useProcessChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.processChart.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })
    return buildCollection<ProcessChart>(`pc-${orgId}-${unitId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!unitId,
      getKey: (c) => c.id,
      onInsert: async (tx) => {
        if (!orgId || !unitId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.processChart.create.mutate({
            organizationId: orgId,
            unitId,
            name: m.modified.name,
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId, unitId])
}

export function useAllProcessChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.processChart.listAll.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<ProcessChart>(`pc-all-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (c) => c.id,
    })
  }, [orgId])
}

export function useWDCChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.wdc.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })
    return buildCollection<WdcChart>(`wdc-${orgId}-${unitId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!unitId,
      getKey: (c) => c.id,
      onInsert: async (tx) => {
        if (!orgId || !unitId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.wdc.create.mutate({
            organizationId: orgId,
            unitId,
            name: m.modified.name,
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId, unitId])
}

export function useAllWDCChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.wdc.listAll.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<WdcChart>(`wdc-all-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (c) => c.id,
    })
  }, [orgId])
}

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

export function useWDCEmployeesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.wdc.listEmployees.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })
    return buildCollection<WdcEmployee>(`wdc-employees-${orgId}-${wdcId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!wdcId,
      getKey: (e) => e.id,
      onInsert: async (tx) => {
        if (!orgId || !wdcId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.wdc.addEmployee.mutate({
            organizationId: orgId,
            wdcId,
            name: m.modified.name,
            role: m.modified.role ?? undefined,
            fte: m.modified.fte ?? '1.0',
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId, wdcId])
}

export function useWDCActivitiesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.wdc.listActivities.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })
    return buildCollection<WdcActivity>(`wdc-activities-${orgId}-${wdcId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!wdcId,
      getKey: (a) => a.id,
      onInsert: async (tx) => {
        if (!orgId || !wdcId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.wdc.addActivity.mutate({
            organizationId: orgId,
            wdcId,
            name: m.modified.name,
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId, wdcId])
}

export function useWDCTasksCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.wdc.listTasks.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })
    return buildCollection<WdcTask>(`wdc-tasks-${orgId}-${wdcId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!wdcId,
      getKey: (t) => t.id,
      onInsert: async (tx) => {
        if (!orgId || !wdcId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.wdc.addTask.mutate({
            organizationId: orgId,
            wdcId,
            employeeId: m.modified.employeeId,
            activityId: m.modified.activityId,
            taskName: m.modified.taskName,
            hoursPerWeek: m.modified.hoursPerWeek,
          })
          results.push(res)
        }
        return results[0]
      },
      onDelete: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.ws.wdc.removeTask.mutate({
            organizationId: orgId,
            taskId: m.key as number,
          })
        }
      },
    })
  }, [orgId, wdcId])
}

export function useChangesCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.changes.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })
    return buildCollection<ProposedChange>(`changes-${orgId}-${unitId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!unitId,
      getKey: (c) => c.id,
      onInsert: async (tx) => {
        if (!orgId || !unitId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.changes.createChange.mutate({
            organizationId: orgId,
            unitId,
            chartType: m.modified.chartType,
            chartId: m.modified.chartId,
            description: m.modified.description,
            beforeState: m.modified.beforeState ?? undefined,
            afterState: m.modified.afterState ?? undefined,
          })
          results.push(res)
        }
        return results[0]
      },
      onUpdate: async (tx) => {
        if (!orgId) return
        for (const m of tx.mutations) {
          await trpcClient.ws.changes.updateStatus.mutate({
            organizationId: orgId,
            changeId: m.key as number,
            status: m.modified.status,
          })
        }
      },
    })
  }, [orgId, unitId])
}
