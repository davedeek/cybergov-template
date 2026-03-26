import { useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/_authed/todos')({
  component: TodosPage,
})

function TodosPage() {
  const [newTodo, setNewTodo] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { orgId?: number }

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const { data: todos, isLoading } = useQuery({
    ...trpc.todos.list.queryOptions({ organizationId: orgId! }),
    enabled: !!orgId,
  })

  const addMutation = useMutation(
    trpc.todos.add.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
        setNewTodo('')
      },
    }),
  )

  const toggleMutation = useMutation(
    trpc.todos.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.todos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !orgId) return
    addMutation.mutate({ organizationId: orgId, name: newTodo })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Todos</h1>
        <p className="text-gray-400 mt-1">
          Manage tasks for your workspace.
        </p>
      </div>

      {/* Add todo form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newTodo.trim() || addMutation.isPending}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {/* Todos list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : !todos?.length ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No todos yet. Add one above!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors"
            >
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    organizationId: orgId!,
                    id: todo.id,
                    completedAt: todo.completedAt ? null : new Date(),
                  })
                }
                className="flex-shrink-0 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                {todo.completedAt ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  todo.completedAt
                    ? 'line-through text-gray-500'
                    : 'text-gray-200'
                }`}
              >
                {todo.name}
              </span>
              <button
                onClick={() =>
                  deleteMutation.mutate({
                    organizationId: orgId!,
                    id: todo.id,
                  })
                }
                className="flex-shrink-0 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
