import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import type { QueryClient } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Collection cache — ensures a single collection instance per unique key
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectionsCache = new Map<string, any>()

export function getCachedCollection<T>(key: string, factory: () => T): T {
  if (!collectionsCache.has(key)) {
    collectionsCache.set(key, factory())
  }
  return collectionsCache.get(key) as T
}

// ---------------------------------------------------------------------------
// Helper: builds a typed collection wired to a tRPC query + optional mutations
// ---------------------------------------------------------------------------
interface CollectionOpts<TData> {
  queryClient: QueryClient
  queryKey: readonly unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFn: ((ctx: any) => any) | undefined
  enabled: boolean
  getKey: (item: TData) => number | string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInsert?: (transaction: any) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate?: (transaction: any) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: (transaction: any) => Promise<void>
}

export function buildCollection<TData extends Record<string, unknown>>(
  key: string,
  opts: CollectionOpts<TData>,
) {
  return getCachedCollection(key, () =>
    createCollection(
      queryCollectionOptions({
        queryClient: opts.queryClient,
        queryKey: opts.queryKey,
        queryFn: async (ctx) => {
          if (!opts.enabled || !opts.queryFn) return []
          return (await opts.queryFn(ctx)) as TData[]
        },
        getKey: (item) => opts.getKey(item as TData),
        ...(opts.onInsert && {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onInsert: async ({ transaction }: any) => opts.onInsert!(transaction),
        }),
        ...(opts.onUpdate && {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUpdate: async ({ transaction }: any) => opts.onUpdate!(transaction),
        }),
        ...(opts.onDelete && {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDelete: async ({ transaction }: any) => opts.onDelete!(transaction),
        }),
      }),
    ),
  )
}
