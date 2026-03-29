import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

// Singleton-like cache for collections to ensure reusability across views
const collectionsCache = new Map<string, any>()

function getCachedCollection<T>(key: string, factory: () => T): T {
  if (!collectionsCache.has(key)) {
    collectionsCache.set(key, factory())
  }
  return collectionsCache.get(key)
}

export function useTodosCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.todos.list.queryOptions({
    organizationId: orgId ?? -1,
  })

  return getCachedCollection(`todos-${orgId}`, () => 
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (todo: any) => todo.id,
        onInsert: async ({ transaction }) => {
          if (!orgId) return
          const results = []
          for (const m of transaction.mutations) {
            const res = await trpcClient.todos.add.mutate({
              organizationId: orgId,
              name: m.modified.name,
            })
            results.push(res)
          }
          return results[0]
        },
        onUpdate: async ({ transaction }) => {
          if (!orgId) return
          for (const m of transaction.mutations) {
            const { id, organizationId, ...rest } = m.modified
            await trpcClient.todos.update.mutate({
              organizationId: orgId,
              id: m.key as number,
              ...rest,
            })
          }
        },
        onDelete: async ({ transaction }) => {
          if (!orgId) return
          for (const m of transaction.mutations) {
            await trpcClient.todos.delete.mutate({
              organizationId: orgId,
              id: m.key as number,
            })
          }
        },
      })
    )
  )
}

export function useMembersCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.organization.listMembers.queryOptions({
    organizationId: orgId ?? -1,
  })

  return getCachedCollection(`members-${orgId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (member: any) => member.id,
      })
    )
  )
}

export function useOrganizationsCollection() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.organization.listMine.queryOptions()

  return getCachedCollection(`organizations`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (org: any) => org.organization.id,
      })
    )
  )
}

export function useUnitsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.units.list.queryOptions({
    organizationId: orgId ?? -1,
  })

  return getCachedCollection(`units-${orgId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (unit: any) => unit.id,
        onInsert: async ({ transaction }) => {
          if (!orgId) return
          const results = []
          for (const m of transaction.mutations) {
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
    )
  )
}

export function useProcessChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.processChart.listByUnit.queryOptions({
    organizationId: orgId ?? -1,
    unitId: unitId ?? -1,
  })

  return getCachedCollection(`pc-${orgId}-${unitId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !unitId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
        onInsert: async ({ transaction }) => {
          if (!orgId || !unitId) return
          const results = []
          for (const m of transaction.mutations) {
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
    )
  )
}

export function useAllProcessChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.processChart.listAll.queryOptions({
    organizationId: orgId ?? -1,
  })

  return getCachedCollection(`pc-all-${orgId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
      })
    )
  )
}

export function useWDCChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.wdc.listByUnit.queryOptions({
    organizationId: orgId ?? -1,
    unitId: unitId ?? -1,
  })

  return getCachedCollection(`wdc-${orgId}-${unitId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !unitId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
        onInsert: async ({ transaction }) => {
          if (!orgId || !unitId) return
          const results = []
          for (const m of transaction.mutations) {
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
    )
  )
}

export function useAllWDCChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.wdc.listAll.queryOptions({
    organizationId: orgId ?? -1,
  })

  return getCachedCollection(`wdc-all-${orgId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
      })
    )
  )
}

export function useStepsCollection(orgId?: number, pcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.processChart.listSteps.queryOptions({
    organizationId: orgId ?? -1,
    processChartId: pcId ?? -1,
  })

  return getCachedCollection(`steps-${orgId}-${pcId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !pcId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (step: any) => step.id,
        onInsert: async ({ transaction }) => {
          if (!orgId || !pcId) return
          const results = []
          for (const m of transaction.mutations) {
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
        onUpdate: async ({ transaction }) => {
          if (!orgId) return
          for (const m of transaction.mutations) {
            const { id, processChartId, sequenceNumber, ...rest } = m.modified
            await trpcClient.ws.processChart.updateStep.mutate({
              organizationId: orgId,
              stepId: m.key as number,
              ...rest,
              who: rest.who ?? undefined,
              minutes: rest.minutes ?? undefined,
              feet: rest.feet ?? undefined,
            })
          }
        },
        onDelete: async ({ transaction }) => {
          if (!orgId) return
          for (const m of transaction.mutations) {
            await trpcClient.ws.processChart.removeStep.mutate({
              organizationId: orgId,
              stepId: m.key as number,
            })
          }
        },
      })
    )
  )
}

export function useWDCEmployeesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.wdc.listEmployees.queryOptions({
    organizationId: orgId ?? -1,
    wdcId: wdcId ?? -1,
  })

  return getCachedCollection(`wdc-employees-${orgId}-${wdcId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !wdcId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (emp: any) => emp.id,
      })
    )
  )
}

export function useWDCActivitiesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.wdc.listActivities.queryOptions({
    organizationId: orgId ?? -1,
    wdcId: wdcId ?? -1,
  })

  return getCachedCollection(`wdc-activities-${orgId}-${wdcId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !wdcId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (act: any) => act.id,
      })
    )
  )
}

export function useWDCTasksCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.ws.wdc.listTasks.queryOptions({
    organizationId: orgId ?? -1,
    wdcId: wdcId ?? -1,
  })

  return getCachedCollection(`wdc-tasks-${orgId}-${wdcId}`, () =>
    createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !wdcId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (task: any) => task.id,
      })
    )
  )
}

