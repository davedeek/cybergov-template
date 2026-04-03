import { buildCollection } from './createTrpcCollection'
import { useTRPC } from '@/integrations/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMemo } from 'react'
import type { Todo } from '@/types/entities'

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
