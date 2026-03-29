import { useMemo } from 'react'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'

export function useTodosCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.todos.list.queryOptions({
      organizationId: orgId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (todo: any) => todo.id,
      })
    )
  }, [orgId, queryClient, trpc])
}

export function useMembersCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.organization.listMembers.queryOptions({
      organizationId: orgId ?? -1,
    })

    return createCollection(
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
  }, [orgId, queryClient, trpc])
}

export function useOrganizationsCollection() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.organization.listMine.queryOptions()

    return createCollection(
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
  }, [queryClient, trpc])
}

export function useUnitsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.units.list.queryOptions({
      organizationId: orgId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (unit: any) => unit.id,
      })
    )
  }, [orgId, queryClient, trpc])
}

export function useProcessChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.processChart.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !unitId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
      })
    )
  }, [orgId, unitId, queryClient, trpc])
}

export function useAllProcessChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.processChart.listAll.queryOptions({
      organizationId: orgId ?? -1,
    })

    return createCollection(
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
  }, [orgId, queryClient, trpc])
}

export function useWDCChartsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.wdc.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !unitId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (chart: any) => chart.id,
      })
    )
  }, [orgId, unitId, queryClient, trpc])
}

export function useAllWDCChartsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.wdc.listAll.queryOptions({
      organizationId: orgId ?? -1,
    })

    return createCollection(
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
  }, [orgId, queryClient, trpc])
}

export function useStepsCollection(orgId?: number, pcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.processChart.listSteps.queryOptions({
      organizationId: orgId ?? -1,
      processChartId: pcId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!orgId || !pcId || !queryOptions.queryFn) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (step: any) => step.id,
      })
    )
  }, [orgId, pcId, queryClient, trpc])
}

export function useWDCEmployeesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.wdc.listEmployees.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })

    return createCollection(
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
  }, [orgId, wdcId, queryClient, trpc])
}

export function useWDCActivitiesCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.wdc.listActivities.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })

    return createCollection(
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
  }, [orgId, wdcId, queryClient, trpc])
}

export function useWDCTasksCollection(orgId?: number, wdcId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const queryOptions = trpc.ws.wdc.listTasks.queryOptions({
      organizationId: orgId ?? -1,
      wdcId: wdcId ?? -1,
    })

    return createCollection(
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
  }, [orgId, wdcId, queryClient, trpc])
}
