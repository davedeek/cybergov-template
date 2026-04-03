import { buildCollection } from './createTrpcCollection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { WdcEmployee, WdcActivity, WdcTask } from '@/types/entities'

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
    })
  }, [orgId, wdcId])
}
