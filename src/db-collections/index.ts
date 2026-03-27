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
        getKey: (member: any) => member.id, // Using membership id as PK
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
        getKey: (org: any) => org.organization.id, // The query returns [{ membership, organization: { id } }]
      })
    )
  }, [queryClient, trpc])
}
