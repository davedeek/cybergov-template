import { useCallback, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { authClient } from '@/lib/auth-client'
import { createCollection, useLiveQuery } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export const Route = createFileRoute('/demo/trpc-todo')({
  component: TRPCTodos,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.organization.getOrCreateCurrent.queryOptions(),
    )
  },
})

function TRPCTodos() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  type Workspace = { organization: { id: number; name: string } }
  type TodoItem = { id: number; name: string }
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const {
    data: workspace,
    refetch: refetchWorkspace,
    isLoading: workspaceLoading,
  } = useQuery<Workspace>(
    trpc.organization.getOrCreateCurrent.queryOptions() as any,
  )

  const organizationId = workspace?.organization.id

  const todosCollection = useMemo(() => {
    const queryOptions = trpc.todos.list.queryOptions({
      organizationId: organizationId ?? -1,
    })

    return createCollection(
      queryCollectionOptions({
        queryClient,
        queryKey: queryOptions.queryKey,
        queryFn: async (ctx) => {
          if (!organizationId) return []
          return queryOptions.queryFn(ctx)
        },
        getKey: (todo: any) => todo.id,
      }),
    )
  }, [organizationId, queryClient, trpc])

  const { data: liveTodos = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ todo: todosCollection })
        .select(({ todo }) => ({
          ...todo,
        })),
    [todosCollection],
  )

  const [todo, setTodo] = useState('')
  const { mutate: addTodo } = useMutation<any, Error, TodoItem>({
    ...(trpc.todos.add.mutationOptions() as any),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.todos.list.queryOptions({ organizationId: organizationId! })
          .queryKey,
      })
      setTodo('')
    },
  })

  const submitTodo = useCallback(() => {
    if (!organizationId || todo.trim().length === 0) return
    addTodo({ organizationId, name: todo.trim() } as any)
  }, [addTodo, organizationId, todo])

  if (sessionPending || workspaceLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!session?.user) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">tRPC Todos (SaaS mode)</h1>
        <p>
          You need to sign in first. Open <code>/demo/better-auth</code> and
          create an account.
        </p>
      </div>
    )
  }

  if (!workspace?.organization) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Workspace setup</h1>
        <p>Could not load your workspace.</p>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          onClick={() => refetchWorkspace()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 95% 5%, #4a90c2 0%, #317eb9 50%, #1e4d72 100%)',
      }}
    >
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-2xl mb-4">tRPC Todos list</h1>
        <p className="mb-4 text-sm text-white/80">
          Workspace: <strong>{workspace.organization.name}</strong>
        </p>
        <ul className="mb-4 space-y-2">
          {isLoading ? (
            <li className="text-white/70">Loading todos...</li>
          ) : (
            (liveTodos as any[])?.map((t: any) => (
            <li
              key={t.id}
              className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm shadow-md"
            >
              <span className="text-lg text-white">{t.name}</span>
            </li>
            ))
          )}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitTodo()
              }
            }}
            placeholder="Enter a new todo..."
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  )
}
