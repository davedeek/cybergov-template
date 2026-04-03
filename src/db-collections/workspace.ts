import { buildCollection } from './createTrpcCollection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMemo } from 'react'
import type { Unit, ProcessChart, WdcChart, WorkCount, ProposedChange } from '@/types/entities'

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

export function useWorkCountsCollection(orgId?: number, unitId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.workCount.listByUnit.queryOptions({
      organizationId: orgId ?? -1,
      unitId: unitId ?? -1,
    })
    return buildCollection<WorkCount>(`wc-${orgId}-${unitId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId && !!unitId,
      getKey: (c) => c.id,
      onInsert: async (tx) => {
        if (!orgId || !unitId) return
        const results = []
        for (const m of tx.mutations) {
          const res = await trpcClient.ws.workCount.create.mutate({
            organizationId: orgId,
            unitId,
            name: m.modified.name,
            period: m.modified.period,
          })
          results.push(res)
        }
        return results[0]
      },
    })
  }, [orgId, unitId])
}

export function useAllWorkCountsCollection(orgId?: number) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMemo(() => {
    const qo = trpc.ws.workCount.listAll.queryOptions({ organizationId: orgId ?? -1 })
    return buildCollection<WorkCount>(`wc-all-${orgId}`, {
      queryClient,
      queryKey: qo.queryKey,
      queryFn: qo.queryFn,
      enabled: !!orgId,
      getKey: (c) => c.id,
    })
  }, [orgId])
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
