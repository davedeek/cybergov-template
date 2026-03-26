import { useCallback, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { authClient } from '@/lib/auth-client'

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
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const {
    data: workspace,
    refetch: refetchWorkspace,
    isLoading: workspaceLoading,
  } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())

  const organizationId = workspace?.organization.id

  const { data, refetch, isLoading } = useQuery({
    ...trpc.todos.list.queryOptions({
      organizationId: organizationId ?? -1,
    }),
    enabled: !!organizationId,
  })

  const [todo, setTodo] = useState('')
  const { mutate: addTodo } = useMutation({
    ...trpc.todos.add.mutationOptions(),
    onSuccess: () => {
      refetch()
      setTodo('')
    },
  })

  const submitTodo = useCallback(() => {
    if (!organizationId || todo.trim().length === 0) return
    addTodo({ organizationId, name: todo.trim() })
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
            data?.map((t) => (
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
