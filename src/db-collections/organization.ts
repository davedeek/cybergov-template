import { buildCollection, getCachedCollection } from './createTrpcCollection'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { OrganizationMembership } from '@/types/entities'

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
